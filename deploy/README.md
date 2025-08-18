# 🚀 CodeMockLab 部署文件说明

本目录包含 CodeMockLab 的各种部署配置文件，可以帮助你在不同环境中快速部署应用。

## 📁 文件列表

### `nginx.conf`
Nginx 反向代理配置文件，包含：
- HTTPS 重定向
- SSL 安全配置
- 静态资源缓存
- 安全头部设置
- 速率限制
- 健康检查

**使用方法：**
```bash
# 复制配置文件
sudo cp nginx.conf /etc/nginx/sites-available/codemocklab

# 修改域名
sudo sed -i 's/your-domain.com/实际域名/g' /etc/nginx/sites-available/codemocklab

# 启用站点
sudo ln -s /etc/nginx/sites-available/codemocklab /etc/nginx/sites-enabled/

# 测试配置
sudo nginx -t

# 重载配置
sudo systemctl reload nginx
```

### `codemocklab.service`
systemd 服务配置文件，用于：
- 开机自启
- 进程管理
- 资源限制
- 日志管理
- 自动重启

**使用方法：**
```bash
# 复制服务文件
sudo cp codemocklab.service /etc/systemd/system/

# 重载 systemd
sudo systemctl daemon-reload

# 启用服务
sudo systemctl enable codemocklab

# 启动服务
sudo systemctl start codemocklab

# 查看状态
sudo systemctl status codemocklab

# 查看日志
sudo journalctl -u codemocklab -f
```

## 🔧 快速部署（推荐）

### 方式一：自动化脚本部署
```bash
# 下载自动化部署脚本
wget https://raw.githubusercontent.com/ink-hz/CodeMockLab/master/scripts/aws-deploy.sh

# 赋予执行权限
chmod +x aws-deploy.sh

# 运行部署脚本（需要root权限）
sudo ./aws-deploy.sh
```

### 方式二：手动部署
参考 [AWS_DEPLOY.md](../AWS_DEPLOY.md) 详细指南

## ⚙️ 配置选项

### 环境变量
确保在 `/opt/codemocklab/.env.production` 中配置：
```bash
DATABASE_URL="postgresql://user:password@localhost:5432/codemocklab"
NEXTAUTH_URL="https://your-domain.com"
NEXTAUTH_SECRET="your-secret-key"
DEEPSEEK_API_KEY="sk-your-api-key"
```

### 服务管理命令
```bash
# 启动服务
sudo systemctl start codemocklab

# 停止服务
sudo systemctl stop codemocklab

# 重启服务
sudo systemctl restart codemocklab

# 查看状态
sudo systemctl status codemocklab

# 启用开机自启
sudo systemctl enable codemocklab

# 禁用开机自启
sudo systemctl disable codemocklab
```

### Nginx 管理命令
```bash
# 重载配置
sudo systemctl reload nginx

# 重启 Nginx
sudo systemctl restart nginx

# 测试配置语法
sudo nginx -t

# 查看错误日志
sudo tail -f /var/log/nginx/error.log

# 查看访问日志
sudo tail -f /var/log/nginx/access.log
```

## 🔒 SSL 证书配置

### 使用 Let's Encrypt
```bash
# 安装 certbot
sudo apt install certbot python3-certbot-nginx

# 申请证书
sudo certbot --nginx -d your-domain.com

# 自动续期
sudo certbot renew --dry-run
```

### 自定义证书
如果你有自己的 SSL 证书，修改 nginx.conf 中的路径：
```nginx
ssl_certificate /path/to/your/certificate.pem;
ssl_certificate_key /path/to/your/private.key;
```

## 📊 监控和维护

### 查看应用日志
```bash
# 系统服务日志
sudo journalctl -u codemocklab -f

# Nginx 日志
sudo tail -f /var/log/nginx/codemocklab_access.log
sudo tail -f /var/log/nginx/codemocklab_error.log
```

### 性能监控
```bash
# 查看进程状态
ps aux | grep codemocklab

# 查看端口占用
sudo netstat -tulpn | grep :3000

# 查看内存使用
free -h

# 查看磁盘使用
df -h
```

## 🛠️ 故障排除

### 常见问题

1. **服务启动失败**
```bash
# 查看详细错误
sudo journalctl -u codemocklab -n 50

# 检查配置文件
sudo systemctl status codemocklab
```

2. **Nginx 502 错误**
```bash
# 检查应用是否运行
curl http://localhost:3000/api/health

# 查看 Nginx 错误日志
sudo tail -f /var/log/nginx/error.log
```

3. **SSL 证书问题**
```bash
# 检查证书有效期
sudo certbot certificates

# 手动续期
sudo certbot renew
```

## 📞 获取帮助

- 📧 邮件: ink.hz.github@gmail.com
- 🐛 问题反馈: [GitHub Issues](https://github.com/ink-hz/CodeMockLab/issues)
- 📚 完整文档: [部署指南](../ALIYUN_DEPLOY.md)