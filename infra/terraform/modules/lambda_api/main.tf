locals {
  common_tags = merge({
    Environment = var.environment
    Project     = var.name_prefix
    ManagedBy   = "terraform"
  }, var.tags)
}

data "aws_region" "current" {}
data "aws_caller_identity" "current" {}

data "aws_iam_policy_document" "assume_lambda" {
  statement {
    effect = "Allow"
    principals {
      type        = "Service"
      identifiers = ["lambda.amazonaws.com"]
    }
    actions = ["sts:AssumeRole"]
  }
}

resource "aws_iam_role" "lambda_role" {
  name               = "${var.name_prefix}-${var.function_name}-role-${var.environment}"
  assume_role_policy = data.aws_iam_policy_document.assume_lambda.json
  tags               = local.common_tags
}

data "aws_iam_policy_document" "logs_basic" {
  statement {
    effect = "Allow"
    actions = [
      "logs:CreateLogGroup",
      "logs:CreateLogStream",
      "logs:PutLogEvents"
    ]
    resources = ["*"]
  }
}

resource "aws_iam_role_policy" "logs_basic" {
  name   = "${var.name_prefix}-${var.function_name}-logs"
  role   = aws_iam_role.lambda_role.id
  policy = data.aws_iam_policy_document.logs_basic.json
}

# ----- EC2 networking permissions for VPC Lambda -----
data "aws_iam_policy_document" "vpc_networking" {
  statement {
    effect = "Allow"
    actions = [
      "ec2:CreateNetworkInterface",
      "ec2:DescribeNetworkInterfaces",
      "ec2:DeleteNetworkInterface",
    ]
    resources = ["*"]
  }
}

resource "aws_iam_role_policy" "vpc_networking" {
  name   = "${var.name_prefix}-${var.function_name}-vpc-networking"
  role   = aws_iam_role.lambda_role.id
  policy = data.aws_iam_policy_document.vpc_networking.json
}


# ----- Secrets Manager permission for Astrologer API key -----

data "aws_iam_policy_document" "secrets_astrologer" {
  statement {
    effect = "Allow"

    actions = [
      "secretsmanager:GetSecretValue",
      "secretsmanager:DescribeSecret",
    ]

    resources = [
      var.astrologer_api_secret_arn
    ]
  }
}

resource "aws_iam_role_policy" "secrets_astrologer" {
  name   = "${var.name_prefix}-${var.function_name}-secrets"
  role   = aws_iam_role.lambda_role.id
  policy = data.aws_iam_policy_document.secrets_astrologer.json
}

# ----- DynamoDB permission for UserProfiles table -----

data "aws_iam_policy_document" "dynamodb_userprofiles" {
  statement {
    effect = "Allow"

    actions = [
      "dynamodb:PutItem",
      "dynamodb:UpdateItem",
      "dynamodb:GetItem",
      "dynamodb:DeleteItem"
    ]

    resources = [
      var.dynamodb_userprofiles_arn
    ]
  }
}

resource "aws_iam_role_policy" "dynamodb_userprofiles" {
  name   = "${var.name_prefix}-${var.function_name}-dynamodb"
  role   = aws_iam_role.lambda_role.id
  policy = data.aws_iam_policy_document.dynamodb_userprofiles.json
}

# ----- DynamoDB permission for Conversations table -----

data "aws_iam_policy_document" "dynamodb_conversations" {
  statement {
    effect = "Allow"

    actions = [
      "dynamodb:PutItem",
      "dynamodb:UpdateItem",
      "dynamodb:GetItem",
      "dynamodb:DeleteItem",
      "dynamodb:Query",
      "dynamodb:Scan",
    ]

    resources = [
      var.dynamodb_conversations_arn
    ]
  }
}

resource "aws_iam_role_policy" "dynamodb_conversations" {
  name   = "${var.name_prefix}-${var.function_name}-dynamodb-conversations"
  role   = aws_iam_role.lambda_role.id
  policy = data.aws_iam_policy_document.dynamodb_conversations.json
}

# ----- Bedrock invoke permissions -----

data "aws_iam_policy_document" "bedrock_invoke" {
  statement {
    effect = "Allow"

    actions = [
      "bedrock:InvokeModel",
      "bedrock:InvokeModelWithResponseStream",
    ]

    resources = var.bedrock_model_arns
  }
}

resource "aws_iam_role_policy" "bedrock_invoke" {
  name   = "${var.name_prefix}-${var.function_name}-bedrock"
  role   = aws_iam_role.lambda_role.id
  policy = data.aws_iam_policy_document.bedrock_invoke.json
}

# ----- S3 permissions for charts bucket (artifacts/charts/*) -----

data "aws_iam_policy_document" "s3_charts" {
  statement {
    effect = "Allow"

    actions = [
      "s3:PutObject",
      "s3:GetObject",
      "s3:DeleteObject",
    ]

    resources = [
      "arn:aws:s3:::${var.s3_charts_bucket_name}/charts/*"
    ]
  }

  statement {
    effect = "Allow"

    actions = [
      "s3:ListBucket",
    ]

    resources = [
      "arn:aws:s3:::${var.s3_charts_bucket_name}"
    ]
  }
}

resource "aws_iam_role_policy" "s3_charts" {
  name   = "${var.name_prefix}-${var.function_name}-s3-charts"
  role   = aws_iam_role.lambda_role.id
  policy = data.aws_iam_policy_document.s3_charts.json
}


# Package from source_dir
data "archive_file" "lambda_zip" {
  count       = var.source_dir != null ? 1 : 0
  type        = "zip"
  source_dir  = var.source_dir
  output_path = "${path.root}/.terraform/${var.function_name}.zip"
}

resource "aws_cloudwatch_log_group" "lambda" {
  name              = "/aws/lambda/${var.function_name}"
  retention_in_days = var.log_retention_in_days
  tags              = local.common_tags
}

resource "aws_lambda_function" "from_zip" {
  count            = var.source_dir != null ? 1 : 0
  function_name    = var.function_name
  runtime          = var.runtime
  handler          = var.handler
  filename         = data.archive_file.lambda_zip[0].output_path
  source_code_hash = data.archive_file.lambda_zip[0].output_base64sha256
  role             = aws_iam_role.lambda_role.arn
  memory_size      = var.memory_size
  timeout          = var.timeout
  environment { variables = var.environment_variables }

  tracing_config {
    mode = var.tracing_mode
  }

  dynamic "vpc_config" {
    for_each = length(var.subnet_ids) > 0 && length(var.security_group_ids) > 0 ? [1] : []
    content {
      subnet_ids         = var.subnet_ids
      security_group_ids = var.security_group_ids
    }
  }

  tags = local.common_tags
}

resource "aws_lambda_function" "from_s3" {
  count         = var.source_dir == null ? 1 : 0
  function_name = var.function_name
  runtime       = var.runtime
  handler       = var.handler
  s3_bucket     = var.s3_bucket
  s3_key        = var.s3_key
  role          = aws_iam_role.lambda_role.arn
  memory_size   = var.memory_size
  timeout       = var.timeout
  environment { variables = var.environment_variables }

  dynamic "vpc_config" {
    for_each = length(var.subnet_ids) > 0 && length(var.security_group_ids) > 0 ? [1] : []
    content {
      subnet_ids         = var.subnet_ids
      security_group_ids = var.security_group_ids
    }
  }

  tags = local.common_tags
}

locals {
  fn_arn        = try(aws_lambda_function.from_zip[0].arn, aws_lambda_function.from_s3[0].arn)
  fn_invoke_arn = try(aws_lambda_function.from_zip[0].invoke_arn, aws_lambda_function.from_s3[0].invoke_arn)
  fn_name       = try(aws_lambda_function.from_zip[0].function_name, aws_lambda_function.from_s3[0].function_name)
}

# ----- X-Ray tracing permissions -----

data "aws_iam_policy_document" "xray_tracing" {
  statement {
    effect = "Allow"

    actions = [
      "xray:PutTraceSegments",
      "xray:PutTelemetryRecords",
    ]

    resources = ["*"]
  }
}

resource "aws_iam_role_policy" "xray_tracing" {
  name   = "${var.name_prefix}-${var.function_name}-xray"
  role   = aws_iam_role.lambda_role.id
  policy = data.aws_iam_policy_document.xray_tracing.json
}

# HTTP API Gateway (optional)
# resource "aws_apigatewayv2_api" "http_api" {
# count         = var.create_http_api ? 1 : 0
# name          = "${var.name_prefix}-http-api-${var.environment}"
# protocol_type = "HTTP"
# tags          = local.common_tags
# }

# resource "aws_apigatewayv2_integration" "lambda_proxy" {
# count                  = var.create_http_api ? 1 : 0
# api_id                 = aws_apigatewayv2_api.http_api[0].id
# integration_type       = "AWS_PROXY"
# integration_uri        = local.fn_arn
# payload_format_version = "2.0"
# timeout_milliseconds   = 29000
# }

# resource "aws_apigatewayv2_route" "routes" {
# for_each  = var.create_http_api ? toset(var.route_keys) : toset([])
# api_id    = aws_apigatewayv2_api.http_api[0].id
# route_key = each.value
# target    = "integrations/${aws_apigatewayv2_integration.lambda_proxy[0].id}"
# }

# resource "aws_apigatewayv2_stage" "stage" {
# count       = var.create_http_api ? 1 : 0
# api_id      = aws_apigatewayv2_api.http_api[0].id
# name        = var.stage_name
# auto_deploy = true
# tags        = local.common_tags
# }

# resource "aws_lambda_permission" "allow_apigw_invoke" {
# count         = var.create_http_api ? 1 : 0
# statement_id  = "AllowAPIGatewayInvoke"
# action        = "lambda:InvokeFunction"
# function_name = local.fn_name
# principal     = "apigateway.amazonaws.com"
# source_arn    = "${aws_apigatewayv2_api.http_api[0].execution_arn}/*/*"
# }