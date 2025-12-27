output "user_pool_id" {
  value       = aws_cognito_user_pool.this.id
  description = "ID of the Cognito User Pool"
}

output "user_pool_arn" {
  value       = aws_cognito_user_pool.this.arn
  description = "ARN of the Cognito User Pool"
}

output "app_client_id" {
  value       = aws_cognito_user_pool_client.this.id
  description = "ID of the Cognito App Client"
}

output "domain" {
  value       = aws_cognito_user_pool_domain.this.domain
  description = "Cognito Hosted UI domain prefix"
}

output "hosted_ui_base_url" {
  value       = "https://${aws_cognito_user_pool_domain.this.domain}.auth.${data.aws_region.current.name}.amazoncognito.com"
  description = "Base URL of the Cognito Hosted UI"
}
