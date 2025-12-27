output "s3_gateway_endpoint_id" {
  description = "ID of the S3 Gateway endpoint"
  value       = aws_vpc_endpoint.gateway["s3"].id
}

output "dynamodb_gateway_endpoint_id" {
  description = "ID of the DynamoDB Gateway endpoint"
  value       = aws_vpc_endpoint.gateway["dynamodb"].id
}