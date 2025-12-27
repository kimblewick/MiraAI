locals {
  common_tags = merge(
    {
      Environment = var.environment
      Project     = var.name_prefix
      ManagedBy   = "terraform"
    },
    var.tags
  )
}

# -------------------------
# VPC
# -------------------------
resource "aws_vpc" "this" {
  cidr_block           = var.vpc_cidr_block
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = merge(local.common_tags, {
    Name = "${var.name_prefix}-vpc-${var.environment}"
  })
}

# -------------------------
# Internet Gateway (shared by all public subnets)
# -------------------------
resource "aws_internet_gateway" "this" {
  vpc_id = aws_vpc.this.id

  tags = merge(local.common_tags, {
    Name = "${var.name_prefix}-igw-${var.environment}"
  })
}

# -------------------------
# Public Subnets (1 per AZ)
# -------------------------
resource "aws_subnet" "public" {
  count = length(var.azs)

  vpc_id                  = aws_vpc.this.id
  cidr_block              = var.public_subnet_cidrs[count.index]
  availability_zone       = var.azs[count.index]
  map_public_ip_on_launch = true

  tags = merge(local.common_tags, {
    Name = "${var.name_prefix}-public-${count.index + 1}-${var.environment}"
    Tier = "public"
  })
}

# -------------------------
# Private Subnets (1 per AZ)
# -------------------------
resource "aws_subnet" "private" {
  count = length(var.azs)

  vpc_id            = aws_vpc.this.id
  cidr_block        = var.private_subnet_cidrs[count.index]
  availability_zone = var.azs[count.index]

  tags = merge(local.common_tags, {
    Name = "${var.name_prefix}-private-${count.index + 1}-${var.environment}"
    Tier = "private"
  })
}

# -------------------------
# NAT Gateways (1 per AZ, each in a public subnet)
# -------------------------
resource "aws_eip" "nat" {
  count  = length(var.azs)
  domain = "vpc"

  tags = merge(local.common_tags, {
    Name = "${var.name_prefix}-nat-eip-${count.index + 1}-${var.environment}"
  })
}

resource "aws_nat_gateway" "this" {
  count = length(var.azs)

  allocation_id = aws_eip.nat[count.index].id
  subnet_id     = aws_subnet.public[count.index].id

  tags = merge(local.common_tags, {
    Name = "${var.name_prefix}-nat-gw-${count.index + 1}-${var.environment}"
  })

  depends_on = [aws_internet_gateway.this]
}

# -------------------------
# Route Tables (per AZ)
# -------------------------

# Public route tables: each public subnet has its own RT → IGW
resource "aws_route_table" "public" {
  count = length(var.azs)

  vpc_id = aws_vpc.this.id

  tags = merge(local.common_tags, {
    Name = "${var.name_prefix}-public-rt-${count.index + 1}-${var.environment}"
  })
}

resource "aws_route" "public_internet_access" {
  count = length(var.azs)

  route_table_id         = aws_route_table.public[count.index].id
  destination_cidr_block = "0.0.0.0/0"
  gateway_id             = aws_internet_gateway.this.id
}

resource "aws_route_table_association" "public_assoc" {
  count = length(var.azs)

  subnet_id      = aws_subnet.public[count.index].id
  route_table_id = aws_route_table.public[count.index].id
}

# Private route tables: each private subnet有自己的 RT → 同 AZ 的 NAT
resource "aws_route_table" "private" {
  count = length(var.azs)

  vpc_id = aws_vpc.this.id

  tags = merge(local.common_tags, {
    Name = "${var.name_prefix}-private-rt-${count.index + 1}-${var.environment}"
  })
}

resource "aws_route" "private_nat_access" {
  count = length(var.azs)

  route_table_id         = aws_route_table.private[count.index].id
  destination_cidr_block = "0.0.0.0/0"
  nat_gateway_id         = aws_nat_gateway.this[count.index].id
}

resource "aws_route_table_association" "private_assoc" {
  count = length(var.azs)

  subnet_id      = aws_subnet.private[count.index].id
  route_table_id = aws_route_table.private[count.index].id
}