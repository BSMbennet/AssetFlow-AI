# ============================================
# ASSETFLOW AI - Terraform Configuration
# ============================================

terraform {
  required_version = ">= 1.5.0"
  
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    kubernetes = {
      source  = "hashicorp/kubernetes"
      version = "~> 2.23"
    }
    helm = {
      source  = "hashicorp/helm"
      version = "~> 2.11"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.5"
    }
    null = {
      source  = "hashicorp/null"
      version = "~> 3.2"
    }
  }
  
  backend "s3" {
    bucket         = "assetflow-terraform-state"
    key            = "terraform.tfstate"
    region         = "us-east-1"
    encrypt        = true
    dynamodb_table = "terraform-locks"
  }
}

provider "aws" {
  region = var.aws_region
  
  default_tags {
    tags = {
      Environment = var.environment
      Project     = "AssetFlowAI"
      ManagedBy   = "Terraform"
      Version     = "1.0"
      CostCenter  = "Platform"
    }
  }
}

provider "kubernetes" {
  host                   = module.eks.cluster_endpoint
  cluster_ca_certificate = base64decode(module.eks.cluster_certificate_authority_data)
  exec {
    api_version = "client.authentication.k8s.io/v1beta1"
    command     = "aws"
    args        = ["eks", "get-token", "--cluster-name", module.eks.cluster_name]
  }
}

provider "helm" {
  kubernetes {
    host                   = module.eks.cluster_endpoint
    cluster_ca_certificate = base64decode(module.eks.cluster_certificate_authority_data)
    exec {
      api_version = "client.authentication.k8s.io/v1beta1"
      command     = "aws"
      args        = ["eks", "get-token", "--cluster-name", module.eks.cluster_name]
    }
  }
}

# ============================================
# DATA SOURCES
# ============================================

data "aws_availability_zones" "available" {
  state = "available"
}

data "aws_caller_identity" "current" {}

data "aws_region" "current" {}

# ============================================
# RANDOM PASSWORDS
# ============================================

resource "random_password" "db_password" {
  length  = 32
  special = false
  min_upper = 2
  min_lower = 2
  min_numeric = 2
}

resource "random_password" "redis_password" {
  length  = 32
  special = false
  min_upper = 2
  min_lower = 2
  min_numeric = 2
}

resource "random_password" "jwt_secret" {
  length  = 64
  special = true
  min_upper = 4
  min_lower = 4
  min_numeric = 4
  min_special = 4
}

resource "random_password" "rabbitmq_password" {
  length  = 32
  special = false
  min_upper = 2
  min_lower = 2
  min_numeric = 2
}

resource "random_password" "grafana_password" {
  length  = 24
  special = true
  min_upper = 2
  min_lower = 2
  min_numeric = 2
  min_special = 2
}

# ============================================
# VPC MODULE
# ============================================

module "vpc" {
  source  = "terraform-aws-modules/vpc/aws"
  version = "~> 5.0"

  name = "assetflow-${var.environment}-vpc"
  cidr = var.vpc_cidr

  azs             = data.aws_availability_zones.available.names
  private_subnets = var.private_subnet_cidrs
  public_subnets  = var.public_subnet_cidrs
  database_subnets = var.database_subnet_cidrs
  intra_subnets   = var.intra_subnet_cidrs

  enable_nat_gateway     = true
  enable_vpn_gateway     = false
  enable_dns_hostnames   = true
  enable_dns_support     = true
  single_nat_gateway     = var.environment != "prod"
  one_nat_gateway_per_az = var.environment == "prod"

  create_database_subnet_group = true
  create_database_subnet_route_table = true

  # VPC Flow Logs
  enable_flow_log = var.environment == "prod"
  flow_log_destination_type = "cloud-watch-logs"
  flow_log_log_group_name = "/aws/vpc/assetflow-${var.environment}"
  flow_log_max_aggregation_interval = 600

  tags = {
    Name = "assetflow-${var.environment}-vpc"
    Environment = var.environment
    Project = "AssetFlowAI"
  }
}

# ============================================
# EKS CLUSTER
# ============================================

module "eks" {
  source  = "terraform-aws-modules/eks/aws"
  version = "~> 19.0"

  cluster_name    = "assetflow-${var.environment}"
  cluster_version = "1.28"

  vpc_id     = module.vpc.vpc_id
  subnet_ids = module.vpc.private_subnets

  cluster_endpoint_public_access  = var.environment == "dev" ? true : false
  cluster_endpoint_private_access = true
  
  cluster_endpoint_public_access_cidrs = var.environment == "dev" ? ["0.0.0.0/0"] : []
  
  cluster_encryption_config = [{
    provider_key_arn = aws_kms_key.eks.arn
    resources        = ["secrets"]
  }]

  cluster_addons = {
    coredns = {
      most_recent = true
      addon_version = "v1.10.1-eksbuild.7"
    }
    kube-proxy = {
      most_recent = true
      addon_version = "v1.28.5-eksbuild.2"
    }
    vpc-cni = {
      most_recent = true
      addon_version = "v1.15.4-eksbuild.1"
    }
    aws-ebs-csi-driver = {
      most_recent = true
      addon_version = "v1.25.0-eksbuild.1"
    }
  }

  eks_managed_node_groups = {
    main = {
      name = "main-node-group"

      instance_types = [var.instance_type]

      min_size     = var.min_capacity
      max_size     = var.max_capacity
      desired_size = var.desired_capacity

      subnet_ids = module.vpc.private_subnets

      capacity_type = "ON_DEMAND"

      ebs_optimized = true
      enable_monitoring = true

      block_device_mappings = {
        xvda = {
          device_name = "/dev/xvda"
          ebs = {
            volume_size = var.ebs_volume_size
            volume_type = "gp3"
            encrypted   = true
            delete_on_termination = true
          }
        }
      }

      # Bootstrap script
      bootstrap_extra_args = <<-EOT
        --container-runtime containerd
        --kubelet-extra-args '--max-pods=110'
      EOT

      tags = {
        Name = "assetflow-${var.environment}-node"
        "k8s.io/cluster-autoscaler/enabled" = "true"
        "k8s.io/cluster-autoscaler/assetflow-${var.environment}" = "owned"
      }
    }

    # Spot instances for cost optimization
    spot = {
      name = "spot-node-group"

      instance_types = var.spot_instance_types

      min_size     = 1
      max_size     = 5
      desired_size = 2

      subnet_ids = module.vpc.private_subnets

      capacity_type = "SPOT"

      block_device_mappings = {
        xvda = {
          device_name = "/dev/xvda"
          ebs = {
            volume_size = var.ebs_volume_size
            volume_type = "gp3"
            encrypted   = true
            delete_on_termination = true
          }
        }
      }

      tags = {
        Name = "assetflow-${var.environment}-spot-node"
        "k8s.io/cluster-autoscaler/enabled" = "true"
        "k8s.io/cluster-autoscaler/assetflow-${var.environment}" = "owned"
      }
    }
  }

  # Fargate profiles for serverless workloads
  fargate_profiles = var.environment == "prod" ? {
    system = {
      name = "system"
      selectors = [
        {
          namespace = "kube-system"
        }
      ]
    }
    assetflow = {
      name = "assetflow"
      selectors = [
        {
          namespace = "assetflow"
        }
      ]
    }
  } : {}

  # OIDC provider for service accounts
  enable_oidc_provider = true
  oidc_provider_required_principals = ["system:serviceaccount:assetflow:*"]

  tags = {
    Name = "assetflow-${var.environment}-eks"
    Environment = var.environment
    Project = "AssetFlowAI"
  }
}

# ============================================
# KMS KEY
# ============================================

resource "aws_kms_key" "eks" {
  description             = "EKS Cluster Encryption Key"
  deletion_window_in_days = 7
  enable_key_rotation     = true
  
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "Enable IAM User Permissions"
        Effect = "Allow"
        Principal = {
          AWS = "arn:aws:iam::${data.aws_caller_identity.current.account_id}:root"
        }
        Action   = "kms:*"
        Resource = "*"
      }
    ]
  })
  
  tags = {
    Environment = var.environment
    Project = "AssetFlowAI"
  }
}

# ============================================
# RDS POSTGRESQL
# ============================================

module "rds" {
  source  = "terraform-aws-modules/rds/aws"
  version = "~> 6.0"

  identifier = "assetflow-${var.environment}"

  engine               = "postgres"
  engine_version       = "15.4"
  family               = "postgres15"
  major_engine_version = "15"
  instance_class       = var.db_instance_class

  allocated_storage     = var.db_allocated_storage
  max_allocated_storage = var.db_max_allocated_storage
  storage_encrypted     = true
  storage_type          = "gp3"
  storage_iops          = 3000
  storage_throughput    = 125

  db_name  = "assetflow"
  username = "assetflow"
  password = random_password.db_password.result

  vpc_security_group_ids = [aws_security_group.rds.id]
  
  subnet_ids = module.vpc.database_subnets

  maintenance_window      = "sun:04:00-sun:05:00"
  backup_window           = "03:00-04:00"
  backup_retention_period = var.environment == "prod" ? 30 : 7
  backup_target = "region"

  multi_az               = var.environment == "prod" ? true : false
  db_subnet_group_name   = module.vpc.database_subnet_group_name

  enabled_cloudwatch_logs_exports = ["postgresql", "upgrade"]
  create_cloudwatch_log_group     = true
  
  performance_insights_enabled = true
  performance_insights_retention_period = 7

  deletion_protection = var.environment == "prod" ? true : false
  skip_final_snapshot = var.environment != "prod"

  # Parameter group
  family = "postgres15"
  
  # Option group
  major_engine_version = "15"

  # Database monitoring
  monitoring_interval = var.environment == "prod" ? 60 : 0
  monitoring_role_arn = module.rds_monitoring_role.arn

  tags = {
    Name = "assetflow-${var.environment}-rds"
    Environment = var.environment
    Project = "AssetFlowAI"
    Backup = var.environment == "prod" ? "daily" : "weekly"
  }
}

# RDS Monitoring Role
module "rds_monitoring_role" {
  source = "terraform-aws-modules/iam/aws//modules/iam-role-for-service-accounts-eks"
  version = "~> 5.0"

  role_name = "assetflow-rds-monitoring-${var.environment}"

  role_policy_arns = {
    policy = "arn:aws:iam::aws:policy/service-role/AmazonRDSEnhancedMonitoringRole"
  }

  tags = {
    Environment = var.environment
    Project = "AssetFlowAI"
  }
}

# RDS Read Replica for reporting
module "rds_replica" {
  source  = "terraform-aws-modules/rds/aws"
  version = "~> 6.0"
  
  count = var.environment == "prod" ? 1 : 0

  identifier = "assetflow-${var.environment}-replica"

  engine               = "postgres"
  engine_version       = "15.4"
  instance_class       = var.db_instance_class
  storage_encrypted    = true
  storage_type         = "gp3"

  replicate_source_db = module.rds.db_instance_identifier

  vpc_security_group_ids = [aws_security_group.rds.id]
  subnet_ids = module.vpc.database_subnets

  db_subnet_group_name = module.vpc.database_subnet_group_name

  tags = {
    Name = "assetflow-${var.environment}-rds-replica"
    Environment = var.environment
    Project = "AssetFlowAI"
  }
}

# ============================================
# ELASTICACHE REDIS
# ============================================

module "redis" {
  source  = "terraform-aws-modules/elasticache/aws"
  version = "~> 1.0"

  cluster_id = "assetflow-${var.environment}"

  engine               = "redis"
  engine_version       = "7.0"
  node_type            = var.redis_node_type
  num_cache_nodes      = var.environment == "prod" ? 3 : 1
  parameter_group_name = "default.redis7"

  subnet_ids = module.vpc.private_subnets
  security_group_ids = [aws_security_group.redis.id]

  port = 6379

  maintenance_window = "sun:05:00-sun:06:00"
  snapshot_window    = "04:00-05:00"
  snapshot_retention_limit = var.environment == "prod" ? 7 : 1

  automatic_failover_enabled = var.environment == "prod"
  multi_az_enabled = var.environment == "prod"

  # Redis auth
  auth_token = random_password.redis_password.result
  transit_encryption_enabled = true
  at_rest_encryption_enabled = true

  tags = {
    Name = "assetflow-${var.environment}-redis"
    Environment = var.environment
    Project = "AssetFlowAI"
  }
}

# ============================================
# RABBITMQ (Amazon MQ)
# ============================================

resource "aws_mq_broker" "rabbitmq" {
  count = var.environment == "prod" ? 1 : 0

  broker_name = "assetflow-${var.environment}-rabbitmq"
  engine_type = "RabbitMQ"
  engine_version = "3.12.13"
  host_instance_type = "mq.t3.micro"
  
  security_groups = [aws_security_group.rabbitmq.id]
  subnet_ids = module.vpc.private_subnets

  user {
    username = "assetflow"
    password = random_password.rabbitmq_password.result
  }

  deployment_mode = var.environment == "prod" ? "CLUSTER_MULTI_AZ" : "SINGLE_INSTANCE"

  encryption_options {
    use_aws_owned_key = true
  }

  maintenance_window_start_time {
    day_of_week = "SUNDAY"
    time_of_day = "04:00"
    time_zone   = "UTC"
  }

  tags = {
    Name = "assetflow-${var.environment}-rabbitmq"
    Environment = var.environment
    Project = "AssetFlowAI"
  }
}

# ============================================
# S3 BUCKETS
# ============================================

# Uploads bucket
resource "aws_s3_bucket" "uploads" {
  bucket = "assetflow-${var.environment}-uploads"
  
  tags = {
    Name = "assetflow-${var.environment}-uploads"
    Environment = var.environment
    Project = "AssetFlowAI"
  }
}

resource "aws_s3_bucket_versioning" "uploads" {
  bucket = aws_s3_bucket.uploads.id
  versioning_configuration {
    status = var.environment == "prod" ? "Enabled" : "Suspended"
  }
}

resource "aws_s3_bucket_encryption" "uploads" {
  bucket = aws_s3_bucket.uploads.id
  server_side_encryption_configuration {
    rule {
      apply_server_side_encryption_by_default {
        sse_algorithm = "AES256"
      }
    }
  }
}

resource "aws_s3_bucket_cors_configuration" "uploads" {
  bucket = aws_s3_bucket.uploads.id
  cors_rule {
    allowed_headers = ["*"]
    allowed_methods = ["GET", "PUT", "POST", "DELETE"]
    allowed_origins = var.cors_origins
    max_age_seconds = 3000
  }
}

resource "aws_s3_bucket_public_access_block" "uploads" {
  bucket = aws_s3_bucket.uploads.id
  block_public_acls = true
  block_public_policy = true
  ignore_public_acls = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_lifecycle_configuration" "uploads" {
  bucket = aws_s3_bucket.uploads.id
  rule {
    id = "transition-old-files"
    status = "Enabled"
    transition {
      days = 90
      storage_class = "STANDARD_IA"
    }
  }
}

# Backup bucket
resource "aws_s3_bucket" "backup" {
  bucket = "assetflow-${var.environment}-backup"
  
  tags = {
    Name = "assetflow-${var.environment}-backup"
    Environment = var.environment
    Project = "AssetFlowAI"
  }
}

resource "aws_s3_bucket_versioning" "backup" {
  bucket = aws_s3_bucket.backup.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "backup" {
  bucket = aws_s3_bucket.backup.id
  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "aws:kms"
    }
  }
}

# ============================================
# SECURITY GROUPS
# ============================================

# RDS Security Group
resource "aws_security_group" "rds" {
  name_prefix = "assetflow-${var.environment}-rds-"
  description = "Security group for RDS PostgreSQL"
  vpc_id      = module.vpc.vpc_id

  ingress {
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [module.eks.cluster_security_group_id]
    description     = "Allow EKS to access RDS"
  }

  ingress {
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    cidr_blocks     = var.db_allowed_cidr_blocks
    description     = "Allow specific CIDRs to access RDS"
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "assetflow-${var.environment}-rds-sg"
    Environment = var.environment
    Project = "AssetFlowAI"
  }
}

# Redis Security Group
resource "aws_security_group" "redis" {
  name_prefix = "assetflow-${var.environment}-redis-"
  description = "Security group for Redis"
  vpc_id      = module.vpc.vpc_id

  ingress {
    from_port       = 6379
    to_port         = 6379
    protocol        = "tcp"
    security_groups = [module.eks.cluster_security_group_id]
    description     = "Allow EKS to access Redis"
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "assetflow-${var.environment}-redis-sg"
    Environment = var.environment
    Project = "AssetFlowAI"
  }
}

# RabbitMQ Security Group
resource "aws_security_group" "rabbitmq" {
  count = var.environment == "prod" ? 1 : 0
  
  name_prefix = "assetflow-${var.environment}-rabbitmq-"
  description = "Security group for RabbitMQ"
  vpc_id      = module.vpc.vpc_id

  ingress {
    from_port       = 5671
    to_port         = 5672
    protocol        = "tcp"
    security_groups = [module.eks.cluster_security_group_id]
    description     = "Allow EKS to access RabbitMQ"
  }

  ingress {
    from_port       = 15672
    to_port         = 15672
    protocol        = "tcp"
    security_groups = [module.eks.cluster_security_group_id]
    description     = "Allow EKS to access RabbitMQ management UI"
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "assetflow-${var.environment}-rabbitmq-sg"
    Environment = var.environment
    Project = "AssetFlowAI"
  }
}

# Load Balancer Security Group
resource "aws_security_group" "lb" {
  name_prefix = "assetflow-${var.environment}-lb-"
  description = "Security group for Load Balancer"
  vpc_id      = module.vpc.vpc_id

  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
    description = "Allow HTTPS from internet"
  }

  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
    description = "Allow HTTP from internet"
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "assetflow-${var.environment}-lb-sg"
    Environment = var.environment
    Project = "AssetFlowAI"
  }
}

# Bastion Security Group
resource "aws_security_group" "bastion" {
  count = var.environment == "prod" ? 1 : 0
  
  name_prefix = "assetflow-${var.environment}-bastion-"
  description = "Security group for Bastion host"
  vpc_id      = module.vpc.vpc_id

  ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = var.bastion_allowed_cidrs
    description = "Allow SSH from authorized IPs"
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "assetflow-${var.environment}-bastion-sg"
    Environment = var.environment
    Project = "AssetFlowAI"
  }
}

# ============================================
# IAM ROLES AND POLICIES
# ============================================

# EKS Node IAM Role
resource "aws_iam_role" "eks_node" {
  name = "assetflow-${var.environment}-eks-node-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "ec2.amazonaws.com"
        }
      }
    ]
  })

  tags = {
    Environment = var.environment
    Project = "AssetFlowAI"
  }
}

resource "aws_iam_role_policy_attachment" "eks_node_worker" {
  policy_arn = "arn:aws:iam::aws:policy/AmazonEKSWorkerNodePolicy"
  role       = aws_iam_role.eks_node.name
}

resource "aws_iam_role_policy_attachment" "eks_node_cni" {
  policy_arn = "arn:aws:iam::aws:policy/AmazonEKS_CNI_Policy"
  role       = aws_iam_role.eks_node.name
}

resource "aws_iam_role_policy_attachment" "eks_node_registry" {
  policy_arn = "arn:aws:iam::aws:policy/AmazonEC2ContainerRegistryReadOnly"
  role       = aws_iam_role.eks_node.name
}

# Custom policy for EKS nodes
resource "aws_iam_policy" "eks_node_custom" {
  name        = "assetflow-${var.environment}-eks-node-custom-policy"
  description = "Custom policy for EKS nodes"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:PutObject",
          "s3:DeleteObject",
          "s3:ListBucket"
        ]
        Resource = [
          aws_s3_bucket.uploads.arn,
          "${aws_s3_bucket.uploads.arn}/*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "secretsmanager:GetSecretValue",
          "secretsmanager:PutSecretValue"
        ]
        Resource = "arn:aws:secretsmanager:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:secret:assetflow-${var.environment}-*"
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "eks_node_custom" {
  policy_arn = aws_iam_policy.eks_node_custom.arn
  role       = aws_iam_role.eks_node.name
}

# ============================================
# SECRETS MANAGER
# ============================================

resource "aws_secretsmanager_secret" "db_password" {
  name = "assetflow-${var.environment}-db-password"
  description = "Database password for AssetFlow AI"
  
  tags = {
    Environment = var.environment
    Project = "AssetFlowAI"
  }
}

resource "aws_secretsmanager_secret_version" "db_password" {
  secret_id     = aws_secretsmanager_secret.db_password.id
  secret_string = random_password.db_password.result
}

resource "aws_secretsmanager_secret" "redis_password" {
  name = "assetflow-${var.environment}-redis-password"
  description = "Redis password for AssetFlow AI"
  
  tags = {
    Environment = var.environment
    Project = "AssetFlowAI"
  }
}

resource "aws_secretsmanager_secret_version" "redis_password" {
  secret_id     = aws_secretsmanager_secret.redis_password.id
  secret_string = random_password.redis_password.result
}

resource "aws_secretsmanager_secret" "jwt_secret" {
  name = "assetflow-${var.environment}-jwt-secret"
  description = "JWT secret for AssetFlow AI"
  
  tags = {
    Environment = var.environment
    Project = "AssetFlowAI"
  }
}

resource "aws_secretsmanager_secret_version" "jwt_secret" {
  secret_id     = aws_secretsmanager_secret.jwt_secret.id
  secret_string = random_password.jwt_secret.result
}

# ============================================
# CLOUDWATCH LOGS
# ============================================

resource "aws_cloudwatch_log_group" "api" {
  name              = "/assetflow/${var.environment}/api"
  retention_in_days = var.environment == "prod" ? 90 : 30
  
  tags = {
    Environment = var.environment
    Project = "AssetFlowAI"
  }
}

resource "aws_cloudwatch_log_group" "ai_service" {
  name              = "/assetflow/${var.environment}/ai-service"
  retention_in_days = var.environment == "prod" ? 90 : 30
  
  tags = {
    Environment = var.environment
    Project = "AssetFlowAI"
  }
}

resource "aws_cloudwatch_log_group" "web" {
  name              = "/assetflow/${var.environment}/web"
  retention_in_days = var.environment == "prod" ? 90 : 30
  
  tags = {
    Environment = var.environment
    Project = "AssetFlowAI"
  }
}

resource "aws_cloudwatch_log_group" "nginx" {
  name              = "/assetflow/${var.environment}/nginx"
  retention_in_days = var.environment == "prod" ? 90 : 30
  
  tags = {
    Environment = var.environment
    Project = "AssetFlowAI"
  }
}

# ============================================
# VARIABLES
# ============================================

variable "aws_region" {
  description = "AWS Region"
  type        = string
  default     = "us-east-1"
}

variable "environment" {
  description = "Environment name (dev, staging, prod)"
  type        = string
  default     = "dev"
  
  validation {
    condition     = contains(["dev", "staging", "prod"], var.environment)
    error_message = "Environment must be dev, staging, or prod"
  }
}

variable "vpc_cidr" {
  description = "VPC CIDR block"
  type        = string
  default     = "10.0.0.0/16"
}

variable "private_subnet_cidrs" {
  description = "Private subnet CIDRs"
  type        = list(string)
  default     = ["10.0.1.0/24", "10.0.2.0/24", "10.0.3.0/24"]
}

variable "public_subnet_cidrs" {
  description = "Public subnet CIDRs"
  type        = list(string)
  default     = ["10.0.101.0/24", "10.0.102.0/24", "10.0.103.0/24"]
}

variable "database_subnet_cidrs" {
  description = "Database subnet CIDRs"
  type        = list(string)
  default     = ["10.0.201.0/24", "10.0.202.0/24", "10.0.203.0/24"]
}

variable "intra_subnet_cidrs" {
  description = "Intra subnet CIDRs"
  type        = list(string)
  default     = ["10.0.251.0/24", "10.0.252.0/24", "10.0.253.0/24"]
}

variable "desired_capacity" {
  description = "Desired EKS node capacity"
  type        = number
  default     = 2
}

variable "max_capacity" {
  description = "Max EKS node capacity"
  type        = number
  default     = 5
}

variable "min_capacity" {
  description = "Min EKS node capacity"
  type        = number
  default     = 1
}

variable "instance_type" {
  description = "EC2 instance type for EKS nodes"
  type        = string
  default     = "t3.medium"
}

variable "spot_instance_types" {
  description = "Spot instance types for EKS nodes"
  type        = list(string)
  default     = ["t3.medium", "t3a.medium", "t3.small"]
}

variable "ebs_volume_size" {
  description = "EBS volume size for EKS nodes"
  type        = number
  default     = 80
}

variable "db_instance_class" {
  description = "RDS instance class"
  type        = string
  default     = "db.t3.medium"
}

variable "db_allocated_storage" {
  description = "RDS allocated storage"
  type        = number
  default     = 20
}

variable "db_max_allocated_storage" {
  description = "RDS max allocated storage"
  type        = number
  default     = 100
}

variable "db_allowed_cidr_blocks" {
  description = "CIDR blocks allowed to access RDS"
  type        = list(string)
  default     = []
}

variable "redis_node_type" {
  description = "Redis node type"
  type        = string
  default     = "cache.t3.micro"
}

variable "bastion_allowed_cidrs" {
  description = "CIDR blocks allowed to access bastion"
  type        = list(string)
  default     = ["0.0.0.0/0"]
}

variable "cors_origins" {
  description = "CORS allowed origins for S3 bucket"
  type        = list(string)
  default     = ["http://localhost:3000", "https://assetflow.ai"]
}

# ============================================
# OUTPUTS
# ============================================

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

output "db_endpoint" {
  description = "RDS endpoint"
  value       = module.rds.db_instance_endpoint
}

output "db_password" {
  description = "Database password"
  value       = random_password.db_password.result
  sensitive   = true
}

output "redis_endpoint" {
  description = "Redis endpoint"
  value       = module.redis.elasticache_cluster_endpoint
}

output "redis_password" {
  description = "Redis password"
  value       = random_password.redis_password.result
  sensitive   = true
}

output "jwt_secret" {
  description = "JWT secret"
  value       = random_password.jwt_secret.result
  sensitive   = true}

output "s3_uploads_bucket" {
  description = "S3 uploads bucket name"
  value       = aws_s3_bucket.uploads.id
}

output "s3_backup_bucket" {
  description = "S3 backup bucket name"
  value       = aws_s3_bucket.backup.id
}

output "rabbitmq_endpoint" {
  description = "RabbitMQ endpoint"
  value       = var.environment == "prod" ? try(aws_mq_broker.rabbitmq[0].instances[0].endpoints[0], "") : ""
}

output "secrets" {
  description = "Secrets manager ARNs"
  value = {
    db_password     = aws_secretsmanager_secret.db_password.arn
    redis_password  = aws_secretsmanager_secret.redis_password.arn
    jwt_secret      = aws_secretsmanager_secret.jwt_secret.arn
  }
}