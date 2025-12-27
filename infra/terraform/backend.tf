terraform {
  backend "s3" {
    bucket         = "mira-terraform-state-dev"
    key            = "terraform.tfstate"
    region         = "us-east-1"
    dynamodb_table = "mira-terraform-locks"
    encrypt        = true
  }
}