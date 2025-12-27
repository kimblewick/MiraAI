data "aws_caller_identity" "current" {}
data "aws_region" "current" {}

output "current_account_id" {
  value = data.aws_caller_identity.current.account_id
}
module "cognito_auth" {
  source = "./modules/cognito_auth"

  # placeholder (can change latter)
  user_pool_name  = "mira-user-pool-dev"
  app_client_name = "mira-web-client-dev"

  # Note: The domain_prefix must be globally unique within the Region.
  domain_prefix = "cs6620-team-chengdu-dev"

  # This is a placeholder URL; you can replace it with the actual frontend/API URL later.
  callback_urls = [
    "http://localhost:5173/callback",               # For local dev
    "https://dpa3zp0ku6hv4.cloudfront.net/callback" # For production (when deployed)
  ]

  logout_urls = [
    "http://localhost:5173/",               # For local dev
    "https://dpa3zp0ku6hv4.cloudfront.net/" # For production
  ]

  tags = {
    Project = "cs6620-final"
    Env     = "dev"
  }
}

output "cognito_user_pool_id" {
  value       = module.cognito_auth.user_pool_id
  description = "ID of the Cognito User Pool"
}

output "cognito_app_client_id" {
  value       = module.cognito_auth.app_client_id
  description = "ID of the Cognito App Client"
}

output "cognito_hosted_ui_base_url" {
  value       = module.cognito_auth.hosted_ui_base_url
  description = "Base URL of the Cognito Hosted UI"
}


# module "events_messaging" {
#   source = "./modules/events_messaging"
# }

# output "events_event_bus_name" {
#   value = module.events_messaging.event_bus_name
# }

# output "events_main_queue_url" {
#   value = module.events_messaging.main_queue_url
# }

# output "events_dlq_queue_url" {
#   value = module.events_messaging.dlq_url
# }


module "dynamodb_mira" {
  source = "./modules/dynamodb_mira"

  app_name = "mira"
  env      = "dev"

  tags = {
    Project = "cs6620-final"
    Env     = "dev"
  }
}

output "user_profiles_table_name" {
  description = "DynamoDB user profiles table name"
  value       = module.dynamodb_mira.user_profiles_table_name
}

output "conversations_table_name" {
  description = "DynamoDB conversations table name"
  value       = module.dynamodb_mira.conversations_table_name
}

output "user_profiles_table_arn" {
  description = "DynamoDB user profiles table ARN"
  value       = module.dynamodb_mira.user_profiles_table_arn
}

output "conversations_table_arn" {
  description = "DynamoDB conversations table ARN"
  value       = module.dynamodb_mira.conversations_table_arn
}


module "network_vpc" {
  source = "./modules/network_vpc"

  environment    = "dev"
  name_prefix    = "mira"
  vpc_cidr_block = "10.0.0.0/16"
  azs            = ["us-east-1a", "us-east-1b"]

  public_subnet_cidrs  = ["10.0.1.0/24", "10.0.2.0/24"]
  private_subnet_cidrs = ["10.0.11.0/24", "10.0.12.0/24"]

  tags = {
    Owner = "davie"
  }
}

output "vpc_id" {
  value = module.network_vpc.vpc_id
}


module "s3_static" {
  source = "./modules/s3_static"

  # Choose globally unique bucket names. A common pattern:
  # <project>-<env>-frontend
  # <project>-<env>-artifacts
  frontend_bucket_name  = "mira-dev-frontend-us-east-1"
  artifacts_bucket_name = "mira-dev-artifacts"

  tags = {
    Project = "cs6620-final"
    Env     = "dev"
  }

  # Optional: override lifecycle behavior if needed
  # artifacts_lifecycle_enabled          = true
  # artifacts_lifecycle_expiration_days  = 365
}

output "frontend_bucket_name" {
  value       = module.s3_static.frontend_bucket_name
  description = "Name of the frontend SPA S3 bucket."
}

output "artifacts_bucket_name" {
  value       = module.s3_static.artifacts_bucket_name
  description = "Name of the artifacts S3 bucket."
}

output "cloudfront_distribution_id" {
  value       = module.s3_static.cloudfront_distribution_id
  description = "CloudFront distribution ID for frontend"
}

output "cloudfront_domain_name" {
  value       = module.s3_static.cloudfront_domain_name
  description = "CloudFront domain name - use this URL to access your frontend"
}

output "cloudfront_url" {
  value       = "https://${module.s3_static.cloudfront_domain_name}"
  description = "Full CloudFront URL for accessing your application"
}

module "api_lambda" {
  source = "./modules/lambda_api"

  environment   = "dev"
  name_prefix   = "mira"
  function_name = "mira-api-dev"

  runtime = "python3.10"
  handler = "handler.lambda_handler"

  source_dir  = "${path.root}/lambda_src/api"
  memory_size = 256
  timeout     = 90

  environment_variables = {
    STAGE                        = "dev"
    DYNAMODB_PROFILES_TABLE      = module.dynamodb_mira.user_profiles_table_name
    DYNAMODB_CONVERSATIONS_TABLE = module.dynamodb_mira.conversations_table_name
    ASTROLOGY_SECRET_NAME        = "/mira/astrology/api_key"
    S3_CHARTS_BUCKET             = module.s3_static.artifacts_bucket_name
    GEONAMES_USERNAME            = "DavieWu"
  }

  astrologer_api_secret_arn = module.secrets_astrologer.astrologer_api_secret_arn

  dynamodb_userprofiles_arn  = module.dynamodb_mira.user_profiles_table_arn
  dynamodb_conversations_arn = module.dynamodb_mira.conversations_table_arn

  subnet_ids         = module.network_vpc.private_subnet_ids
  security_group_ids = [module.bedrock_vpce.security_group_id]


  bedrock_model_arns = [
    "arn:aws:bedrock:us-east-1::foundation-model/openai.gpt-oss-20b-1:0"
  ]

  s3_charts_bucket_name = module.s3_static.artifacts_bucket_name
}

########################################
# Keep-warm rule for mira-api-dev
########################################

resource "aws_cloudwatch_event_rule" "api_keep_warm" {
  name        = "${var.name_prefix}-api-keep-warm-${var.environment}"
  description = "Periodically invoke mira-api-dev to keep it warm"
  # The frequency can be adjusted here: start with once every 5 minutes, then change it to once every 1 minute before the demo.
  schedule_expression = "rate(5 minutes)"
}

resource "aws_cloudwatch_event_target" "api_keep_warm" {
  rule      = aws_cloudwatch_event_rule.api_keep_warm.name
  target_id = "mira-api-dev-keep-warm"
  arn       = module.api_lambda.function_arn

  # The event passed to Lambda allows the backend to recognize it as a keep-warm ping in the handler.
  input = jsonencode({
    "source" = "mira.keep-warm"
  })
}

resource "aws_lambda_permission" "api_keep_warm" {
  statement_id  = "AllowEventBridgeInvokeKeepWarm"
  action        = "lambda:InvokeFunction"
  function_name = module.api_lambda.function_arn
  principal     = "events.amazonaws.com"
  source_arn    = aws_cloudwatch_event_rule.api_keep_warm.arn
}


resource "aws_cloudwatch_metric_alarm" "mira_api_errors" {
  alarm_name          = "mira-api-dev-errors"
  alarm_description   = "Alarm when mira-api-dev Lambda has >=1 errors in 1 minute (for testing)."
  comparison_operator = "GreaterThanOrEqualToThreshold"

  evaluation_periods = 1
  period             = 60 # 1 minute
  statistic          = "Sum"
  threshold          = 1

  namespace   = "AWS/Lambda"
  metric_name = "Errors"

  dimensions = {
    FunctionName = module.api_lambda.function_name
  }

  treat_missing_data = "notBreaching" # Do not issue false alarms when there is no data.

  # We're not accepting SNS accounts yet, but we can add them later if needed.
  # alarm_actions = [aws_sns_topic.alerts.arn]
}


module "bedrock_vpce" {
  source = "./modules/bedrock_vpce"

  environment        = "dev"
  name_prefix        = "mira"
  vpc_id             = module.network_vpc.vpc_id
  private_subnet_ids = module.network_vpc.private_subnet_ids
  vpc_cidr_block     = "10.0.0.0/16"

  # Optionally tighten to your Lambda SGs later:
  # allowed_security_group_ids = [aws_security_group.lambda.id]
  # or narrow CIDRs:
  # allowed_cidr_blocks = ["10.0.11.0/24", "10.0.12.0/24"]
}

output "bedrock_vpce_id" {
  value       = module.bedrock_vpce.vpc_endpoint_id
  description = "Bedrock runtime interface endpoint ID"
}

output "bedrock_vpce_sg_id" {
  value       = module.bedrock_vpce.security_group_id
  description = "Security group ID for the Bedrock interface endpoint"
}


module "secrets_astrologer" {
  source      = "./modules/secrets_astrologer"
  name_prefix = var.name_prefix
  environment = var.environment
  tags        = var.tags

  astrologer_api_key = var.astrologer_api_key
}


module "gateway_endpoints" {
  source = "./modules/gateway_endpoints"

  name_prefix             = var.name_prefix
  environment             = var.environment
  vpc_id                  = module.network_vpc.vpc_id
  private_route_table_ids = module.network_vpc.private_route_table_ids
  tags                    = var.tags
}


module "api_gateway" {
  source = "./modules/api_gateway"

  name_prefix = var.name_prefix
  environment = var.environment

  lambda_function_arn = module.api_lambda.function_arn

  cognito_user_pool_id  = module.cognito_auth.user_pool_id
  cognito_app_client_id = module.cognito_auth.app_client_id

  region = data.aws_region.current.name
  tags   = var.tags
}

output "http_api_endpoint" {
  value       = module.api_gateway.api_endpoint
  description = "HTTP API Gateway base endpoint"
}