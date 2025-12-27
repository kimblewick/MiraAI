variable "name_prefix" {
  type        = string
  description = "Project/name prefix for resources"
}

variable "environment" {
  type        = string
  description = "Environment name, e.g. dev/stage/prod"
}

variable "vpc_id" {
  type        = string
  description = "VPC ID where the Gateway endpoints will be created"
}

variable "private_route_table_ids" {
  type        = list(string)
  description = "Route table IDs for private subnets that should use S3/DynamoDB Gateway endpoints"
}

variable "tags" {
  type        = map(string)
  description = "Additional tags to apply"
  default     = {}
}
