"""
DRF authentication bridging CyIdentityAuthMiddleware's already-verified JWT
claims into DRF's own request.user/request.auth. Required because DRF's
Request.user ignores the underlying Django request.user entirely when
DEFAULT_AUTHENTICATION_CLASSES is empty -- it always substitutes a fresh
AnonymousUser, so IsAuthenticated (and any permission checking
request.user.is_authenticated) fails for every request regardless of what
middleware sets on the raw Django request.

The JWT itself is decoded once, in CyIdentityAuthMiddleware (shared.auth) --
this class does not re-verify the signature, it just hands DRF what the
middleware already validated.
"""

from rest_framework.authentication import BaseAuthentication

from shared.auth.auth_middleware import CyIdentityUser


class CyIdentityAuthentication(BaseAuthentication):
    def authenticate(self, request):
        claims = getattr(request, "auth_claims", None)
        if not claims:
            return None
        return (CyIdentityUser(claims), claims)
