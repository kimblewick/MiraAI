output "astrologer_api_secret_arn" {
  value       = aws_secretsmanager_secret.astrologer_api.arn
  description = "ARN of the Astrologer API key secret"
}
