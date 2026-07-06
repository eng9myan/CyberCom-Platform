"""
WebSocket JWT authentication for Django Channels. Mirrors
shared.auth.auth_middleware.CyIdentityAuthMiddleware's contract, but a WS
handshake can't carry an Authorization header from a browser client, so the
token and tenant id travel as query params instead: ws://.../?token=...&tenant_id=...
"""
from __future__ import annotations

from urllib.parse import parse_qs

from channels.middleware import BaseMiddleware
from jwt import ExpiredSignatureError, InvalidTokenError

from shared.auth.auth_middleware import decode_jwt


class JWTAuthMiddleware(BaseMiddleware):
    async def __call__(self, scope, receive, send):
        query_string = scope.get("query_string", b"").decode()
        params = parse_qs(query_string)
        token = (params.get("token") or [None])[0]
        tenant_id = (params.get("tenant_id") or [None])[0]

        scope["auth_claims"] = None
        scope["tenant_id"] = None

        if token:
            try:
                payload = decode_jwt(token)
                claim_tenant_id = payload.get("tenant_id")
                if tenant_id and claim_tenant_id and str(tenant_id) != str(claim_tenant_id):
                    # tenant_id param must match the token's own claim -- never trust
                    # a client-supplied tenant id that disagrees with the signed JWT.
                    scope["auth_claims"] = None
                else:
                    scope["auth_claims"] = payload
                    scope["tenant_id"] = claim_tenant_id or tenant_id
            except (ExpiredSignatureError, InvalidTokenError):
                scope["auth_claims"] = None

        return await super().__call__(scope, receive, send)


def JWTAuthMiddlewareStack(inner):
    return JWTAuthMiddleware(inner)
