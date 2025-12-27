locals {
  common_tags = merge({
    Environment = var.environment
    Project     = var.name_prefix
    ManagedBy   = "terraform"
  }, var.tags)

  cidrs_effective = length(var.allowed_cidr_blocks) > 0 ? var.allowed_cidr_blocks : [var.vpc_cidr_block]

  interface_services = [
    "logs",           # CloudWatch Logs
    "xray",           # X-Ray
    "secretsmanager", # AWS Secrets Manager
    "sts",            # AWS STS
    "bedrock",        # Bedrock runtime
    "events",         # EventBridge
  ]
}

data "aws_region" "current" {}

resource "aws_security_group" "bedrock_vpce" {
  name        = "${var.name_prefix}-vpce-${var.environment}"
  description = "Security group for interface VPC endpoints (Logs, X-Ray, Secrets, STS, Bedrock)"
  vpc_id      = var.vpc_id

  tags = merge(local.common_tags, {
    Name = "${var.name_prefix}-vpce-${var.environment}"
  })
}

resource "aws_security_group_rule" "egress_all" {
  type              = "egress"
  from_port         = 0
  to_port           = 0
  protocol          = "-1"
  cidr_blocks       = ["0.0.0.0/0"]
  security_group_id = aws_security_group.bedrock_vpce.id
  description       = "Allow all egress"
}

resource "aws_security_group_rule" "ingress_from_cidrs" {
  for_each          = toset(local.cidrs_effective)
  type              = "ingress"
  from_port         = 443
  to_port           = 443
  protocol          = "tcp"
  cidr_blocks       = [each.value]
  security_group_id = aws_security_group.bedrock_vpce.id
  description       = "Allow HTTPS from allowed CIDRs"
}

resource "aws_security_group_rule" "ingress_from_sgs" {
  for_each                 = toset(var.allowed_security_group_ids)
  type                     = "ingress"
  from_port                = 443
  to_port                  = 443
  protocol                 = "tcp"
  source_security_group_id = each.value
  security_group_id        = aws_security_group.bedrock_vpce.id
  description              = "Allow HTTPS from allowed SGs"
}

resource "aws_vpc_endpoint" "interface" {
  for_each = toset(local.interface_services)

  vpc_id            = var.vpc_id
  vpc_endpoint_type = "Interface"
  subnet_ids        = var.private_subnet_ids
  security_group_ids = [
    aws_security_group.bedrock_vpce.id
  ]

  service_name = each.key == "bedrock" ? "com.amazonaws.${data.aws_region.current.name}.bedrock-runtime" : "com.amazonaws.${data.aws_region.current.name}.${each.key}"

  private_dns_enabled = true

  tags = merge(local.common_tags, {
    Name    = "${var.name_prefix}-${each.key}-vpce-${var.environment}"
    Service = each.key
  })
}