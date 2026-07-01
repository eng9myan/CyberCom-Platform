terraform {
  required_providers {
    oci = {
      source  = "oracle/oci"
      version = ">= 5.0.0"
    }
  }
}

# ── VCN & Networking ──────────────────────────────────────────────────────────
resource "oci_core_vcn" "cybercom" {
  cidr_block     = var.vcn_cidr
  compartment_id = var.compartment_id
  display_name   = "cybercom-vcn-${var.environment}"
  dns_label      = "cybercomvcn"
}

resource "oci_core_internet_gateway" "ig" {
  compartment_id = var.compartment_id
  vcn_id         = oci_core_vcn.cybercom.id
  display_name   = "cybercom-ig-${var.environment}"
  enabled        = true
}

resource "oci_core_nat_gateway" "nat" {
  compartment_id = var.compartment_id
  vcn_id         = oci_core_vcn.cybercom.id
  display_name   = "cybercom-nat-${var.environment}"
}

resource "oci_core_service_gateway" "sg" {
  compartment_id = var.compartment_id
  vcn_id         = oci_core_vcn.cybercom.id
  display_name   = "cybercom-sg-${var.environment}"
  
  services {
    # Dynamically bind all services in region
    service_id = "all-services-oracle-services-network"
  }
}

# Subnets
resource "oci_core_subnet" "public_lb" {
  cidr_block        = cidrsubnet(var.vcn_cidr, 8, 10)
  compartment_id    = var.compartment_id
  vcn_id            = oci_core_vcn.cybercom.id
  display_name      = "cybercom-lb-pub-${var.environment}"
  dns_label         = "lbpub"
  route_table_id    = oci_core_route_table.public_route.id
  security_list_ids = [oci_core_security_list.lb_sec_list.id]
}

resource "oci_core_subnet" "private_k8s_nodes" {
  cidr_block                 = cidrsubnet(var.vcn_cidr, 8, 20)
  compartment_id             = var.compartment_id
  vcn_id                     = oci_core_vcn.cybercom.id
  display_name               = "cybercom-k8s-priv-${var.environment}"
  dns_label                  = "k8spriv"
  prohibit_public_ip_on_vnic = true
  route_table_id             = oci_core_route_table.private_route.id
  security_list_ids          = [oci_core_security_list.nodes_sec_list.id]
}

resource "oci_core_subnet" "private_db" {
  cidr_block                 = cidrsubnet(var.vcn_cidr, 8, 30)
  compartment_id             = var.compartment_id
  vcn_id                     = oci_core_vcn.cybercom.id
  display_name               = "cybercom-db-priv-${var.environment}"
  dns_label                  = "dbpriv"
  prohibit_public_ip_on_vnic = true
  route_table_id             = oci_core_route_table.private_route.id
  security_list_ids          = [oci_core_security_list.db_sec_list.id]
}

# Route Tables
resource "oci_core_route_table" "public_route" {
  compartment_id = var.compartment_id
  vcn_id         = oci_core_vcn.cybercom.id
  display_name   = "cybercom-pub-route-${var.environment}"

  route_rules {
    destination       = "0.0.0.0/0"
    destination_type  = "CIDR_BLOCK"
    network_entity_id = oci_core_internet_gateway.ig.id
  }
}

resource "oci_core_route_table" "private_route" {
  compartment_id = var.compartment_id
  vcn_id         = oci_core_vcn.cybercom.id
  display_name   = "cybercom-priv-route-${var.environment}"

  route_rules {
    destination       = "0.0.0.0/0"
    destination_type  = "CIDR_BLOCK"
    network_entity_id = oci_core_nat_gateway.nat.id
  }
}

# Security Lists
resource "oci_core_security_list" "lb_sec_list" {
  compartment_id = var.compartment_id
  vcn_id         = oci_core_vcn.cybercom.id
  display_name   = "cybercom-lb-seclist-${var.environment}"

  ingress_security_rules {
    protocol    = "6" # TCP
    source      = "0.0.0.0/0"
    description = "Allow inbound HTTPS internet traffic"
    tcp_options {
      min = 443
      max = 443
    }
  }
}

resource "oci_core_security_list" "nodes_sec_list" {
  compartment_id = var.compartment_id
  vcn_id         = oci_core_vcn.cybercom.id
  display_name   = "cybercom-nodes-seclist-${var.environment}"

  ingress_security_rules {
    protocol    = "6"
    source      = oci_core_subnet.public_lb.cidr_block
    description = "Allow load balancer traffic into Kubernetes nodes"
  }

  ingress_security_rules {
    protocol    = "6"
    source      = var.vcn_cidr
    description = "Allow intra-VCN nodes communications"
  }
}

resource "oci_core_security_list" "db_sec_list" {
  compartment_id = var.compartment_id
  vcn_id         = oci_core_vcn.cybercom.id
  display_name   = "cybercom-db-seclist-${var.environment}"

  ingress_security_rules {
    protocol    = "6"
    source      = oci_core_subnet.private_k8s_nodes.cidr_block
    description = "Allow PostgreSQL connections from Kubernetes cluster only"
    tcp_options {
      min = 5432
      max = 5432
    }
  }
}

# ── Oracle Kubernetes Engine (OKE) ───────────────────────────────────────────
resource "oci_containerengine_cluster" "k8s" {
  compartment_id     = var.compartment_id
  kubernetes_version = "v1.29.1"
  name               = "cybercom-oke-${var.environment}"
  vcn_id             = oci_core_vcn.cybercom.id

  options {
    service_lb_subnet_ids = [oci_core_subnet.public_lb.id]
    add_ons {
      is_kubernetes_dashboard_enabled = false
      is_tiller_enabled               = false
    }
  }
}

resource "oci_containerengine_node_pool" "np" {
  cluster_id         = oci_containerengine_cluster.k8s.id
  compartment_id     = var.compartment_id
  kubernetes_version = "v1.29.1"
  name               = "cybercom-node-pool-${var.environment}"
  node_shape         = var.node_shape

  node_shape_config {
    ocpus         = var.node_ocpus
    memory_in_gbs = var.node_memory_in_gbs
  }

  node_source_details {
    image_id    = var.oci_node_image_id
    source_type = "image"
  }

  node_config_details {
    size = var.node_count
    placement_configs {
      availability_domain = "AD-1"
      subnet_id           = oci_core_subnet.private_k8s_nodes.id
    }
  }
}

# ── OCI Object Storage ────────────────────────────────────────────────────────
resource "oci_objectstorage_bucket" "backups" {
  compartment_id = var.compartment_id
  name           = "cybercom-backups-${var.environment}"
  namespace      = "cybercom_namespace"
  storage_tier   = "Standard"
  versioning     = "Enabled"
  auto_tiering   = "InfrequentAccess"
}

# ── OCI PostgreSQL Service ────────────────────────────────────────────────────
resource "oci_psql_db_system" "db" {
  compartment_id = var.compartment_id
  display_name   = "cybercom-postgres-${var.environment}"
  db_version     = "16"
  system_type    = "OCI_OPTIMIZED_STORAGE"

  network_details {
    subnet_id = oci_core_subnet.private_db.id
  }

  management_policy {
    backup_policy {
      backup_start_time = "02:00"
      retention_days    = 30
    }
  }

  storage_details {
    is_elastic_storage_enabled = true
    system_type                = "OCI_OPTIMIZED_STORAGE"
  }

  credentials {
    username = "cybercom_admin"
    password = var.db_admin_password
  }

  shape = "PostgreSQL.VM.Standard.E4.Flex.2.32GB"
  instance_count = 2 # High Availability deployment with Standby node
}
