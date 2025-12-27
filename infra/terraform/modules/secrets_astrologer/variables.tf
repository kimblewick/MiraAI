variable "name_prefix" {
  type = string
}

variable "environment" {
  type = string
}

variable "tags" {
  type    = map(string)
  default = {}
}

# 真正的 Astrologer API Key，从 root 传进来
variable "astrologer_api_key" {
  type      = string
  sensitive = true
}
