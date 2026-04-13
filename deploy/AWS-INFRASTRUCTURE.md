# AWS Infrastructure — DOA Property

## Region
**ap-southeast-7** (Asia Pacific - Bangkok)

## Resources Created

| Resource | ID / Name | Details |
|----------|-----------|---------|
| **EC2 Instance** | `i-0b86ae4ba6a3f5705` | t3.small, AL2023 |
| **Instance Name** | `doa-property` | — |
| **Public IP** | `43.210.173.149` | Elastic: No |
| **Private IP** | `172.31.34.122` | — |
| **Key Pair** | `doa-property` | [doa-property.pem](./doa-property.pem) |
| **Security Group** | `sg-06ac68b6e3f2efb24` | `doa-property-sg` |
| **VPC** | `vpc-0c6f2010687cd6175` | Default |
| **Subnet** | `subnet-0c467a509d034bc11` | Default |
| **AMI** | `ami-06d01e9ac01e04f6c` | al2023-ami-2023.11 |
| **Disk** | 20 GB gp3 | Root volume |

## Security Group Rules

**Inbound:**
- SSH (22) from `0.0.0.0/0` → for initial setup & maintenance

**Outbound:**
- Default (all) → required for Cloudflare Tunnel + Docker Hub

**No HTTP/HTTPS ingress** — ทุก web traffic เข้าผ่าน Cloudflare Tunnel

## SSH Access

```bash
ssh -i deploy/doa-property.pem ec2-user@43.210.173.149
```

## Services (Docker Compose on EC2)

```
/opt/doa/
├── docker-compose.yml
├── .env                       # JWT secrets + DB password + tunnel token
├── packages/
│   ├── api/ (Dockerfile)      # Express + Prisma
│   └── web/ (Dockerfile)      # React + Nginx
└── deploy/
    ├── deploy.sh              # Build + start
    ├── user-data.sh           # EC2 bootstrap script
    ├── doa-property.pem       # SSH key (gitignored)
    └── CLOUDFLARE-TUNNEL.md   # Tunnel setup guide
```

## AWS CLI Commands

ใช้ env vars (credentials จาก `D:\propre\guideline\property_accessKeys.csv`):

```bash
# Check instance status
aws ec2 describe-instances --instance-ids i-0b86ae4ba6a3f5705 \
  --query "Reservations[].Instances[].[State.Name,PublicIpAddress]" --output text

# Stop / Start
aws ec2 stop-instances --instance-ids i-0b86ae4ba6a3f5705
aws ec2 start-instances --instance-ids i-0b86ae4ba6a3f5705

# SSH
ssh -i deploy/doa-property.pem ec2-user@$(aws ec2 describe-instances \
  --instance-ids i-0b86ae4ba6a3f5705 \
  --query "Reservations[0].Instances[0].PublicIpAddress" --output text)
```

## Cost Estimate

| Component | Type | Est. Monthly (USD) |
|-----------|------|---------------------|
| EC2 | t3.small 24x7 | ~$16 |
| EBS | 20 GB gp3 | ~$2 |
| Data Transfer | Out via Cloudflare | $0 (free) |
| **Total** | | **~$18/month** |

## Redeploy

หลังแก้ไข source code:

```bash
# Local
cd /d/propre/doa-lease-system
rm -rf packages/api/dist packages/web/dist
tar --exclude='node_modules' --exclude='.git' --exclude='dist' --exclude='test-results' --exclude='deploy/*.pem' -czf /tmp/doa-source.tar.gz .

# Upload + redeploy
scp -i deploy/doa-property.pem /tmp/doa-source.tar.gz ec2-user@43.210.173.149:/opt/doa/
ssh -i deploy/doa-property.pem ec2-user@43.210.173.149 \
  "cd /opt/doa && tar -xzf doa-source.tar.gz && sudo docker compose up -d --build"
```
