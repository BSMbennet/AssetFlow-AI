# ============================================
# ASSETFLOW AI - Terraform Outputs
# ============================================

output "vpc_id" {
  description = "VPC ID"
  value       = module.vpc.vpc_id
}

output "vpc_private_subnets" {
  description = "Private subnet IDs"
  value       = module.vpc.private_subnets
}

output "vpc_public_subnets" {
  description = "Public subnet IDs"
  value       = module.vpc.public_subnets
}

output "vpc_database_subnets" {
  description = "Database subnet IDs"
  value       = module.vpc.database_subnets
}

output "cluster_endpoint" {
  description = "EKS cluster endpoint"
  value       = module.eks.cluster_endpoint
}

output "cluster_name" {
  description = "EKS cluster name"
  value       = module.eks.cluster_name
}

output "cluster_security_group_id" {
  description = "EKS cluster security group ID"
  value       = module.eks.cluster_security_group_id
}

output "cluster_oidc_provider_arn" {
  description = "EKS cluster OIDC provider ARN"
  value       = module.eks.oidc_provider_arn
}

output "db_endpoint" {
  description = "RDS primary endpoint"
  value       = module.rds.db_instance_endpoint
}

output "db_password" {
  description = "RDS password"
  value       = random_password.db_password.result
  sensitive   = true
}

output "redis_endpoint" {
  description = "Redis primary endpoint"
  value       = module.redis.elasticache_cluster_endpoint
}

output "redis_password" {
  description = "Redis password"
  value       = random_password.redis_password.result
  sensitive   = true
}

output "s3_uploads_bucket" {
  description = "S3 uploads bucket name"
  value       = aws_s3_bucket.uploads.id
}

output "s3_backup_bucket" {
  description = "S3 backup bucket name"
  value       = aws_s3_bucket.backup.id
}

output "cloudwatch_log_groups" {
  description = "CloudWatch log group names"
  value = {
    api        = aws_cloudwatch_log_group.api.name
    ai_service = aws_cloudwatch_log_group.ai_service.name
    web        = aws_cloudwatch_log_group.web.name
    nginx      = aws_cloudwatch_log_group.nginx.name
  }
}

output "secrets" {
  description = "Secrets Manager ARNs"
  value = {
    db_password    = aws_secretsmanager_secret.db_password.arn
    redis_password = aws_secretsmanager_secret.redis_password.arn
    jwt_secret     = aws_secretsmanager_secret.jwt_secret.arn
  }
  sensitive = true
}

output "rabbitmq_endpoint" {
  description = "RabbitMQ endpoint"
  value       = var.environment == "prod" ? try(aws_mq_broker.rabbitmq[0].instances[0].endpoints[0], "") : ""
}

output "rabbitmq_username" {
  description = "RabbitMQ username"
  value       = var.environment == "prod" ? try(aws_mq_broker.rabbitmq[0].user[0].username, "") : ""
  sensitive   = true
}

output "rabbitmq_password" {
  description = "RabbitMQ password"
  value       = var.environment == "prod" ? random_password.rabbitmq_password.result : ""
  sensitive   = true
}