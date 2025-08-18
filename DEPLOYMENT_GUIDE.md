# 🚀 CodeMockLab 云端部署指南

## 📋 部署前检查清单

### ✅ 必需准备项
- [ ] 域名购买 (可选，推荐)
- [ ] 云服务商账户注册
- [ ] API密钥安全管理
- [ ] 数据库备份计划
- [ ] SSL证书配置

### ✅ 环境变量清理
- [ ] 移除测试API密钥
- [ ] 配置生产环境变量
- [ ] 验证所有必需的env变量

## 🌐 推荐部署方案

### 方案1: Vercel + Supabase (最推荐)

#### 优势
- ✅ Next.js原生优化
- ✅ 自动CI/CD
- ✅ 全球CDN加速
- ✅ 免费额度充足
- ✅ 零运维成本

#### 部署步骤
1. **准备Supabase数据库**
   ```bash
   # 1. 访问 https://supabase.com
   # 2. 创建新项目
   # 3. 获取数据库连接URL
   # 4. 在SQL编辑器中执行schema
   ```

2. **配置Vercel部署**
   ```bash
   # 1. 访问 https://vercel.com
   # 2. 连接GitHub仓库
   # 3. 配置环境变量
   # 4. 自动部署
   ```

3. **环境变量配置**
   ```env
   # 数据库
   DATABASE_URL="postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres"
   
   # 认证
   NEXTAUTH_URL="https://your-domain.vercel.app"
   NEXTAUTH_SECRET="your-secure-secret-key"
   
   # AI服务
   DEEPSEEK_API_KEY="your-deepseek-api-key"
   
   # 可选
   OPENAI_API_KEY="your-openai-api-key"
   ANTHROPIC_API_KEY="your-anthropic-api-key"
   ```

### 方案2: 阿里云 ECS + RDS

#### 适用场景
- 需要完全控制
- 国内用户为主
- 预算充足

#### 配置推荐
- **ECS**: 2核4G，Ubuntu 22.04
- **RDS**: PostgreSQL 14
- **带宽**: 5M起步
- **存储**: SSD 40GB起步

#### 部署脚本
```bash
#!/bin/bash
# 服务器环境准备
sudo apt update && sudo apt upgrade -y

# 安装Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# 安装PM2
sudo npm install -g pm2

# 安装Nginx
sudo apt install nginx -y

# 克隆项目
git clone https://github.com/ink-hz/CodeMockLab.git
cd CodeMockLab

# 安装依赖
npm install

# 构建项目
npm run build

# 配置环境变量
cp .env.example .env.local
# 编辑 .env.local 填入生产环境配置

# 启动应用
pm2 start npm --name "codemocklab" -- start
pm2 save
pm2 startup
```

### 方案3: Railway (最简单)

#### 一键部署
1. 访问 [Railway](https://railway.app)
2. 连接GitHub仓库
3. 添加PostgreSQL服务
4. 配置环境变量
5. 自动部署完成

## 🔧 部署配置详情

### 数据库迁移
```bash
# 生产环境数据库初始化
npx prisma db push

# 生成Prisma客户端
npx prisma generate
```

### Nginx配置 (如使用ECS)
```nginx
server {
    listen 80;
    server_name your-domain.com;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### SSL配置 (Let's Encrypt)
```bash
# 安装Certbot
sudo apt install certbot python3-certbot-nginx

# 获取SSL证书
sudo certbot --nginx -d your-domain.com

# 自动续期
sudo crontab -e
# 添加: 0 12 * * * /usr/bin/certbot renew --quiet
```

## 🔒 安全配置

### 1. API密钥管理
- 使用环境变量存储所有密钥
- 定期轮换API密钥
- 监控API使用量

### 2. 数据库安全
- 启用SSL连接
- 限制访问IP
- 定期备份数据

### 3. 服务器安全 (ECS)
```bash
# 防火墙配置
sudo ufw enable
sudo ufw allow ssh
sudo ufw allow 80
sudo ufw allow 443

# 禁用root登录
sudo nano /etc/ssh/sshd_config
# PermitRootLogin no
sudo systemctl restart ssh
```

## 📊 监控和维护

### 1. 应用监控
- 使用Vercel Analytics (Vercel方案)
- 配置错误监控 (Sentry)
- 性能监控 (New Relic)

### 2. 数据库监控
- 查询性能监控
- 连接数监控
- 存储空间监控

### 3. 日志管理
```bash
# PM2日志查看 (ECS方案)
pm2 logs codemocklab

# 日志轮转配置
pm2 install pm2-logrotate
```

## 💰 成本估算

### Vercel + Supabase
- **免费额度**: 适合小规模使用
- **Pro版本**: $20/月 (Vercel) + $25/月 (Supabase)

### 阿里云ECS + RDS
- **基础配置**: ¥200-400/月
- **标准配置**: ¥500-800/月

### Railway
- **Starter**: $5/月
- **Pro**: $20/月

## 🚀 推荐部署流程

1. **第一阶段**: 使用Vercel + Supabase快速上线
2. **第二阶段**: 根据用户量考虑迁移到ECS
3. **第三阶段**: 实施CDN、负载均衡等高级功能

## 🔗 有用的链接

- [Vercel部署文档](https://vercel.com/docs)
- [Supabase入门指南](https://supabase.com/docs)
- [Next.js部署最佳实践](https://nextjs.org/docs/deployment)
- [Prisma生产环境配置](https://www.prisma.io/docs/guides/deployment)