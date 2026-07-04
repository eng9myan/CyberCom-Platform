package cybercom.platform.authz

# CyberCom OPA Authorization Policy. ADR-0005, security_implementation_architecture §2.
# Hybrid RBAC + ABAC model. Policies are data, not code.

import future.keywords.if
import future.keywords.in

default allow = false

# ── Platform Admin: full access ──────────────────────────────────────────────
allow if {
    "platform_admin" in input.user.roles
}

# ── Tenant Admin: full access within own tenant ──────────────────────────────
allow if {
    "tenant_admin" in input.user.roles
    input.user.tenant_id == input.resource.tenant_id
}

# ── Read-only access ─────────────────────────────────────────────────────────
allow if {
    input.action == "read"
    "viewer" in input.user.roles
    input.user.tenant_id == input.resource.tenant_id
}

# ── Clinical: doctors read patient records within approved IP subnet ──────────
allow if {
    input.action in ["read", "create", "update"]
    "doctor" in input.user.roles
    input.resource.type == "patient_record"
    input.user.tenant_id == input.resource.tenant_id
    ip_in_clinical_range(input.request.ip)
}

# ── Break-glass: emergency override with audit trigger ───────────────────────
allow if {
    input.action in ["read", "create", "update"]
    "doctor" in input.user.roles
    input.resource.type == "patient_record"
    input.break_glass == true
    input.break_glass_reason != ""
}

# ── Helper: clinical IP range check ──────────────────────────────────────────
ip_in_clinical_range(ip) if {
    net.cidr_contains("10.240.0.0/16", ip)
}
ip_in_clinical_range(ip) if {
    net.cidr_contains("192.168.0.0/16", ip)
}

# ── Audit decisions ───────────────────────────────────────────────────────────
audit_log := {
    "user_id": input.user.user_id,
    "tenant_id": input.user.tenant_id,
    "action": input.action,
    "resource": input.resource,
    "decision": allow,
    "reasons": reasons,
}

reasons contains "platform_admin" if { "platform_admin" in input.user.roles }
reasons contains "tenant_admin_in_tenant" if { "tenant_admin" in input.user.roles; input.user.tenant_id == input.resource.tenant_id }
reasons contains "break_glass" if { input.break_glass == true }
reasons := set() if { not allow }
