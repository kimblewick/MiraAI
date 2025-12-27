output "vpc_id" {
  description = "ID of the created VPC"
  value       = aws_vpc.this.id
}

output "public_subnet_ids" {
  description = "IDs of public subnets (one per AZ)"
  value       = aws_subnet.public[*].id
}

output "private_subnet_ids" {
  description = "IDs of private subnets (one per AZ)"
  value       = aws_subnet.private[*].id
}

output "public_route_table_ids" {
  description = "IDs of public route tables (one per AZ)"
  value       = aws_route_table.public[*].id
}

output "private_route_table_ids" {
  description = "IDs of private route tables (one per AZ)"
  value       = aws_route_table.private[*].id
}

output "nat_gateway_ids" {
  description = "IDs of NAT gateways (one per AZ)"
  value       = aws_nat_gateway.this[*].id
}
