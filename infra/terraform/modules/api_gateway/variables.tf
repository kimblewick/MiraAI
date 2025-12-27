variable "name_prefix" {
  type        = string
  description = "Project/name prefix"
}

variable "environment" {
  type        = string
  description = "Environment name (e.g. dev, stage, prod)"
}

variable "lambda_function_arn" {
  type        = string
  description = "ARN of the Lambda function handling API requests"
}

variable "cognito_user_pool_id" {
  type        = string
  description = "Cognito User Pool ID for JWT auth"
}

variable "cognito_app_client_id" {
  type        = string
  description = "Cognito App Client ID (audience)"
}

variable "region" {
  type        = string
  description = "AWS region"
}

variable "tags" {
  type        = map(string)
  description = "Additional tags to apply"
  default     = {}
}
