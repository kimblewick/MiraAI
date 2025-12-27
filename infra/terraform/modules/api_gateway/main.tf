locals {
  common_tags = merge({
    Environment = var.environment
    Project     = var.name_prefix
    ManagedBy   = "terraform"
  }, var.tags)

  api_name = "${var.name_prefix}-http-api-${var.environment}"
}

# HTTP API
resource "aws_apigatewayv2_api" "this" {
  name          = local.api_name
  protocol_type = "HTTP"

  cors_configuration {
    allow_methods = ["GET", "POST", "DELETE", "PATCH", "OPTIONS"]
    allow_origins = ["*"] # The domain name can be replaced with the front-end domain name later.
    allow_headers = ["*"]
  }

  tags = local.common_tags
}

# Default stage with auto-deploy
resource "aws_apigatewayv2_stage" "default" {
  api_id      = aws_apigatewayv2_api.this.id
  name        = "$default"
  auto_deploy = true

  tags = local.common_tags
}

# Lambda integration (A single Lambda handles all routes.)
resource "aws_apigatewayv2_integration" "lambda" {
  api_id = aws_apigatewayv2_api.this.id

  integration_type = "AWS_PROXY"

  integration_uri = var.lambda_function_arn

  payload_format_version = "2.0"
}


# JWT Authorizer (Cognito)
resource "aws_apigatewayv2_authorizer" "jwt" {
  name             = "${local.api_name}-jwt-authorizer"
  api_id           = aws_apigatewayv2_api.this.id
  authorizer_type  = "JWT"
  identity_sources = ["$request.header.Authorization"]

  jwt_configuration {
    audience = [var.cognito_app_client_id]
    issuer   = "https://cognito-idp.${var.region}.amazonaws.com/${var.cognito_user_pool_id}"
  }
}

# Routes
## Health (public, no auth)
resource "aws_apigatewayv2_route" "health" {
  api_id    = aws_apigatewayv2_api.this.id
  route_key = "GET /health"

  target = "integrations/${aws_apigatewayv2_integration.lambda.id}"
}

## Chat (protected)
resource "aws_apigatewayv2_route" "chat" {
  api_id    = aws_apigatewayv2_api.this.id
  route_key = "POST /chat"

  target = "integrations/${aws_apigatewayv2_integration.lambda.id}"

  authorizer_id        = aws_apigatewayv2_authorizer.jwt.id
  authorization_type   = "JWT"
  authorization_scopes = [] # Scope can be added later if needed.
}

## Profile (protected)
resource "aws_apigatewayv2_route" "profile" {
  api_id    = aws_apigatewayv2_api.this.id
  route_key = "GET /profile"

  target = "integrations/${aws_apigatewayv2_integration.lambda.id}"

  authorizer_id        = aws_apigatewayv2_authorizer.jwt.id
  authorization_type   = "JWT"
  authorization_scopes = []
}

## Profile (protected, POST)
resource "aws_apigatewayv2_route" "profile_post" {
  api_id    = aws_apigatewayv2_api.this.id
  route_key = "POST /profile"

  target = "integrations/${aws_apigatewayv2_integration.lambda.id}"

  authorizer_id        = aws_apigatewayv2_authorizer.jwt.id
  authorization_type   = "JWT"
  authorization_scopes = []
}

## Conversation Management Routes (all protected with JWT)

# POST /conversations - Create new conversation thread
resource "aws_apigatewayv2_route" "conversations_create" {
  api_id    = aws_apigatewayv2_api.this.id
  route_key = "POST /conversations"
  target    = "integrations/${aws_apigatewayv2_integration.lambda.id}"

  authorizer_id        = aws_apigatewayv2_authorizer.jwt.id
  authorization_type   = "JWT"
  authorization_scopes = []
}

# GET /conversations - List all conversations
resource "aws_apigatewayv2_route" "conversations_list" {
  api_id    = aws_apigatewayv2_api.this.id
  route_key = "GET /conversations"
  target    = "integrations/${aws_apigatewayv2_integration.lambda.id}"

  authorizer_id        = aws_apigatewayv2_authorizer.jwt.id
  authorization_type   = "JWT"
  authorization_scopes = []
}

# GET /conversations/{conversation_id}/messages - Get conversation messages
resource "aws_apigatewayv2_route" "conversations_messages" {
  api_id    = aws_apigatewayv2_api.this.id
  route_key = "GET /conversations/{conversation_id}/messages"
  target    = "integrations/${aws_apigatewayv2_integration.lambda.id}"

  authorizer_id        = aws_apigatewayv2_authorizer.jwt.id
  authorization_type   = "JWT"
  authorization_scopes = []
}

# DELETE /conversations/{conversation_id} - Delete conversation
resource "aws_apigatewayv2_route" "conversations_delete" {
  api_id    = aws_apigatewayv2_api.this.id
  route_key = "DELETE /conversations/{conversation_id}"
  target    = "integrations/${aws_apigatewayv2_integration.lambda.id}"

  authorizer_id        = aws_apigatewayv2_authorizer.jwt.id
  authorization_type   = "JWT"
  authorization_scopes = []
}

# PATCH /conversations/{conversation_id} - Update conversation
resource "aws_apigatewayv2_route" "conversations_update" {
  api_id    = aws_apigatewayv2_api.this.id
  route_key = "PATCH /conversations/{conversation_id}"
  target    = "integrations/${aws_apigatewayv2_integration.lambda.id}"

  authorizer_id        = aws_apigatewayv2_authorizer.jwt.id
  authorization_type   = "JWT"
  authorization_scopes = []
}

# Allow API Gateway to invoke Lambda
resource "aws_lambda_permission" "apigw_invoke" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = var.lambda_function_arn
  principal     = "apigateway.amazonaws.com"

  source_arn = "${aws_apigatewayv2_api.this.execution_arn}/*/*"
}