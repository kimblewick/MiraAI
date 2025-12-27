variable "environment" {
  type = string
}
variable "name_prefix" {
  type = string
}

variable "function_name" {
  type = string
}
variable "runtime" {
  type = string
}
variable "handler" {
  type = string
}

variable "memory_size" {
  type    = number
  default = 256
}
variable "timeout" {
  type    = number
  default = 10
}
variable "environment_variables" {
  type    = map(string)
  default = {}
}

# Packaging: Use exactly one of (source_dir) or (s3_bucket + s3_key)
variable "source_dir" {
  type    = string
  default = null
}
variable "s3_bucket" {
  type    = string
  default = null
}
variable "s3_key" {
  type    = string
  default = null
}

# Optional VPC config
variable "subnet_ids" {
  type    = list(string)
  default = []
}
variable "security_group_ids" {
  type    = list(string)
  default = []
}

variable "log_retention_in_days" {
  type    = number
  default = 7
}
variable "tags" {
  type    = map(string)
  default = {}
}

# HTTP API options
variable "create_http_api" {
  type    = bool
  default = true
}
variable "route_keys" {
  type    = list(string)
  default = ["GET /", "ANY /{proxy+}"]
}
variable "stage_name" {
  type    = string
  default = "$default"
}

variable "astrologer_api_secret_arn" {
  type        = string
  description = "ARN of the Secrets Manager secret that stores the Astrologer API key"
}

variable "dynamodb_userprofiles_arn" {
  type        = string
  description = "ARN of DynamoDB UserProfiles table"
}

variable "dynamodb_conversations_arn" {
  type        = string
  description = "ARN of DynamoDB Conversations table"
}


variable "bedrock_model_arns" {
  type        = list(string)
  description = "ARNs of Bedrock models that this Lambda is allowed to invoke"
  # A broad default value to facilitate backend debugging, and then tighten it to a specific model later.
  default = [
    "arn:aws:bedrock:us-east-1::foundation-model/*"
  ]
}

variable "s3_charts_bucket_name" {
  type        = string
  description = "S3 bucket name used to store generated charts"
}

variable "tracing_mode" {
  description = "Lambda X-Ray tracing mode (Active or PassThrough)"
  type        = string
  default     = "Active"
  validation {
    condition     = contains(["Active", "PassThrough"], var.tracing_mode)
    error_message = "Tracing mode must be either 'Active' or 'PassThrough'."
  }
}