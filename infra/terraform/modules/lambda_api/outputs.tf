output "function_name" {
  description = "Lambda function name for API handler"
  value       = local.fn_name
}

output "function_arn" {
  value = local.fn_arn
}
