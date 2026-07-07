"""
CyIdentity permissions.

Two layers:
  - RealmPermission / RolePermission / BreakGlassPermission:
    object-level permission checks on CyIdentity models.
  - TokenHasRealmRole / TokenHasScope:
    JWT-claim-based checks that work with the validated bearer token.
"""

from __future__ import annotations

from rest_framework import permissions

SAFE_METHODS = ("GET", "HEAD", "OPTIONS")


class IsPlatformAdmin(permissions.BasePermission):
    """Allows access only to callers carrying the `platform_admin` role claim."""

    message = "Platform admin role required."

    def has_permission(self, request, view) -> bool:
        token = getattr(request, "auth_claims", None) or {}
        roles = set(token.get("realm_access", {}).get("roles", []) or [])
        return "platform_admin" in roles or "cyidentity_admin" in roles


class ReadOnlyOrPlatformAdmin(permissions.BasePermission):
    def has_permission(self, request, view) -> bool:
        if request.method in SAFE_METHODS:
            return True
        token = getattr(request, "auth_claims", None) or {}
        roles = set(token.get("realm_access", {}).get("roles", []) or [])
        return "platform_admin" in roles or "cyidentity_admin" in roles


class IsTenantScoped(permissions.BasePermission):
    """Object-level: caller must be operating inside the tenant of the object."""

    def has_object_permission(self, request, view, obj) -> bool:
        token = getattr(request, "auth_claims", None) or {}
        claim_tenant = token.get("tenant_id")
        obj_tenant = getattr(obj, "tenant_id", None)
        if claim_tenant is None or obj_tenant is None:
            return False
        return str(claim_tenant).lower() == str(obj_tenant).lower()


class BreakGlassRequiresDualApproval(permissions.BasePermission):
    """Break-glass approve/activate require both approver + second_approver set."""

    def has_permission(self, request, view) -> bool:
        if view.action not in {"approve", "activate"}:
            return True
        body = request.data if isinstance(request.data, dict) else {}
        if view.action == "approve":
            return bool(body.get("approver")) and bool(body.get("second_approver"))
        return True


class TokenHasRealmRole(permissions.BasePermission):
    required_role: str = ""

    def has_permission(self, request, view) -> bool:
        token = getattr(request, "auth_claims", None) or {}
        roles = set(token.get("realm_access", {}).get("roles", []) or [])
        return self.required_role in roles


FINANCE_ROLES = {
    "platform_admin",
    "hospital_admin",
    "billing_clerk",
    "billing_admin",
    "finance_admin",
    "group_cfo",
    "revenue_cycle_manager",
}


class HasFinanceAccess(permissions.BasePermission):
    """
    Gates billing/GL/finance endpoints to staff with an explicit financial
    or administrative mandate. A clinical role (nurse, physician, etc.)
    carries no financial-data access by default.
    """

    message = "Billing/finance role required."

    def has_permission(self, request, view) -> bool:
        token = getattr(request, "auth_claims", None) or {}
        roles = set(token.get("realm_access", {}).get("roles", []) or [])
        return bool(roles & FINANCE_ROLES)


HR_ROLES = {
    "platform_admin",
    "hospital_admin",
    "hr_admin",
    "hr_director",
    "payroll_admin",
}


class HasHRAccess(permissions.BasePermission):
    """
    Gates HR/payroll endpoints (employee records, leave, salary data) to
    staff with an explicit HR mandate. Clinical roles carry no HR-data
    access by default -- payroll in particular is employee PII.
    """

    message = "HR/payroll role required."

    def has_permission(self, request, view) -> bool:
        token = getattr(request, "auth_claims", None) or {}
        roles = set(token.get("realm_access", {}).get("roles", []) or [])
        return bool(roles & HR_ROLES)


PROCUREMENT_ROLES = {
    "platform_admin",
    "hospital_admin",
    "procurement_admin",
    "inventory_admin",
    "warehouse_manager",
    "finance_admin",
    "group_cfo",
}


class HasProcurementAccess(permissions.BasePermission):
    """
    Gates procurement/inventory/asset endpoints (purchase orders,
    requisitions, vendor invoices, stock, fixed assets) to staff with an
    explicit operations/finance mandate.
    """

    message = "Procurement/inventory role required."

    def has_permission(self, request, view) -> bool:
        token = getattr(request, "auth_claims", None) or {}
        roles = set(token.get("realm_access", {}).get("roles", []) or [])
        return bool(roles & PROCUREMENT_ROLES)


class TokenHasScope(permissions.BasePermission):
    required_scope: str = ""

    def has_permission(self, request, view) -> bool:
        token = getattr(request, "auth_claims", None) or {}
        scope = token.get("scope") or ""
        scopes = set(scope.split()) if isinstance(scope, str) else set(token.get("scp", []) or [])
        return self.required_scope in scopes


class HasExternalGatewayAccess(permissions.BasePermission):
    """
    Gates the external-system ingestion gateway (products/cymed/rcm/billing's
    /api/v1/gateway/external-invoice/) to an explicitly provisioned
    integration service account -- a Keycloak client-credentials-grant token
    (OAuth2 client_credentials is exactly what "service account" means here)
    carrying either the `integration:ingest` scope or the
    `integration_service` realm role. Never satisfied by an ordinary
    interactive user session, however privileged -- this endpoint accepts
    payloads from outside the platform and should only ever be reachable by
    a token minted specifically for that purpose.
    """

    message = "A provisioned integration service-account token (integration:ingest scope or integration_service role) is required."

    def has_permission(self, request, view) -> bool:
        token = getattr(request, "auth_claims", None) or {}
        roles = set(token.get("realm_access", {}).get("roles", []) or [])
        scope = token.get("scope") or ""
        scopes = set(scope.split()) if isinstance(scope, str) else set(token.get("scp", []) or [])
        return "integration_service" in roles or "integration:ingest" in scopes
