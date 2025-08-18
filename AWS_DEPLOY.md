# 🚀 CodeMockLab AWS 部署指南

## 🏗️ AWS 架构概览

### 推荐架构
```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   CloudFront    │────│    Application    │────│      RDS        │
│      (CDN)      │    │  Load Balancer   │    │  (PostgreSQL)   │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                                │
                       ┌────────▼────────┐
                       │   EC2 Instances  │
                       │  (Auto Scaling)  │
                       └─────────────────┘
                                │
                       ┌────────▼────────┐
                       │  ElastiCache    │
                       │    (Redis)      │
                       └─────────────────┘
```

## 💰 成本预估

### 基础方案 (小型)
- **EC2 t3.medium**: $30/月
- **RDS db.t3.micro**: $15/月
- **ElastiCache t3.micro**: $12/月
- **Application Load Balancer**: $18/月
- **Route 53**: $1/月
- **总计**: ~$76/月

### 生产方案 (中型)
- **EC2 t3.large (2台)**: $120/月
- **RDS db.t3.small**: $25/月
- **ElastiCache t3.small**: $25/月
- **Application Load Balancer**: $18/月
- **CloudFront**: $10/月
- **Route 53**: $1/月
- **总计**: ~$199/月

## 🎯 第一步：创建 EC2 实例

### 1.1 启动实例
```bash
# 推荐配置
实例类型: t3.medium (2 vCPU, 4GB RAM)
操作系统: Ubuntu 22.04 LTS
存储: 30GB gp3 SSD
安全组: HTTP(80), HTTPS(443), SSH(22)
```

### 1.2 配置安全组
```bash
# 创建安全组
aws ec2 create-security-group \
  --group-name codemocklab-sg \
  --description "CodeMockLab Security Group"

# 添加规则
aws ec2 authorize-security-group-ingress \
  --group-name codemocklab-sg \
  --protocol tcp \
  --port 22 \
  --cidr 0.0.0.0/0

aws ec2 authorize-security-group-ingress \
  --group-name codemocklab-sg \
  --protocol tcp \
  --port 80 \
  --cidr 0.0.0.0/0

aws ec2 authorize-security-group-ingress \
  --group-name codemocklab-sg \
  --protocol tcp \
  --port 443 \
  --cidr 0.0.0.0/0
```

## 🗄️ 第二步：创建 RDS 数据库

### 2.1 创建数据库实例
```bash
# 创建数据库子网组
aws rds create-db-subnet-group \
  --db-subnet-group-name codemocklab-subnet-group \
  --db-subnet-group-description "CodeMockLab DB Subnet Group" \
  --subnet-ids subnet-xxxxxxxx subnet-yyyyyyyy

# 创建RDS实例
aws rds create-db-instance \
  --db-instance-identifier codemocklab-db \
  --db-instance-class db.t3.micro \
  --engine postgres \
  --engine-version 15.4 \
  --master-username codemocklab \
  --master-user-password "YourSecurePassword123!" \
  --allocated-storage 20 \
  --storage-type gp3 \
  --db-name codemocklab \
  --backup-retention-period 7 \
  --multi-az false \
  --publicly-accessible false \
  --db-subnet-group-name codemocklab-subnet-group
```

### 2.2 配置数据库安全组
```bash
# 创建数据库安全组
aws ec2 create-security-group \
  --group-name codemocklab-db-sg \
  --description "CodeMockLab Database Security Group"

# 只允许应用服务器访问
aws ec2 authorize-security-group-ingress \
  --group-name codemocklab-db-sg \
  --protocol tcp \
  --port 5432 \
  --source-group codemocklab-sg
```

## 🔄 第三步：创建 ElastiCache Redis

### 3.1 创建 Redis 集群
```bash
# 创建缓存子网组
aws elasticache create-cache-subnet-group \
  --cache-subnet-group-name codemocklab-cache-subnet \
  --cache-subnet-group-description "CodeMockLab Cache Subnet Group" \
  --subnet-ids subnet-xxxxxxxx subnet-yyyyyyyy

# 创建Redis实例
aws elasticache create-cache-cluster \
  --cache-cluster-id codemocklab-redis \
  --cache-node-type cache.t3.micro \
  --engine redis \
  --num-cache-nodes 1 \
  --cache-subnet-group-name codemocklab-cache-subnet
```

## ⚖️ 第四步：创建负载均衡器

### 4.1 创建应用负载均衡器
```bash
# 创建ALB
aws elbv2 create-load-balancer \
  --name codemocklab-alb \
  --subnets subnet-xxxxxxxx subnet-yyyyyyyy \
  --security-groups sg-xxxxxxxx \
  --scheme internet-facing \
  --type application

# 创建目标组
aws elbv2 create-target-group \
  --name codemocklab-targets \
  --protocol HTTP \
  --port 3000 \
  --vpc-id vpc-xxxxxxxx \
  --health-check-path /api/health \
  --health-check-interval-seconds 30 \
  --healthy-threshold-count 2 \
  --unhealthy-threshold-count 5
```

### 4.2 配置监听器
```bash
# 创建HTTP监听器
aws elbv2 create-listener \
  --load-balancer-arn arn:aws:elasticloadbalancing:... \
  --protocol HTTP \
  --port 80 \
  --default-actions Type=forward,TargetGroupArn=arn:aws:elasticloadbalancing:...

# 创建HTTPS监听器（需要SSL证书）
aws elbv2 create-listener \
  --load-balancer-arn arn:aws:elasticloadbalancing:... \
  --protocol HTTPS \
  --port 443 \
  --certificates CertificateArn=arn:aws:acm:... \
  --default-actions Type=forward,TargetGroupArn=arn:aws:elasticloadbalancing:...
```

## 🚀 第五步：部署应用

### 5.1 连接到 EC2 实例
```bash
# 使用SSH连接
ssh -i your-key.pem ubuntu@your-ec2-public-ip
```

### 5.2 安装依赖
```bash
# 更新系统
sudo apt update && sudo apt upgrade -y

# 安装Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# 安装其他依赖
sudo apt install -y nginx git build-essential

# 安装PM2
sudo npm install -g pm2
```

### 5.3 部署应用
```bash
# 克隆代码
cd /opt
sudo git clone https://github.com/your-username/CodeMockLab.git codemocklab
cd codemocklab

# 创建应用用户
sudo adduser --system --group codemocklab
sudo chown -R codemocklab:codemocklab /opt/codemocklab

# 安装依赖并构建
sudo -u codemocklab npm ci --production=false
sudo -u codemocklab npx prisma generate
sudo -u codemocklab npm run build
```

### 5.4 配置环境变量
```bash
# 创建生产环境配置
sudo -u codemocklab tee /opt/codemocklab/.env.production << EOF
# RDS 数据库配置
DATABASE_URL="postgresql://codemocklab:YourSecurePassword123!@codemocklab-db.xxxxxxxx.us-east-1.rds.amazonaws.com:5432/codemocklab"

# NextAuth 配置
NEXTAUTH_URL="https://your-domain.com"
NEXTAUTH_SECRET="$(openssl rand -base64 32)"

# DeepSeek AI 配置
DEEPSEEK_API_KEY="sk-your-deepseek-api-key"

# ElastiCache Redis 配置
REDIS_URL="redis://codemocklab-redis.xxxxxx.cache.amazonaws.com:6379"

# 应用配置
NODE_ENV="production"
UPLOAD_MAX_SIZE=10485760
INTERVIEW_DURATION_PROD=3600
EOF
```

### 5.5 初始化数据库
```bash
# 推送数据库schema
sudo -u codemocklab npx prisma db push
```

## 🌐 第六步：配置 Nginx

### 6.1 创建 Nginx 配置
```bash
sudo tee /etc/nginx/sites-available/codemocklab << 'EOF'
upstream codemocklab {
    server 127.0.0.1:3000;
    keepalive 64;
}

server {
    listen 80;
    server_name _;
    
    # 健康检查
    location /health {
        access_log off;
        return 200 "healthy\n";
        add_header Content-Type text/plain;
    }
    
    # 代理到应用
    location / {
        proxy_pass http://codemocklab;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
    
    client_max_body_size 10M;
}
EOF

# 启用配置
sudo ln -s /etc/nginx/sites-available/codemocklab /etc/nginx/sites-enabled/
sudo rm /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl restart nginx
```

## 🔧 第七步：启动应用

### 7.1 创建 PM2 配置
```bash
sudo -u codemocklab tee /opt/codemocklab/ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'codemocklab',
    script: 'npm',
    args: 'start',
    cwd: '/opt/codemocklab',
    instances: 'max',
    exec_mode: 'cluster',
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: '/var/log/codemocklab/error.log',
    out_file: '/var/log/codemocklab/out.log',
    log_file: '/var/log/codemocklab/combined.log',
    time: true
  }]
};
EOF
```

### 7.2 启动应用
```bash
# 创建日志目录
sudo mkdir -p /var/log/codemocklab
sudo chown -R codemocklab:codemocklab /var/log/codemocklab

# 启动应用
sudo -u codemocklab pm2 start /opt/codemocklab/ecosystem.config.js
sudo -u codemocklab pm2 save
sudo -u codemocklab pm2 startup

# 设置开机自启
sudo env PATH=$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u codemocklab --hp /home/codemocklab
```

## 📊 第八步：配置 Auto Scaling

### 8.1 创建 Launch Template
```bash
# 创建启动模板
aws ec2 create-launch-template \
  --launch-template-name codemocklab-template \
  --launch-template-data '{
    "ImageId": "ami-0c7217cdde317cfec",
    "InstanceType": "t3.medium",
    "SecurityGroupIds": ["sg-xxxxxxxx"],
    "UserData": "IyEvYmluL2Jhc2gKL29wdC9jb2RlbW9ja2xhYi9zY3JpcHRzL2F3cy1ib290c3RyYXAuc2g="
  }'
```

### 8.2 创建 Auto Scaling Group
```bash
# 创建Auto Scaling组
aws autoscaling create-auto-scaling-group \
  --auto-scaling-group-name codemocklab-asg \
  --launch-template LaunchTemplateName=codemocklab-template,Version=1 \
  --min-size 1 \
  --max-size 5 \
  --desired-capacity 2 \
  --target-group-arns arn:aws:elasticloadbalancing:... \
  --vpc-zone-identifier "subnet-xxxxxxxx,subnet-yyyyyyyy" \
  --health-check-type ELB \
  --health-check-grace-period 300
```

## 🌍 第九步：配置 CloudFront

### 9.1 创建 CloudFront 分发
```bash
# 创建分发配置
aws cloudfront create-distribution \
  --distribution-config '{
    "CallerReference": "codemocklab-'$(date +%s)'",
    "Comment": "CodeMockLab CDN",
    "DefaultCacheBehavior": {
      "TargetOriginId": "codemocklab-alb",
      "ViewerProtocolPolicy": "redirect-to-https",
      "TrustedSigners": {
        "Enabled": false,
        "Quantity": 0
      },
      "ForwardedValues": {
        "QueryString": true,
        "Cookies": {"Forward": "all"},
        "Headers": {
          "Quantity": 4,
          "Items": ["Host", "CloudFront-Forwarded-Proto", "CloudFront-Is-Desktop-Viewer", "CloudFront-Is-Mobile-Viewer"]
        }
      },
      "MinTTL": 0,
      "DefaultTTL": 86400,
      "MaxTTL": 31536000
    },
    "Origins": {
      "Quantity": 1,
      "Items": [{
        "Id": "codemocklab-alb",
        "DomainName": "your-alb-dns-name.us-east-1.elb.amazonaws.com",
        "CustomOriginConfig": {
          "HTTPPort": 80,
          "HTTPSPort": 443,
          "OriginProtocolPolicy": "https-only"
        }
      }]
    },
    "Enabled": true,
    "PriceClass": "PriceClass_100"
  }'
```

## 🔒 第十步：配置 SSL 证书

### 10.1 申请 ACM 证书
```bash
# 申请SSL证书
aws acm request-certificate \
  --domain-name your-domain.com \
  --validation-method DNS \
  --region us-east-1

# 获取验证记录
aws acm describe-certificate \
  --certificate-arn arn:aws:acm:us-east-1:123456789012:certificate/xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
```

### 10.2 配置 Route 53
```bash
# 创建托管区域
aws route53 create-hosted-zone \
  --name your-domain.com \
  --caller-reference $(date +%s)

# 添加A记录指向CloudFront
aws route53 change-resource-record-sets \
  --hosted-zone-id Z1D633PJN98FT9 \
  --change-batch '{
    "Changes": [{
      "Action": "CREATE",
      "ResourceRecordSet": {
        "Name": "your-domain.com",
        "Type": "A",
        "AliasTarget": {
          "DNSName": "d123456789.cloudfront.net",
          "EvaluateTargetHealth": false,
          "HostedZoneId": "Z2FDTNDATAQYW2"
        }
      }
    }]
  }'
```

## 📈 第十一步：监控和日志

### 11.1 配置 CloudWatch
```bash
# 安装CloudWatch Agent
wget https://s3.amazonaws.com/amazoncloudwatch-agent/amazon_linux/amd64/latest/amazon-cloudwatch-agent.rpm
sudo rpm -U ./amazon-cloudwatch-agent.rpm

# 配置监控
sudo tee /opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json << 'EOF'
{
  "logs": {
    "logs_collected": {
      "files": {
        "collect_list": [
          {
            "file_path": "/var/log/codemocklab/combined.log",
            "log_group_name": "/aws/ec2/codemocklab",
            "log_stream_name": "{instance_id}"
          }
        ]
      }
    }
  },
  "metrics": {
    "namespace": "CodeMockLab",
    "metrics_collected": {
      "cpu": {
        "measurement": ["cpu_usage_idle", "cpu_usage_iowait", "cpu_usage_user", "cpu_usage_system"],
        "metrics_collection_interval": 60
      },
      "disk": {
        "measurement": ["used_percent"],
        "metrics_collection_interval": 60,
        "resources": ["*"]
      },
      "mem": {
        "measurement": ["mem_used_percent"],
        "metrics_collection_interval": 60
      }
    }
  }
}
EOF

# 启动CloudWatch Agent
sudo /opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl \
  -a fetch-config \
  -m ec2 \
  -c file:/opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json \
  -s
```

### 11.2 设置告警
```bash
# CPU使用率告警
aws cloudwatch put-metric-alarm \
  --alarm-name "CodeMockLab-HighCPU" \
  --alarm-description "CPU usage above 80%" \
  --metric-name CPUUtilization \
  --namespace AWS/EC2 \
  --statistic Average \
  --period 300 \
  --threshold 80 \
  --comparison-operator GreaterThanThreshold \
  --evaluation-periods 2

# 内存使用率告警
aws cloudwatch put-metric-alarm \
  --alarm-name "CodeMockLab-HighMemory" \
  --alarm-description "Memory usage above 85%" \
  --metric-name mem_used_percent \
  --namespace CodeMockLab \
  --statistic Average \
  --period 300 \
  --threshold 85 \
  --comparison-operator GreaterThanThreshold \
  --evaluation-periods 2
```

## 🔄 第十二步：备份策略

### 12.1 RDS 自动备份
```bash
# 修改RDS实例启用备份
aws rds modify-db-instance \
  --db-instance-identifier codemocklab-db \
  --backup-retention-period 7 \
  --preferred-backup-window "03:00-04:00"
```

### 12.2 应用数据备份
```bash
# 创建S3存储桶
aws s3 mb s3://codemocklab-backups-$(date +%s)

# 创建备份脚本
sudo tee /opt/backup-codemocklab.sh << 'EOF'
#!/bin/bash
BUCKET="s3://codemocklab-backups-123456"
DATE=$(date +%Y%m%d_%H%M%S)

# 备份上传文件
if [ -d "/opt/codemocklab/public/uploads" ]; then
    tar -czf /tmp/uploads_$DATE.tar.gz /opt/codemocklab/public/uploads
    aws s3 cp /tmp/uploads_$DATE.tar.gz $BUCKET/uploads/
    rm /tmp/uploads_$DATE.tar.gz
fi

# 清理旧备份（保留30天）
aws s3 ls $BUCKET/uploads/ | grep ".tar.gz" | sort | head -n -30 | awk '{print $4}' | xargs -I {} aws s3 rm $BUCKET/uploads/{}
EOF

chmod +x /opt/backup-codemocklab.sh

# 设置定时任务
echo "0 2 * * * /opt/backup-codemocklab.sh" | sudo crontab -
```

## 🔧 维护和更新

### 更新应用
```bash
# 拉取最新代码
cd /opt/codemocklab
sudo -u codemocklab git pull origin main

# 安装依赖
sudo -u codemocklab npm ci --production=false

# 构建应用
sudo -u codemocklab npm run build

# 重启应用
sudo -u codemocklab pm2 reload codemocklab
```

### 扩容操作
```bash
# 修改Auto Scaling组
aws autoscaling update-auto-scaling-group \
  --auto-scaling-group-name codemocklab-asg \
  --desired-capacity 4

# 升级RDS实例类型
aws rds modify-db-instance \
  --db-instance-identifier codemocklab-db \
  --db-instance-class db.t3.small \
  --apply-immediately
```

## 🆘 故障排除

### 常见问题

1. **实例无法访问数据库**
```bash
# 检查安全组规则
aws ec2 describe-security-groups --group-names codemocklab-db-sg

# 测试连接
telnet your-rds-endpoint.rds.amazonaws.com 5432
```

2. **负载均衡器健康检查失败**
```bash
# 检查目标组健康状态
aws elbv2 describe-target-health --target-group-arn arn:aws:elasticloadbalancing:...

# 查看应用日志
sudo -u codemocklab pm2 logs codemocklab
```

3. **Redis连接问题**
```bash
# 检查ElastiCache状态
aws elasticache describe-cache-clusters --cache-cluster-id codemocklab-redis

# 测试Redis连接
redis-cli -h your-redis-endpoint.cache.amazonaws.com ping
```

## 📞 获取帮助

- 📧 邮件: ink.hz.github@gmail.com  
- 🐛 问题反馈: [GitHub Issues](https://github.com/ink-hz/CodeMockLab/issues)
- 📚 AWS文档: [AWS官方文档](https://docs.aws.amazon.com/)

---

**注意**: 请将文档中的占位符（如 `your-domain.com`、`arn:aws:...` 等）替换为实际值。