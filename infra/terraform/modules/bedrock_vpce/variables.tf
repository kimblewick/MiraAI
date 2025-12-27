variable "environment" {
  description = "Environment (e.g., dev, staging, prod)"
  type        = string
}

variable "name_prefix" {
  description = "Prefix used for naming"
  type        = string
}

variable "vpc_id" {
  description = "Target VPC ID"
  type        = string
}

variable "private_subnet_ids" {
  description = "Private subnet IDs to host the interface endpoint ENIs"
  type        = list(string)
}

variable "vpc_cidr_block" {
  description = "VPC CIDR block used as default allowlist when no explicit CIDRs/SGs are provided"
  type        = string
}

variable "allowed_security_group_ids" {
  description = "Optional SGs allowed to reach the endpoint (port 443)"
  type        = list(string)
  default     = []
}

variable "allowed_cidr_blocks" {
  description = "Optional CIDRs allowed to reach the endpoint (port 443). If empty, vpc_cidr_block is used."
  type        = list(string)
  default     = []
}

variable "tags" {
  description = "Extra tags"
  type        = map(string)
  default     = {}
}