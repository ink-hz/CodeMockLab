#!/bin/bash

# ====================================
# CodeMockLab AWS 自动部署脚本
# ====================================

set -e

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# 配置变量
APP_NAME="codemocklab"
APP_DIR="/opt/$APP_NAME"
APP_USER="codemocklab"
DB_NAME="codemocklab"
DB_USER="codemocklab"
NODE_VERSION="20"
DOMAIN=""
EMAIL=""
DB_PASSWORD=""
DB_ENDPOINT=""
REDIS_ENDPOINT=""
NEXTAUTH_SECRET=""
DEEPSEEK_API_KEY=""

# 打印带颜色的消息
print_message() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] ✅${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR] ❌${NC} $1"
    exit 1
}

print_warning() {
    echo -e "${YELLOW}[WARNING] ⚠️${NC} $1"
}

print_info() {
    echo -e "${BLUE}[INFO] ℹ️${NC} $1"
}

# 打印欢迎信息
print_welcome() {
    echo -e "${GREEN}"
    echo "======================================"
    echo "   🚀 CodeMockLab AWS 自动部署脚本"
    echo "======================================"
    echo -e "${NC}"
    echo
    print_info "此脚本将在你的 EC2 实例上部署 CodeMockLab"
    print_info "预计用时: 10-15 分钟"
    echo
}

# 检查是否为root用户
check_root() {
    if [[ $EUID -ne 0 ]]; then
        print_error "请使用root用户运行此脚本: sudo ./aws-deploy.sh"
    fi
}

# 收集配置信息
collect_config() {
    echo -e "${BLUE}=====================================${NC}"
    echo -e "${BLUE}   📝 配置信息收集${NC}"
    echo -e "${BLUE}=====================================${NC}"
    echo

    # 数据库配置
    echo -e "${YELLOW}1. 数据库配置${NC}"
    read -p "请输入 RDS 数据库端点 (例如: codemocklab-db.xxxxx.us-east-1.rds.amazonaws.com): " DB_ENDPOINT
    if [ -z "$DB_ENDPOINT" ]; then
        print_error "数据库端点不能为空"
    fi

    read -s -p "请输入数据库密码: " DB_PASSWORD
    echo
    if [ -z "$DB_PASSWORD" ]; then
        print_error "数据库密码不能为空"
    fi

    # Redis配置（可选）
    echo
    echo -e "${YELLOW}2. Redis 配置（可选）${NC}"
    read -p "请输入 Redis 端点 (可选，直接回车跳过): " REDIS_ENDPOINT

    # AI服务配置
    echo
    echo -e "${YELLOW}3. AI 服务配置${NC}"
    read -p "请输入 DeepSeek API Key: " DEEPSEEK_API_KEY
    if [ -z "$DEEPSEEK_API_KEY" ]; then
        print_warning "未设置 DeepSeek API Key，AI 功能将不可用"
    fi

    # 域名配置（可选）
    echo
    echo -e "${YELLOW}4. 域名配置（可选）${NC}"
    read -p "请输入域名 (可选，可以先用IP访问): " DOMAIN
    if [ -n "$DOMAIN" ]; then
        read -p "请输入邮箱地址 (用于SSL证书): " EMAIL
    fi

    # 生成随机密钥
    NEXTAUTH_SECRET=$(openssl rand -base64 32)

    echo
    print_message "配置收集完成"
    
    # 显示配置摘要
    echo
    echo -e "${BLUE}📋 配置摘要:${NC}"
    echo "数据库端点: $DB_ENDPOINT"
    echo "Redis端点: ${REDIS_ENDPOINT:-"未配置"}"
    echo "域名: ${DOMAIN:-"未配置（将使用IP访问）"}"
    echo "AI服务: ${DEEPSEEK_API_KEY:+已配置}"
    echo
    
    read -p "确认配置正确？(y/N): " confirm
    if [[ ! $confirm =~ ^[Yy]$ ]]; then
        print_error "部署已取消"
    fi
}

# 更新系统
update_system() {
    print_message "更新系统软件包..."
    apt update && apt upgrade -y
    apt install -y curl wget git vim build-essential software-properties-common unzip
}

# 安装 AWS CLI
install_aws_cli() {
    print_message "安装 AWS CLI..."
    if ! command -v aws &> /dev/null; then
        curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
        unzip awscliv2.zip
        ./aws/install
        rm -rf aws awscliv2.zip
        print_message "AWS CLI 安装完成"
    else
        print_info "AWS CLI 已安装"
    fi
}

# 安装Node.js
install_nodejs() {
    print_message "安装 Node.js v${NODE_VERSION}..."
    if ! command -v node &> /dev/null; then
        curl -fsSL https://deb.nodesource.com/setup_${NODE_VERSION}.x | bash -
        apt install -y nodejs
    fi
    
    # 验证安装
    node_version=$(node --version)
    npm_version=$(npm --version)
    print_message "Node.js 版本: $node_version"
    print_message "NPM 版本: $npm_version"
}

# 安装Nginx
install_nginx() {
    print_message "安装 Nginx..."
    apt install -y nginx
    systemctl start nginx
    systemctl enable nginx
    print_message "Nginx 安装完成"
}

# 安装PM2
install_pm2() {
    print_message "安装 PM2..."
    npm install -g pm2
    print_message "PM2 安装完成"
}

# 创建应用用户
create_app_user() {
    print_message "创建应用用户..."
    
    if id "$APP_USER" &>/dev/null; then
        print_warning "用户 $APP_USER 已存在"
    else
        adduser --system --group $APP_USER
        usermod -aG sudo $APP_USER
        print_message "用户 $APP_USER 创建成功"
    fi
}

# 克隆代码
clone_repository() {
    print_message "克隆代码仓库..."
    
    if [ -d "$APP_DIR" ]; then
        print_warning "目录 $APP_DIR 已存在，更新代码..."
        cd $APP_DIR
        sudo -u $APP_USER git pull origin main
    else
        cd /opt
        git clone https://github.com/ink-hz/CodeMockLab.git $APP_NAME
    fi
    
    chown -R $APP_USER:$APP_USER $APP_DIR
    print_message "代码准备完成"
}

# 配置环境变量
setup_environment() {
    print_message "配置环境变量..."
    
    # 构建数据库连接字符串
    DATABASE_URL="postgresql://$DB_USER:$DB_PASSWORD@$DB_ENDPOINT:5432/$DB_NAME"
    
    # 确定应用访问地址
    if [ -n "$DOMAIN" ]; then
        NEXTAUTH_URL="https://$DOMAIN"
    else
        # 获取 EC2 公网 IP
        EC2_PUBLIC_IP=$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4)
        NEXTAUTH_URL="http://$EC2_PUBLIC_IP"
    fi
    
    cat > $APP_DIR/.env.production << EOF
# 数据库配置
DATABASE_URL="$DATABASE_URL"

# NextAuth 配置
NEXTAUTH_URL="$NEXTAUTH_URL"
NEXTAUTH_SECRET="$NEXTAUTH_SECRET"

# DeepSeek AI 配置
DEEPSEEK_API_KEY="$DEEPSEEK_API_KEY"

# 应用配置
NODE_ENV="production"
UPLOAD_MAX_SIZE=10485760

# 面试配置
INTERVIEW_DURATION_PROD=3600
EOF

    # 添加 Redis 配置（如果提供）
    if [ -n "$REDIS_ENDPOINT" ]; then
        echo "REDIS_URL=\"redis://$REDIS_ENDPOINT:6379\"" >> $APP_DIR/.env.production
    fi
    
    chmod 600 $APP_DIR/.env.production
    chown $APP_USER:$APP_USER $APP_DIR/.env.production
    
    print_message "环境变量配置完成"
}

# 构建应用
build_application() {
    print_message "构建应用..."
    
    cd $APP_DIR
    
    # 切换到应用用户执行
    su - $APP_USER -s /bin/bash << EOF
cd $APP_DIR
npm ci --production=false
npx prisma generate
npx prisma db push
npm run build
EOF
    
    print_message "应用构建完成"
}

# 配置Nginx
setup_nginx() {
    print_message "配置 Nginx..."
    
    # 创建基本配置
    cat > /etc/nginx/sites-available/$APP_NAME << EOF
upstream $APP_NAME {
    server 127.0.0.1:3000;
    keepalive 64;
}

server {
    listen 80;
    server_name ${DOMAIN:-_};
    
    # 健康检查
    location /health {
        access_log off;
        return 200 "healthy\n";
        add_header Content-Type text/plain;
    }
    
    # 代理到应用
    location / {
        proxy_pass http://$APP_NAME;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
    
    # 静态文件缓存
    location /_next/static {
        proxy_pass http://$APP_NAME;
        proxy_cache_valid 60m;
        add_header Cache-Control "public, max-age=31536000, immutable";
    }
    
    client_max_body_size 10M;
}
EOF
    
    # 启用站点
    ln -sf /etc/nginx/sites-available/$APP_NAME /etc/nginx/sites-enabled/
    rm -f /etc/nginx/sites-enabled/default
    
    # 测试配置
    nginx -t
    systemctl reload nginx
    
    print_message "Nginx 配置完成"
}

# 配置SSL（如果有域名）
setup_ssl() {
    if [ -n "$DOMAIN" ] && [ -n "$EMAIL" ]; then
        print_message "配置 SSL 证书..."
        
        # 安装 Certbot
        apt install -y certbot python3-certbot-nginx
        
        # 申请证书
        certbot --nginx -d $DOMAIN --non-interactive --agree-tos -m $EMAIL
        
        # 设置自动续期
        echo "0 0,12 * * * root certbot renew -q" | tee -a /etc/crontab > /dev/null
        
        print_message "SSL 证书配置完成"
    else
        print_info "跳过 SSL 配置（未提供域名）"
    fi
}

# 创建PM2配置
setup_pm2() {
    print_message "配置 PM2..."
    
    # 获取 CPU 核心数
    CPU_CORES=$(nproc)
    
    cat > $APP_DIR/ecosystem.config.js << EOF
module.exports = {
  apps: [{
    name: '$APP_NAME',
    script: 'npm',
    args: 'start',
    cwd: '$APP_DIR',
    instances: $CPU_CORES,
    exec_mode: 'cluster',
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: '/var/log/$APP_NAME/error.log',
    out_file: '/var/log/$APP_NAME/out.log',
    log_file: '/var/log/$APP_NAME/combined.log',
    time: true
  }]
};
EOF
    
    # 创建日志目录
    mkdir -p /var/log/$APP_NAME
    chown -R $APP_USER:$APP_USER /var/log/$APP_NAME
    
    print_message "PM2 配置完成"
}

# 启动应用
start_application() {
    print_message "启动应用..."
    
    su - $APP_USER -s /bin/bash << EOF
cd $APP_DIR
pm2 start ecosystem.config.js
pm2 save
EOF
    
    # 配置开机自启
    env PATH=$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u $APP_USER --hp /home/$APP_USER
    
    print_message "应用启动成功"
}

# 配置防火墙
setup_firewall() {
    print_message "配置防火墙..."
    
    # 检查是否有 ufw
    if command -v ufw &> /dev/null; then
        ufw --force enable
        ufw allow ssh
        ufw allow 80/tcp
        ufw allow 443/tcp
        print_message "防火墙配置完成"
    else
        print_info "跳过防火墙配置（ufw 未安装）"
    fi
}

# 创建维护脚本
create_maintenance_scripts() {
    print_message "创建维护脚本..."
    
    # 更新脚本
    cat > /opt/update-$APP_NAME.sh << EOF
#!/bin/bash
cd $APP_DIR
sudo -u $APP_USER git pull origin main
sudo -u $APP_USER npm ci --production=false
sudo -u $APP_USER npm run build
sudo -u $APP_USER pm2 reload $APP_NAME
echo "应用更新完成"
EOF
    
    # 备份脚本
    cat > /opt/backup-$APP_NAME.sh << EOF
#!/bin/bash
BACKUP_DIR="/backup/$APP_NAME"
DATE=\$(date +%Y%m%d_%H%M%S)

mkdir -p \$BACKUP_DIR

# 备份上传文件
if [ -d "$APP_DIR/public/uploads" ]; then
    tar -czf \$BACKUP_DIR/uploads_\$DATE.tar.gz $APP_DIR/public/uploads
fi

# 备份环境配置
cp $APP_DIR/.env.production \$BACKUP_DIR/env_\$DATE.backup

# 保留最近7天的备份
find \$BACKUP_DIR -type f -mtime +7 -delete

echo "备份完成: \$BACKUP_DIR"
EOF
    
    chmod +x /opt/update-$APP_NAME.sh
    chmod +x /opt/backup-$APP_NAME.sh
    
    # 设置定时备份
    echo "0 2 * * * /opt/backup-$APP_NAME.sh" | crontab -
    
    print_message "维护脚本创建完成"
}

# 安装监控
setup_monitoring() {
    print_message "配置基础监控..."
    
    # 安装 htop
    apt install -y htop
    
    # 创建监控脚本
    cat > /opt/monitor-$APP_NAME.sh << EOF
#!/bin/bash
echo "=== 系统状态 ==="
date
echo
echo "=== 磁盘使用 ==="
df -h
echo
echo "=== 内存使用 ==="
free -h
echo
echo "=== CPU 使用 ==="
top -bn1 | grep "Cpu(s)" | awk '{print \$2 \$3 \$4}'
echo
echo "=== 应用状态 ==="
sudo -u $APP_USER pm2 status
echo
echo "=== 应用日志 (最近10行) ==="
sudo -u $APP_USER pm2 logs $APP_NAME --lines 10 --nostream
EOF
    
    chmod +x /opt/monitor-$APP_NAME.sh
    
    print_message "监控配置完成"
}

# 健康检查
health_check() {
    print_message "执行健康检查..."
    
    sleep 10
    
    # 检查本地服务
    if curl -f http://localhost/api/health > /dev/null 2>&1; then
        print_message "本地服务运行正常"
    else
        print_error "本地服务检查失败"
    fi
    
    # 检查 PM2 状态
    if sudo -u $APP_USER pm2 list | grep -q "$APP_NAME.*online"; then
        print_message "PM2 进程运行正常"
    else
        print_warning "PM2 进程状态异常"
    fi
    
    # 检查 Nginx 状态
    if systemctl is-active --quiet nginx; then
        print_message "Nginx 运行正常"
    else
        print_warning "Nginx 状态异常"
    fi
}

# 打印部署信息
print_deployment_info() {
    echo
    echo -e "${GREEN}=====================================${NC}"
    echo -e "${GREEN}   🎉 部署成功！${NC}"
    echo -e "${GREEN}=====================================${NC}"
    echo
    
    # 获取访问地址
    if [ -n "$DOMAIN" ]; then
        echo -e "🌐 应用地址: ${GREEN}https://$DOMAIN${NC}"
    else
        EC2_PUBLIC_IP=$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4)
        echo -e "🌐 应用地址: ${GREEN}http://$EC2_PUBLIC_IP${NC}"
    fi
    
    echo
    echo -e "📊 系统信息:"
    echo -e "  服务器IP: ${YELLOW}$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4)${NC}"
    echo -e "  数据库: ${YELLOW}$DB_ENDPOINT${NC}"
    echo -e "  Redis: ${YELLOW}${REDIS_ENDPOINT:-"未配置"}${NC}"
    echo
    echo -e "🔧 常用命令:"
    echo -e "  查看应用状态: ${YELLOW}sudo -u $APP_USER pm2 status${NC}"
    echo -e "  查看应用日志: ${YELLOW}sudo -u $APP_USER pm2 logs $APP_NAME${NC}"
    echo -e "  重启应用: ${YELLOW}sudo -u $APP_USER pm2 restart $APP_NAME${NC}"
    echo -e "  更新应用: ${YELLOW}/opt/update-$APP_NAME.sh${NC}"
    echo -e "  系统监控: ${YELLOW}/opt/monitor-$APP_NAME.sh${NC}"
    echo -e "  备份数据: ${YELLOW}/opt/backup-$APP_NAME.sh${NC}"
    echo
    echo -e "📋 下一步："
    echo -e "  1. 访问应用测试功能"
    echo -e "  2. 配置域名DNS解析（如果使用域名）"
    echo -e "  3. 设置监控告警"
    echo -e "  4. 定期备份数据"
    echo
    echo -e "${RED}🔐 请妥善保存数据库密码和 NextAuth Secret！${NC}"
    echo
}

# 主函数
main() {
    print_welcome
    check_root
    collect_config
    
    print_message "开始部署..."
    
    update_system
    install_aws_cli
    install_nodejs
    install_nginx
    install_pm2
    create_app_user
    clone_repository
    setup_environment
    build_application
    setup_nginx
    setup_ssl
    setup_pm2
    start_application
    setup_firewall
    create_maintenance_scripts
    setup_monitoring
    health_check
    
    print_deployment_info
    
    print_message "部署完成！🎉"
}

# 运行主函数
main "$@"