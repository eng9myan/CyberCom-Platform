output "oke_cluster_id" {
  value       = oci_containerengine_cluster.k8s.id
  description = "The OCID of the OKE cluster."
}

output "oke_cluster_endpoint" {
  value       = oci_containerengine_cluster.k8s.endpoints[0].public_endpoint
  description = "Kubernetes API endpoint."
}

output "db_system_id" {
  value       = oci_psql_db_system.db.id
  description = "PostgreSQL DB System OCID."
}

output "db_endpoints" {
  value       = oci_psql_db_system.db.network_details[0].primary_db_endpoint_private_ip
  description = "Primary PostgreSQL endpoint IP address."
}

output "object_storage_bucket_name" {
  value       = oci_objectstorage_bucket.backups.name
  description = "Backups bucket name."
}
