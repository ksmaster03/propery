#!/bin/bash
# === EC2 UserData: ติดตั้ง Docker + เตรียม /opt/doa ===
set -eux

# Update + install base packages
dnf update -y
dnf install -y docker git openssl tar gzip

# Start Docker + enable at boot
systemctl enable --now docker

# Install docker-compose plugin (v2)
mkdir -p /usr/local/lib/docker/cli-plugins
curl -SL https://github.com/docker/compose/releases/download/v2.29.7/docker-compose-linux-x86_64 -o /usr/local/lib/docker/cli-plugins/docker-compose
chmod +x /usr/local/lib/docker/cli-plugins/docker-compose

# สร้าง alias 'docker-compose' สำหรับความสะดวก
ln -sf /usr/local/lib/docker/cli-plugins/docker-compose /usr/local/bin/docker-compose

# Add ec2-user เข้า docker group (ไม่ต้อง sudo)
usermod -aG docker ec2-user

# เตรียม directory สำหรับ source code
mkdir -p /opt/doa
chown ec2-user:ec2-user /opt/doa

# Mark บอกว่า setup เสร็จ
echo "done" > /opt/doa/.setup-complete
