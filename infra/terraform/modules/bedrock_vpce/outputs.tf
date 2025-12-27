output "security_group_id" {
  description = "Security group ID attached to the Bedrock interface endpoint"
  value       = aws_security_group.bedrock_vpce.id
}

output "vpc_endpoint_id" {
  description = "VPC Endpoint ID for Bedrock runtime"
  value       = aws_vpc_endpoint.interface["bedrock"].id
}

output "vpc_endpoint_dns_entries" {
  description = "DNS entries for the Bedrock runtime VPC endpoint"
  value       = aws_vpc_endpoint.interface["bedrock"].dns_entry
}