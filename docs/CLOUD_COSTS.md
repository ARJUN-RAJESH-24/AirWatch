# AirWatch Cloud Cost Analysis & Financial Controls

## 1. Cloud Expenditure Philosophy

Cloud engineering for academic and early-stage production workloads requires rigorous cost awareness. AirWatch adheres to the principle of **frugal, sustainable architecture**:
1. Zero dependencies on paid services during local development and testing.
2. Complete local reproducibility via Docker Compose and SQLite fallback.
3. No automatic provisioning of paid infrastructure.
4. Explicit budget boundaries and alerting triggers.

> **Disclaimer**: Cloud providers do not guarantee zero expenditure under all conditions. Resource usage beyond Free Tier allowances, data transfer out, and snapshot retention may incur modest charges.

---

## 2. AWS Resource Cost Breakdown (Estimated Monthly)

Calculated for AWS Region `ap-south-1` (Mumbai):

| Resource | Architecture Role | Sizing / Tier | Free Tier Eligible | Estimated Monthly Cost (USD) |
| :--- | :--- | :--- | :--- | :--- |
| **Compute (EC2 / ECS)** | Axum Backend & Nginx | `t3.micro` / `t4g.small` | Yes (750 hrs/month for 12 mos) | $0.00 (Free Tier) / ~$7.50 |
| **Database (Amazon RDS)**| Relational Store | `db.t4g.micro` (20 GB gp3) | Yes (750 hrs/month for 12 mos) | $0.00 (Free Tier) / ~$12.00 |
| **Object Storage (S3)** | Raw CSV & Provenance | Standard Storage (< 100 MB) | Yes (5 GB free) | < $0.05 |
| **VPC & Networking** | Private Database Isolation | Single VPC, 4 subnets, 1 IGW | Yes (No charge for VPC/IGW) | $0.00 |
| **Data Transfer Out** | Dashboard Client Traffic | < 5 GB monthly | Yes (100 GB/month free) | $0.00 |
| **CloudWatch Logs** | Telemetry & Ingestion Logs | 14-day retention (< 1 GB) | Yes (5 GB ingestion free) | $0.00 |
| **Total Estimated Spend**| Full Production Footprint | | | **$0.00 – $19.55 / month** |

---

## 3. Cost-Awareness & Safety Checklist

- [ ] **Billing Alerts Activated**: Configured an AWS Budget with alarms at 85% ($12.75) and 100% ($15.00) of the monthly ceiling.
- [ ] **No Public Database Exposure**: RDS instance is marked `publicly_accessible = false` within private subnets, eliminating unauthorized internet port scanning charges.
- [ ] **Log Retention Enforced**: CloudWatch log retention is strictly set to 14 days, preventing unbounded log accumulation costs.
- [ ] **No NAT Gateways**: Uses direct Internet Gateway on public compute rather than costly managed AWS NAT Gateways ($32.40/month baseline).
- [ ] **S3 Lifecycle Rules**: Raw datasets are versioned and stored with standard infrequent access tiering where applicable.
- [ ] **Teardown Readiness**: Verified that `terraform destroy` successfully removes all created assets when experiments conclude.

---

## 4. Instructions for Creating an AWS Spending Budget

If configuring manually via the AWS Management Console:
1. Log in to the [AWS Billing & Cost Management Console](https://console.aws.amazon.com/billing/).
2. In the navigation pane, select **Budgets** -> **Create budget**.
3. Choose **Cost budget (Recommended)**.
4. Set **Budget amount**: Fixed amount of `$15.00` per month.
5. Add an alert threshold:
   - **Threshold 1**: `85%` of budgeted amount (Actual), notify administrator email.
   - **Threshold 2**: `100%` of budgeted amount (Forecasted), notify administrator email.
6. Review and confirm budget creation.

---

## 5. Security & Least-Privilege IAM Guidance

1. **Never Commit AWS Credentials**: Never store access key IDs (`AKIA...`) or secret access keys in git repositories or shell history.
2. **Use IAM Roles**: When running on EC2 or ECS, attach an IAM Instance Profile with minimal permissions:
   - `s3:GetObject`, `s3:PutObject` restricted to the specific AirWatch bucket ARN.
   - `logs:CreateLogStream`, `logs:PutLogEvents` restricted to `/ecs/airwatch-*`.
3. **Database Secrets**: Store database credentials in AWS Systems Manager Parameter Store or environment variables passed directly to container tasks.
