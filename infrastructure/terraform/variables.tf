variable "region" {
  description = "AWS region used for every resource"
  type        = string
  default     = "ap-south-1"
}

variable "project" {
  description = "Short name used as a prefix in resource names"
  type        = string
  default     = "ctm"
}

variable "vpc_cidr" {
  type    = string
  default = "10.0.0.0/16"
}

variable "enable_nat" {
  description = "Create a NAT Gateway so private app instances can reach the internet (billed hourly)"
  type        = bool
  default     = true
}
