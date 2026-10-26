# AirWatch Deployment & Operations Guide

This guide covers deployment procedures for both local development environments and production cloud environments on AWS.

---

## 1. Local Zero-Dependency Execution (Bare Metal)

The platform is designed to run locally on developer workstations without requiring paid cloud services or complex daemon setup.

### Prerequisites
- **Rust Toolchain**: `stable` (v1.75+) with `cargo`
- **Node.js**: v18+ or v20+ with `npm`
- **Python**: 3.10+ with `requests`

### Step 1: Clone & Configure
```bash
git clone https://github.com/your-org/airwatch.git
cd airwatch
cp .env.example .env
```

### Step 2: Ingest Authoritative Government Data
Run the ingestion pipeline to parse the official CPCB CAAQMS datasets into the local database:
```bash
python ingestion/ingest.py --scope kerala
```
This populates `airwatch.db` with 437,000+ observations and 230 stations across India, prioritizing all 8 Kerala continuous monitoring stations.

### Step 3: Run Backend Tests & Start Backend Service
```bash
cd backend
cargo test --test api_tests
cargo run
```
The Axum backend will start on `http://localhost:3001`.

### Step 4: Run Frontend Tests & Start Frontend Service
In a separate terminal:
```bash
cd frontend
npm install
npm test
npm run dev
```
Open your browser at `http://localhost:3000`.

---

## 2. Local Containerized Deployment (Docker Compose)

Docker Compose provisions an isolated stack comprising PostgreSQL 16, the Rust Axum backend, and the React production frontend behind an Nginx reverse proxy.

```bash
# Build and launch all services in detached mode
docker-compose up -d --build

# Inspect running container health status
docker-compose ps

# Follow container logs
docker-compose logs -f backend

# Run the ingestion worker to populate the PostgreSQL database
docker-compose run --rm ingestion-worker

# Stop all containers (preserving database volume)
docker-compose down

# Teardown and delete persistent database volume
docker-compose down -v
```

---

## 3. AWS Cloud Deployment (Production)

### Architecture Highlights
- **Region**: `ap-south-1` (AWS Asia Pacific - Mumbai) for data sovereignty and lowest latency for Indian environmental researchers.
- **Network**: Custom VPC with isolated private database subnets. The PostgreSQL instance is **never** exposed to the public internet.
- **Compute**: Modest containerized deployment on AWS ECS Fargate or a lightweight EC2 instance (`t3.micro` / `t4g.small`).
- **Storage**: S3 Bucket with AES-256 server-side encryption for archiving raw government CSV files and cryptographic checksum sidecars.
- **Cost Controls**: AWS Budget with automated email alerts at 85% and 100% of the $15.00 monthly spending limit.

### Deployment Steps (Opt-In Terraform)
> **IMPORTANT**: Terraform execution is opt-in. Do not apply cloud resources without authorized credentials and budget approval.

1. Navigate to the terraform directory:
   ```bash
   cd infrastructure/terraform
   ```
2. Create your configuration from the template:
   ```bash
   cp terraform.tfvars.example terraform.tfvars
   # Edit terraform.tfvars and set db_password and alert_email
   ```
3. Initialize Terraform providers:
   ```bash
   terraform init
   ```
4. Review the execution plan:
   ```bash
   terraform plan -out=tfplan
   ```
5. Apply the reviewed plan:
   ```bash
   terraform apply tfplan
   ```

---

## 4. Rollback & Resource Cleanup Instructions

### Immediate Cloud Teardown
To permanently remove all provisioned AWS resources and eliminate all cloud expenditure:
```bash
cd infrastructure/terraform
terraform destroy
```

### Manual Verification Checklist
1. Verify S3 bucket deletion or empty the bucket before teardown.
2. Confirm the RDS instance has been terminated and no automated snapshots remain.
3. Check CloudWatch log groups and delete `/ecs/airwatch-production` if no longer required.
4. Verify the VPC has been deleted in the AWS Management Console.
