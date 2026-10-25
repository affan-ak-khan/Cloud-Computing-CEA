resource "aws_db_subnet_group" "main" {
  name       = "${var.project}-db-subnets"
  subnet_ids = aws_subnet.db[*].id

  tags = { Name = "${var.project}-db-subnets" }
}

resource "aws_db_instance" "main" {
  identifier     = "${var.project}-db"
  engine         = "postgres"
  engine_version = "16"
  instance_class = "db.t4g.micro"

  allocated_storage = 20
  storage_type      = "gp3"
  storage_encrypted = true

  db_name  = aws_ssm_parameter.db_name.value
  username = aws_ssm_parameter.db_user.value
  password = random_password.db.result

  db_subnet_group_name   = aws_db_subnet_group.main.name
  vpc_security_group_ids = [aws_security_group.db.id]
  publicly_accessible    = false
  multi_az               = false

  backup_retention_period = 1
  skip_final_snapshot     = true
  deletion_protection     = false
  apply_immediately       = true

  auto_minor_version_upgrade = true

  lifecycle {
    ignore_changes = [engine_version]
  }

  tags = { Name = "${var.project}-db" }
}

# The EC2 instances read the database address from here
resource "aws_ssm_parameter" "db_host" {
  name  = "/${var.project}/db_host"
  type  = "String"
  value = aws_db_instance.main.address
}

output "db_endpoint" {
  value = aws_db_instance.main.address
}
