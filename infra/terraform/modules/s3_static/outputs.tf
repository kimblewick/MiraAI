# modules/s3_static/outputs.tf

output "frontend_bucket_name" {
  value       = aws_s3_bucket.frontend.bucket
  description = "Name of the frontend SPA bucket."
}

output "frontend_bucket_arn" {
  value       = aws_s3_bucket.frontend.arn
  description = "ARN of the frontend SPA bucket."
}

output "artifacts_bucket_name" {
  value       = aws_s3_bucket.artifacts.bucket
  description = "Name of the artifacts bucket."
}

output "artifacts_bucket_arn" {
  value       = aws_s3_bucket.artifacts.arn
  description = "ARN of the artifacts bucket."
}

output "frontend_website_endpoint" {
  description = "S3 bucket website endpoint"
  value       = aws_s3_bucket_website_configuration.frontend.website_endpoint
}

output "frontend_website_domain" {
  description = "S3 bucket website domain"
  value       = aws_s3_bucket_website_configuration.frontend.website_domain
}

output "cloudfront_oai_arn" {
  description = "CloudFront OAI ARN"
  value       = aws_cloudfront_origin_access_identity.frontend.iam_arn
}

output "cloudfront_oai_path" {
  description = "CloudFront OAI path"
  value       = aws_cloudfront_origin_access_identity.frontend.cloudfront_access_identity_path
}

# CloudFront Distribution outputs
output "cloudfront_distribution_id" {
  description = "CloudFront distribution ID"
  value       = aws_cloudfront_distribution.frontend.id
}

output "cloudfront_distribution_arn" {
  description = "CloudFront distribution ARN"
  value       = aws_cloudfront_distribution.frontend.arn
}

output "cloudfront_domain_name" {
  description = "CloudFront distribution domain name (use this to access your app)"
  value       = aws_cloudfront_distribution.frontend.domain_name
}

output "cloudfront_hosted_zone_id" {
  description = "CloudFront distribution hosted zone ID"
  value       = aws_cloudfront_distribution.frontend.hosted_zone_id
}