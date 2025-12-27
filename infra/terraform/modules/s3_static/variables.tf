# modules/s3_static/variables.tf

variable "frontend_bucket_name" {
  type        = string
  description = "Name of the S3 bucket for hosting the SPA frontend (will be private, used via CloudFront OAC)."
}

variable "artifacts_bucket_name" {
  type        = string
  description = "Name of the S3 bucket for storing generated astrology artifacts."
}

variable "tags" {
  type        = map(string)
  default     = {}
  description = "Tags applied to all S3 buckets."
}

variable "artifacts_lifecycle_enabled" {
  type        = bool
  default     = true
  description = "Whether to enable lifecycle rules on the artifacts bucket."
}

variable "artifacts_lifecycle_expiration_days" {
  type        = number
  default     = 365
  description = "Number of days after which non-current artifact versions expire."
}

variable "cloudfront_oai_id" {
  description = "CloudFront Origin Access Identity ID for S3 bucket policy"
  type        = string
  default     = ""
}