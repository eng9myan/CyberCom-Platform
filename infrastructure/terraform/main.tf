/**
 * CyberCom Platform — Terraform Root Module.
 * ADR-0008 (SaaS deployment), ADR-0012 (environment management).
 * Modules compose: kubernetes, postgresql, redis, kafka, identity.
 */

terraform {
  required_version = ">= 1.7.0"

  required_providers {
    kubernetes = {
      source  = "hashicorp/kubernetes"
      version = ">= 2.29.0"
    }
    helm = {
      source  = "hashicorp/helm"
      version = ">= 2.13.0"
    }
    random = {
      source  = "hashicorp/random"
      version = ">= 3.6.0"
    }
  }

  backend "s3" {
    # Configure per environment via -backend-config flag or workspace
    # bucket = "cybercom-tfstate-${var.environment}"
    # key    = "platform/terraform.tfstate"
    # region = var.aws_region
  }
}

module "kubernetes" {
  source      = "./modules/kubernetes"
  environment = var.environment
  namespace   = var.namespace
}

module "postgresql" {
  source      = "./modules/postgresql"
  environment = var.environment
  namespace   = var.namespace
  db_name     = var.db_name
  db_user     = var.db_user

  depends_on = [module.kubernetes]
}

module "redis" {
  source      = "./modules/redis"
  environment = var.environment
  namespace   = var.namespace

  depends_on = [module.kubernetes]
}
