/**
 * Redis cache deployment. ADR-0001 (platform stack).
 */

resource "kubernetes_deployment" "redis" {
  metadata {
    name      = "redis"
    namespace = var.namespace
    labels = {
      "app.kubernetes.io/name"      = "redis"
      "app.kubernetes.io/component" = "cache"
      "app.kubernetes.io/part-of"   = "cybercom-platform"
    }
  }

  spec {
    replicas = 1

    selector {
      match_labels = { "app" = "redis" }
    }

    template {
      metadata {
        labels = { "app" = "redis" }
      }

      spec {
        security_context {
          run_as_non_root = true
          run_as_user     = 999
        }

        container {
          name  = "redis"
          image = "redis:7-alpine"
          command = [
            "redis-server",
            "--maxmemory", "512mb",
            "--maxmemory-policy", "allkeys-lru",
            "--save", "",
          ]

          port {
            container_port = 6379
          }

          resources {
            requests = { cpu = "100m", memory = "256Mi" }
            limits   = { cpu = "500m", memory = "512Mi" }
          }

          liveness_probe {
            exec { command = ["redis-cli", "ping"] }
            initial_delay_seconds = 10
            period_seconds        = 10
          }
        }
      }
    }
  }
}

resource "kubernetes_service" "redis" {
  metadata {
    name      = "redis"
    namespace = var.namespace
  }
  spec {
    selector = { "app" = "redis" }
    port {
      port        = 6379
      target_port = 6379
    }
  }
}
