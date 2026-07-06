import logging

import jwt
from jwt import PyJWKClient, ExpiredSignatureError, InvalidTokenError
from django.http import JsonResponse
from django.conf import settings

logger = logging.getLogger("cybercom.auth.session")

# JWKS client is module-level so the key set is cached across requests.
_jwks_client: PyJWKClient | None = None

def _get_jwks_client() -> PyJWKClient:
    global _jwks_client
    if _jwks_client is None:
        _jwks_client = PyJWKClient(settings.CYIDENTITY_JWKS_URI, cache_keys=True)
    return _jwks_client


def decode_jwt(token: str) -> dict:
    """
    Shared JWT validation used by both the HTTP CyIdentityAuthMiddleware and
    the WebSocket JWTAuthMiddleware (core/channels_auth.py) -- one place for
    the signing-key/algorithm/audience/issuer contract, not duplicated.
    Raises ExpiredSignatureError / InvalidTokenError on failure.
    """
    signing_key = _get_jwks_client().get_signing_key_from_jwt(token)
    return jwt.decode(
        token,
        signing_key.key,
        algorithms=["RS256"],
        audience=settings.CYIDENTITY_CLIENT_ID,
        issuer=settings.CYIDENTITY_ISSUER,
        options={"require": ["exp", "iat", "sub"]},
    )


class CyIdentityUser:
    """
    Lightweight authenticated-principal wrapper around a validated JWT's claims.
    Not a Django ORM User -- CyIdentity/Keycloak is the identity source of
    truth, there is no local user table to join against. str(request.user)
    returns the Keycloak subject (UUID), matching the `str(request.user)`
    convention used as the acting-user id throughout the product view layers.
    """

    is_authenticated = True
    is_anonymous = False

    def __init__(self, claims: dict):
        self.claims = claims
        self.id = claims.get("sub")
        self.pk = self.id
        self.email = claims.get("email")

    def __str__(self):
        return str(self.id)


def _sync_session(payload: dict) -> "object | None":
    """
    Makes the already-built SessionService/idle-timeout machinery
    (platform/cyidentity/services.py) actually bite: touches (or creates)
    a real UserSession row keyed on the JWT's `session_state` claim (the
    Keycloak SSO session id) on every authenticated request, and returns
    that session if it has already been marked revoked/idle_timeout --
    e.g. by the `cyidentity.enforce_idle_timeout` Celery task -- so the
    caller can reject the request even though the JWT itself is still
    cryptographically valid until its own (short) expiry.

    Deliberately fails open: any error here (missing realm, DB hiccup) is
    logged and swallowed, never blocks authentication. This is a
    defense-in-depth / audit feature layered on top of JWT validation,
    not a replacement for it -- a bug here must never lock out every
    authenticated request platform-wide.
    """
    try:
        from platform.cyidentity.models import IdentityRealm, UserProfile, UserSession

        session_state = payload.get("session_state")
        sub = payload.get("sub")
        if not session_state or not sub:
            return None

        issuer = payload.get("iss", "")
        realm_name = issuer.rstrip("/").rsplit("/realms/", 1)[-1] if "/realms/" in issuer else None
        realm = IdentityRealm.objects.filter(realm_name=realm_name).first() if realm_name else None
        if realm is None:
            return None

        profile, _ = UserProfile.objects.get_or_create(
            keycloak_user_id=sub,
            defaults={
                "realm": realm,
                "tenant_id": payload.get("tenant_id") or realm.tenant_id,
                "username": payload.get("preferred_username") or sub,
                "email": payload.get("email", ""),
            },
        )
        session, created = UserSession.objects.get_or_create(
            keycloak_session_id=session_state,
            defaults={"tenant_id": profile.tenant_id, "user": profile},
        )
        if session.status != "active":
            return session
        if not created:
            session.touch()
        return None
    except Exception:
        logger.exception("Session sync failed (non-fatal, request proceeds)")
        return None


class CyIdentityAuthMiddleware:
    """
    Validates RS256 JWT tokens issued by CyIdentity/Keycloak via JWKS.
    Injects request.user_session containing roles, permissions, and tenant ID,
    and sets request.user to a CyIdentityUser so DRF's IsAuthenticated (which
    checks request.user.is_authenticated) recognizes the request as
    authenticated -- Django's own AuthenticationMiddleware only ever produces
    AnonymousUser here since there is no session, and DEFAULT_AUTHENTICATION_CLASSES
    is intentionally empty (auth happens here, not in DRF).
    """
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        if request.path in [
            '/health', '/health/liveness', '/health/readiness',
            '/api/v1/identity/healthz/', '/api/v1/identity/metrics',
            '/api/v1/identity/token/validate/'
        ]:
            return self.get_response(request)

        if request.path.startswith('/api/v1/public/'):
            return self.get_response(request)

        auth_header = request.headers.get('Authorization', None)
        if not auth_header or not auth_header.startswith('Bearer '):
            return JsonResponse({"detail": "Authentication credentials were not provided."}, status=401)

        token = auth_header.split(' ')[1]
        try:
            payload = decode_jwt(token)
            stale_session = _sync_session(payload)
            if stale_session is not None:
                return JsonResponse(
                    {"detail": "Session has been revoked or timed out. Please sign in again."},
                    status=401,
                )

            request.auth_claims = payload
            request.user = CyIdentityUser(payload)
            request.user_session = {
                "user_id": payload.get("sub"),
                "email": payload.get("email"),
                "tenant_id": payload.get("tenant_id"),
                "roles": payload.get("roles") or payload.get("realm_access", {}).get("roles", []),
                "permissions": payload.get("permissions", [])
            }
        except ExpiredSignatureError:
            return JsonResponse({"detail": "Token has expired."}, status=401)
        except InvalidTokenError:
            return JsonResponse({"detail": "Invalid token."}, status=401)

        return self.get_response(request)
