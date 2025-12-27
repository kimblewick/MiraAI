variable "app_name" {
  type        = string
  description = "Application name used as a prefix for DynamoDB tables."
  default     = "mira"
}

variable "env" {
  type        = string
  description = "Deployment environment (e.g., dev, staging, prod)."
}

variable "tags" {
  type        = map(string)
  description = "Additional tags to apply to DynamoDB tables."
  default     = {}
}
