locals {
  common_tags = merge({
    Environment = var.environment
    Project     = var.name_prefix
    ManagedBy   = "terraform"
  }, var.tags)
}

resource "aws_secretsmanager_secret" "astrologer_api" {
  name        = "/${var.name_prefix}/astrology/api_key"
  description = "Astrologer API key for Mira backend"

  tags = merge(local.common_tags, {
    Name = "/${var.name_prefix}/astrology/api_key"
  })
}

resource "aws_secretsmanager_secret_version" "astrologer_api" {
  secret_id = aws_secretsmanager_secret.astrologer_api.id

  secret_string = jsonencode({
    api_key = var.astrologer_api_key
  })

  lifecycle {
    ignore_changes = [secret_string]
  }
}
