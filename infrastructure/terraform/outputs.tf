# =============================================================
# CyberCom Platform - Terraform outputs
# =============================================================

output "region" {
  description = "OCI region the stack is deployed in."
  value       = var.region
}

output "web_instance_public_ip" {
  description = "Public IP of the cybercom-web compute instance."
  value       = data.oci_core_instance.web.public_ip
}

output "web_instance_private_ip" {
  description = "Private IP of the cybercom-web compute instance."
  value       = data.oci_core_instance.web.private_ip
}

output "web_instance_state" {
  description = "Lifecycle state of the compute instance."
  value       = data.oci_core_instance.web.state
}

output "vcn_cidr_blocks" {
  description = "CIDR blocks of the VCN."
  value       = data.oci_core_vcn.cybercom.cidr_blocks
}

output "security_list_id" {
  description = "OCID of the web security list managed by this stack."
  value       = oci_core_security_list.web.id
}

output "availability_domains" {
  description = "Availability domains available in the region."
  value       = [for ad in data.oci_identity_availability_domains.ads.availability_domains : ad.name]
}
