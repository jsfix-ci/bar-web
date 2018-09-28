variable "product" {
  default = "bar"
}

variable "raw_product" {
  default = "bar-web" // jenkins-library overrides product for PRs and adds e.g. pr-118-cmc
}

variable "location" {
  type    = "string"
  default = "UK South"
}

variable "env" {}

variable "subscription" {}

variable "ilbIp"{}

variable "tenant_id" {}

variable "jenkins_AAD_objectId" {
  type                        = "string"
  description                 = "(Required) The Azure AD object ID of a user, service principal or security group in the Azure Active Directory tenant for the vault. The object ID must be unique for the list of access policies."
}

variable "node_environment" {
  default = "sandbox"
}

variable "idam_api_url" {
  default = "http://betaDevAccidamAppLB.reform.hmcts.net"
}

variable "authentication_web_url" {
  default = "https://idam.dev.ccidam.reform.hmcts.net/login"
}

variable "vault_section" {
  default = "dev"
}

variable "external_host_name" {
  default = "bar.saat.platform.hmcts.net"
}

variable "product_url" {
  default = "manage-payments.platform.hmcts.net"
}

variable "capacity" {
  default = "1"
}
variable "common_tags" {
  type = "map"
}
variable "is_frontend" {
  default = true
}
variable "skip_functional_tests" {
  default = false
}
variable "asp_name" {
  type = "string"
  default = "bar-noprod-asp"
}

variable "asp_rg" {
  type = "string"
  default = "bar-noprod-rg"
}
