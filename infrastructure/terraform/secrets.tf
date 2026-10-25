variable "github_repo" {
  description = "GitHub repository allowed to deploy (owner/name, exact case)"
  type        = string
  default     = "affan-ak-khan/Cloud-Computing-CEA"
}

variable "ghcr_owner" {
  description = "Lowercase GitHub username that owns the GHCR images"
  type        = string
  default     = "affan-ak-khan"
}

# ---------- CloudWatch log group (7-day retention) ----------

resource "aws_cloudwatch_log_group" "app" {
  name              = "/${var.project}/app"
  retention_in_days = 7
}

# ---------- Database password: generated, never written to Git ----------

resource "random_password" "db" {
  length  = 24
  special = false
}

resource "aws_ssm_parameter" "db_password" {
  name  = "/${var.project}/db_password"
  type  = "SecureString"
  value = random_password.db.result
}

resource "aws_ssm_parameter" "db_name" {
  name  = "/${var.project}/db_name"
  type  = "String"
  value = "task_manager"
}

resource "aws_ssm_parameter" "db_user" {
  name  = "/${var.project}/db_user"
  type  = "String"
  value = "app_user"
}

resource "aws_ssm_parameter" "ghcr_owner" {
  name  = "/${var.project}/ghcr_owner"
  type  = "String"
  value = var.ghcr_owner
}

# The deploy job overwrites this value with the commit SHA, so Terraform must not revert it.
resource "aws_ssm_parameter" "image_tag" {
  name  = "/${var.project}/image_tag"
  type  = "String"
  value = "latest"

  lifecycle {
    ignore_changes = [value]
  }
}
