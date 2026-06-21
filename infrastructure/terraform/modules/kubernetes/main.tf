/**
 * Kubernetes namespace and RBAC foundation module.
 * ADR-0008, ADR-0010 (GitOps), ADR-0013 (service mesh).
 */

resource "kubernetes_namespace" "cybercom" {
  metadata {
    name = var.namespace
    labels = {
      "app.kubernetes.io/managed-by"  = "terraform"
      "cybercom.io/environment"       = var.environment
      "istio-injection"               = "enabled"
    }
  }
}

resource "kubernetes_resource_quota" "cybercom" {
  metadata {
    name      = "cybercom-quota"
    namespace = kubernetes_namespace.cybercom.metadata[0].name
  }

  spec {
    hard = {
      "requests.cpu"    = "8"
      "requests.memory" = "16Gi"
      "limits.cpu"      = "16"
      "limits.memory"   = "32Gi"
      pods              = "50"
      services          = "20"
    }
  }
}

resource "kubernetes_network_policy" "default_deny" {
  metadata {
    name      = "default-deny-all"
    namespace = kubernetes_namespace.cybercom.metadata[0].name
  }

  spec {
    pod_selector {}
    policy_types = ["Ingress", "Egress"]
  }
}
