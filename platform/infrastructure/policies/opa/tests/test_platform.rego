package cybercom.platform.authz_test

import data.cybercom.platform.authz

# Platform admin can do anything
test_platform_admin_allow if {
    authz.allow with input as {
        "user": {"user_id": "u1", "tenant_id": "t1", "roles": ["platform_admin"]},
        "action": "delete",
        "resource": {"type": "tenant", "tenant_id": "t2"},
        "request": {"ip": "1.2.3.4"},
    }
}

# Unknown role is denied
test_unknown_role_deny if {
    not authz.allow with input as {
        "user": {"user_id": "u2", "tenant_id": "t1", "roles": ["unknown_role"]},
        "action": "read",
        "resource": {"type": "patient_record", "tenant_id": "t1"},
        "request": {"ip": "10.240.0.5"},
    }
}

# Doctor reads patient in clinical subnet — allowed
test_doctor_reads_patient_clinical_ip if {
    authz.allow with input as {
        "user": {"user_id": "doc1", "tenant_id": "t1", "roles": ["doctor"]},
        "action": "read",
        "resource": {"type": "patient_record", "tenant_id": "t1"},
        "request": {"ip": "10.240.1.50"},
        "break_glass": false,
        "break_glass_reason": "",
    }
}

# Doctor reads patient outside clinical subnet — denied (no break-glass)
test_doctor_reads_patient_outside_subnet_deny if {
    not authz.allow with input as {
        "user": {"user_id": "doc1", "tenant_id": "t1", "roles": ["doctor"]},
        "action": "read",
        "resource": {"type": "patient_record", "tenant_id": "t1"},
        "request": {"ip": "8.8.8.8"},
        "break_glass": false,
        "break_glass_reason": "",
    }
}

# Break-glass allows access even outside clinical subnet
test_break_glass_allow if {
    authz.allow with input as {
        "user": {"user_id": "doc1", "tenant_id": "t1", "roles": ["doctor"]},
        "action": "read",
        "resource": {"type": "patient_record", "tenant_id": "t1"},
        "request": {"ip": "8.8.8.8"},
        "break_glass": true,
        "break_glass_reason": "Emergency resuscitation",
    }
}
