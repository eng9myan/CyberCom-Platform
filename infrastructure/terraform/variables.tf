# =============================================================
# CyberCom Platform - Terraform input variables
# All OCIDs / secrets are supplied at runtime (tfvars / env /
# GitHub Secrets). Nothing sensitive is defaulted here.
# =============================================================

variable "region" {
  description = "OCI region identifier."
  type        = string
  default     = "il-jerusalem-1"
}

variable "tenancy_ocid" {
  description = "OCID of the tenancy. Provided via TF_VAR_tenancy_ocid."
  type        = string
}

variable "compartment_ocid" {
  description = "OCID of the target compartment. For Free Trial this equals the tenancy OCID (root compartment)."
  type        = string
}

variable "vcn_ocid" {
  description = "OCID of the existing VCN to attach the security list to."
  type        = string
}

variable "instance_ocid" {
  description = "OCID of the existing ARM compute instance (cybercom-web)."
  type        = string
}

variable "ssh_allowed_cidr" {
  description = "CIDR block allowed to reach SSH (port 22). Restrict to admin IPs; do NOT leave 0.0.0.0/0 in production."
  type        = string
  default     = "0.0.0.0/0"

  validation {
    condition     = can(cidrhost(var.ssh_allowed_cidr, 0))
    error_message = "ssh_allowed_cidr must be a valid CIDR block (e.g. 203.0.113.10/32)."
  }
}

variable "environment" {
  description = "Deployment environment name."
  type        = string
  default     = "production"

  validation {
    condition     = contains(["develop", "staging", "production"], var.environment)
    error_message = "environment must be one of: develop, staging, production."
  }
}
