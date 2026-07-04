variable "namespace" {
  type = string
}
variable "environment" {
  type = string
}
variable "db_name" {
  type    = string
  default = "cybercom"
}
variable "db_user" {
  type      = string
  sensitive = true
}
