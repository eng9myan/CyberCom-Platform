variable "compartment_id" {
  type        = string
  description = "OCI Compartment ID where all resources will be provisioned."
}

variable "region" {
  type        = string
  default     = "me-dubai-1"
  description = "OCI Region target."
}

variable "environment" {
  type        = string
  description = "Target environment (dev, staging, prod)."
}

variable "vcn_cidr" {
  type        = string
  default     = "10.0.0.0/16"
  description = "CIDR block for the VCN."
}

variable "node_shape" {
  type        = string
  default     = "VM.Standard.E4.Flex"
  description = "OCI Compute shape for OKE worker nodes."
}

variable "node_ocpus" {
  type        = number
  default     = 2
  description = "Number of OCPUs per worker node."
}

variable "node_memory_in_gbs" {
  type        = number
  default     = 16
  description = "Memory size in GBs per worker node."
}

variable "node_count" {
  type        = number
  default     = 3
  description = "Number of worker nodes in the OKE pool."
}

variable "db_admin_password" {
  type        = string
  sensitive   = true
  description = "Administrator password for the managed PostgreSQL system."
}
