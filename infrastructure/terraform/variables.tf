variable "aws_region" {
  description = "AWS deployment region (Mumbai ap-south-1 recommended for Indian environmental compliance)"
  type        = string
  default     = "ap-south-1"
}

variable "environment" {
  description = "Deployment environment name (e.g. staging, production)"
  type        = string
  default     = "production"
}

variable "project_name" {
  description = "Project identifier tag"
  type        = string
  default     = "airwatch"
}

variable "ec2_instance_type" {
  description = "EC2 compute instance size (t3.micro or t4g.small eligible for AWS Free Tier)"
  type        = string
  default     = "t3.micro"
}

variable "db_instance_class" {
  description = "RDS PostgreSQL instance class (db.t4g.micro or db.t3.micro for modest cost)"
  type        = string
  default     = "db.t4g.micro"
}

variable "db_name" {
  description = "PostgreSQL database name"
  type        = string
  default     = "airwatch"
}

variable "db_username" {
  description = "Master database user"
  type        = string
  default     = "airwatch_admin"
}

variable "db_password" {
  description = "Master database password (must be passed securely via secret manager or tfvars)"
  type        = string
  sensitive   = true
}

variable "monthly_budget_usd" {
  description = "Maximum monthly AWS spending budget before triggering alert notifications"
  type        = number
  default     = 15.00
}

variable "alert_email" {
  description = "Email address for CloudWatch and AWS Budget spending threshold alerts"
  type        = string
  default     = "admin@example.com"
}
