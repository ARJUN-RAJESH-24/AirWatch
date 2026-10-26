output "vpc_id" {
  description = "ID of the provisioned VPC"
  value       = aws_vpc.main.id
}

output "public_subnet_ids" {
  description = "Public subnet IDs for application / ALB"
  value       = [aws_subnet.public_1.id, aws_subnet.public_2.id]
}

output "rds_endpoint" {
  description = "Endpoint of the private PostgreSQL RDS database"
  value       = aws_db_instance.postgres.endpoint
}

output "s3_raw_data_bucket" {
  description = "S3 bucket for raw CAAQMS dataset archive"
  value       = aws_s3_bucket.raw_data.id
}

output "cloudwatch_log_group" {
  description = "Centralized CloudWatch log group"
  value       = aws_cloudwatch_log_group.app_logs.name
}
