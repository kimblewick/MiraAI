locals {
  common_tags = merge({
    Environment = var.environment
    Project     = var.name_prefix
    ManagedBy   = "terraform"
  }, var.tags)

  gateway_services = [
    "s3",
    "dynamodb",
  ]
}

data "aws_region" "current" {}

resource "aws_vpc_endpoint" "gateway" {
  for_each = toset(local.gateway_services)

  vpc_id            = var.vpc_id
  vpc_endpoint_type = "Gateway"

  route_table_ids = var.private_route_table_ids

  service_name = "com.amazonaws.${data.aws_region.current.name}.${each.key}"

  tags = merge(local.common_tags, {
    Name    = "${var.name_prefix}-${each.key}-gateway-endpoint-${var.environment}"
    Service = each.key
  })
}
