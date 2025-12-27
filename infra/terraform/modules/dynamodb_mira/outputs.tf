output "user_profiles_table_name" {
  description = "Name of the user profiles DynamoDB table."
  value       = aws_dynamodb_table.user_profiles.name
}

output "conversations_table_name" {
  description = "Name of the conversations DynamoDB table."
  value       = aws_dynamodb_table.conversations.name
}

output "user_profiles_table_arn" {
  description = "ARN of the user profiles DynamoDB table."
  value       = aws_dynamodb_table.user_profiles.arn
}

output "conversations_table_arn" {
  description = "ARN of the conversations DynamoDB table."
  value       = aws_dynamodb_table.conversations.arn
}
