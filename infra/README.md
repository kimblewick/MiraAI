# /infra – Infrastructure as Code (Terraform)

This directory contains all Terraform configurations for provisioning the cloud infrastructure:

Includes modules for:
- VPC (subnets, routing, NAT, endpoints)
- DynamoDB tables
- S3 buckets
- Cognito User Pool + Hosted UI
- API Gateway REST API
- Lambda functions (API + Worker)
- CloudFront distribution
- SQS / EventBridge
- IAM policies and roles
- CloudWatch logs + alarms
- Bedrock VPC interface endpoints

**Prerequisites**
- AWS account setup
- AWS CLI configured
- Terraform installed

**Usage**
- terraform init
- terraform plan
- terraform apply