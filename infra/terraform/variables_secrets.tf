variable "name_prefix" {
  type        = string
  description = "Project name prefix for all resources, e.g. 'mira'"
  default     = "mira"
}

variable "environment" {
  type        = string
  description = "Deployment environment, e.g. dev/stage/prod"
  default     = "dev"
}

variable "tags" {
  type        = map(string)
  description = "Common tags applied to all resources"
  default     = {}
}

variable "astrologer_api_key" {
  type        = string
  description = "Third-party Astrologer API key stored in Secrets Manager"
  sensitive   = true
  default     = "placeholder"
}