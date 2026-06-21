variable "environment" {
  description = "Deployment environment: development, test, staging, production"
  type        = string
  validation {
    condition     = contains(["development", "test", "staging", "production"], var.environment)
    error_message = "environment must be one of: development, test, staging, production"
  }
}

variable "namespace" {
  description = "Kubernetes namespace for CyberCom platform components"
  type        = string
  default     = "cybercom"
}

variable "db_name" {
  description = "PostgreSQL database name"
  type        = string
  default     = "cybercom"
}

variable "db_user" {
  description = "PostgreSQL application user"
  type        = string
  default     = "cybercom_app"
  sensitive   = true
}

variable "image_registry" {
  description = "Container image registry URL"
  type        = string
  default     = "ghcr.io/cybercom"
}

variable "image_tag" {
  description = "Container image tag to deploy"
  type        = string
  default     = "latest"
}

variable "replica_count_backend" {
  description = "Number of backend replicas"
  type        = number
  default     = 2
}

variable "replica_count_frontend" {
  description = "Number of frontend replicas"
  type        = number
  default     = 2
}
