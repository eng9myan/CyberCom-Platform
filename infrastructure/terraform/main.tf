# =============================================================
# CyberCom Platform - OCI Root Terraform
# Region: il-jerusalem-1 (Israel Central / Jerusalem)
#
# Secrets & OCIDs are NEVER hardcoded here. They are supplied
# via variables (terraform.tfvars / TF_VAR_* env / GitHub
# Secrets in CI). See terraform.tfvars.example.
# =============================================================

terraform {
  required_version = ">= 1.6.0"

  required_providers {
    oci = {
      source  = "oracle/oci"
      version = ">= 5.0.0"
    }
  }

  # Remote state backend (OCI Object Storage via S3-compat).
  # Configure with -backend-config in CI; left partial here so
  # no bucket/credentials are committed.
  backend "s3" {
    key                         = "cybercom/terraform.tfstate"
    region                      = "il-jerusalem-1"
    skip_region_validation      = true
    skip_credentials_validation = true
    skip_metadata_api_check     = true
    force_path_style            = true
  }
}

provider "oci" {
  region       = var.region
  tenancy_ocid = var.tenancy_ocid
  # Auth is provided by CI via OCI config / API key env vars:
  #   OCI_CLI_USER, OCI_CLI_TENANCY, OCI_CLI_FINGERPRINT,
  #   OCI_CLI_KEY_CONTENT, OCI_CLI_REGION
  # No private keys are stored in this repository.
}

# ---- Data sources: reference EXISTING infrastructure ----
# The Free Trial environment already has a VCN and a running
# ARM compute instance. We read them rather than recreate them.

data "oci_core_vcn" "cybercom" {
  vcn_id = var.vcn_ocid
}

data "oci_core_instance" "web" {
  instance_id = var.instance_ocid
}

# Availability domains in the region (for future expansion)
data "oci_identity_availability_domains" "ads" {
  compartment_id = var.compartment_ocid
}

# ---- Network security: open 80/443 to the world, restrict 22 ----
# Managed as a dedicated security list attached to the VCN.

resource "oci_core_security_list" "web" {
  compartment_id = var.compartment_ocid
  vcn_id         = var.vcn_ocid
  display_name   = "cybercom-web-seclist"

  egress_security_rules {
    destination = "0.0.0.0/0"
    protocol    = "all"
  }

  ingress_security_rules {
    protocol = "6" # TCP
    source   = "0.0.0.0/0"
    tcp_options {
      min = 80
      max = 80
    }
  }

  ingress_security_rules {
    protocol = "6"
    source   = "0.0.0.0/0"
    tcp_options {
      min = 443
      max = 443
    }
  }

  ingress_security_rules {
    protocol = "6"
    source   = var.ssh_allowed_cidr
    tcp_options {
      min = 22
      max = 22
    }
  }
}
