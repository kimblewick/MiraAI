terraform {
  required_providers {
    aws = {
      source = "hashicorp/aws"
    }
  }
}

locals {
  table_prefix = "${var.app_name}-${var.env}"
  common_tags = merge(
    {
      "App"         = var.app_name
      "Environment" = var.env
    },
    var.tags,
  )
}

# -----------------------------------------------------------------------------
# User Profiles table
# -----------------------------------------------------------------------------
resource "aws_dynamodb_table" "user_profiles" {
  name         = "${var.app_name}-user-profiles-${var.env}"
  billing_mode = "PAY_PER_REQUEST"

  hash_key = "user_id"

  attribute {
    name = "user_id"
    type = "S"
  }

  point_in_time_recovery {
    enabled = true
  }

  server_side_encryption {
    enabled = true
    # Using AWS owned CMK.
  }

  tags = merge(local.common_tags, {
    "Table" = "user_profiles"
  })
}

# -----------------------------------------------------------------------------
# Conversations table
# -----------------------------------------------------------------------------
resource "aws_dynamodb_table" "conversations" {
  name         = "${var.app_name}-conversations-${var.env}"
  billing_mode = "PAY_PER_REQUEST"

  hash_key  = "user_id"
  range_key = "sk"

  attribute {
    name = "user_id"
    type = "S"
  }

  attribute {
    name = "sk"
    type = "S"
  }

  # TTL attribute for auto-expiring conversation items
  ttl {
    attribute_name = "ttl_epoch"
    enabled        = true
  }

  point_in_time_recovery {
    enabled = true
  }

  server_side_encryption {
    enabled = true
  }

  tags = merge(local.common_tags, {
    "Table" = "conversations"
  })
}
