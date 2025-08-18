# 🎯 AWS 控制台部署 CodeMockLab 详细指南

## 📋 准备工作清单

在开始之前，请确保：
- [x] 已登录 AWS 控制台
- [ ] 选择合适的区域（推荐：us-east-1 或 ap-southeast-1）
- [ ] 准备一个域名（可选，但强烈推荐）

## 🚀 第一步：创建 EC2 实例（5分钟）

### 1.1 进入 EC2 控制台
1. 在 AWS 控制台顶部搜索 **"EC2"**
2. 点击进入 EC2 Dashboard
3. 确认右上角区域是 **"US East (N. Virginia) us-east-1"**

### 1.2 启动实例
1. 点击橙色按钮 **"Launch Instance"**
2. 填写以下信息：

```
实例名称: CodeMockLab-Server
应用程序和操作系统映像: Ubuntu Server 22.04 LTS (免费套餐符合条件)
架构: 64位 (x86)
实例类型: t3.medium (2 vCPU, 4 GiB RAM) - 推荐生产使用
或选择: t2.micro (1 vCPU, 1 GiB RAM) - 仅用于测试
```

### 1.3 创建密钥对
1. 在 **"密钥对（登录）"** 部分点击 **"创建新密钥对"**
2. 填写信息：
   ```
   密钥对名称: codemocklab-key
   密钥对类型: RSA
   私有密钥文件格式: .pem (for SSH)
   ```
3. 点击 **"创建密钥对"** 并下载保存 `.pem` 文件

### 1.4 配置网络设置
1. 在 **"网络设置"** 部分点击 **"编辑"**
2. 勾选以下选项：
   - [x] 允许来自互联网的 HTTPS 流量
   - [x] 允许来自互联网的 HTTP 流量
   - [x] 允许 SSH 流量来源：任何位置 0.0.0.0/0

### 1.5 配置存储
```
卷类型: gp3
大小: 30 GiB
```

### 1.6 启动实例
1. 点击右侧 **"启动实例"**
2. 等待实例状态变为 **"Running"**（约2-3分钟）

---

## 🗄️ 第二步：创建 RDS 数据库（8分钟）

### 2.1 进入 RDS 控制台
1. 在 AWS 控制台搜索 **"RDS"**
2. 点击进入 RDS Dashboard

### 2.2 创建数据库
1. 点击 **"创建数据库"**
2. 选择 **"标准创建"**
3. 填写配置：

```
引擎选项: PostgreSQL
版本: PostgreSQL 15.4-R2

模板: 生产（Production）或免费套餐（Free tier）

设置:
  数据库实例标识符: codemocklab-db
  主用户名: codemocklab
  主密码: YourSecurePassword123!
  确认密码: YourSecurePassword123!

实例配置:
  数据库实例类: db.t3.micro (免费套餐) 或 db.t3.small (生产)

存储:
  存储类型: 通用目的 SSD (gp3)
  分配的存储空间: 20 GiB
  启用存储自动扩展: 是
  最大存储阈值: 100 GiB

连接:
  计算资源: 不连接到 EC2 计算资源
  虚拟私有云 (VPC): 默认 VPC
  公开访问: 否
  VPC 安全组: 创建新的
  新 VPC 安全组名称: codemocklab-db-sg
  可用区: 无首选项
  数据库端口: 5432

数据库身份验证:
  数据库身份验证选项: 密码身份验证

其他配置:
  初始数据库名称: codemocklab
  备份保留期: 7 天
  启用自动备份: 是
  备份窗口: 选择一个时间段（建议凌晨2-3点）
  启用删除保护: 否（测试环境）
```

### 2.3 创建数据库
1. 点击 **"创建数据库"**
2. 等待数据库状态变为 **"可用"**（约10-15分钟）

---

## 🔄 第三步：创建 ElastiCache Redis（可选，5分钟）

### 3.1 进入 ElastiCache 控制台
1. 搜索 **"ElastiCache"**
2. 点击进入 ElastiCache Dashboard

### 3.2 创建 Redis 集群
1. 点击 **"创建"**
2. 选择 **"Redis"**
3. 填写配置：

```
集群模式: 禁用集群模式
位置: AWS 云

Redis 设置:
  名称: codemocklab-redis
  描述: Redis cache for CodeMockLab
  节点类型: cache.t3.micro
  副本数: 0

子网组设置:
  子网组: 创建新的
  名称: codemocklab-cache-subnet
  VPC ID: 选择默认 VPC
  可用区和子网: 添加所有可用区的子网

安全组:
  选择现有安全组: 默认安全组
  
备份:
  启用自动备份: 否（测试环境）
```

### 3.3 创建集群
1. 点击 **"创建"**
2. 等待状态变为 **"可用"**（约5-8分钟）

---

## 🔒 第四步：配置安全组（3分钟）

### 4.1 修改数据库安全组
1. 在 EC2 控制台，点击左侧 **"安全组"**
2. 找到 **"codemocklab-db-sg"** 安全组
3. 选中后点击 **"入站规则"** 标签
4. 点击 **"编辑入站规则"**
5. 添加规则：
   ```
   类型: PostgreSQL
   协议: TCP
   端口范围: 5432
   源: 选择 EC2 实例的安全组（launch-wizard-xxx）
   ```
6. 点击 **"保存规则"**

### 4.2 修改 Redis 安全组（如果创建了 Redis）
1. 找到默认安全组或 Redis 相关安全组
2. 添加入站规则：
   ```
   类型: 自定义 TCP
   端口范围: 6379
   源: 选择 EC2 实例的安全组
   ```

---

## 🚀 第五步：连接并部署应用（15分钟）

### 5.1 获取连接信息
1. **EC2 公网 IP**：在 EC2 实例详情页面复制 "公有 IPv4 地址"
2. **RDS 连接端点**：在 RDS 数据库详情页面复制 "终端节点"
3. **Redis 端点**（如果有）：在 ElastiCache 节点详情复制 "主端点"

### 5.2 连接到 EC2 实例

**Windows 用户（使用 PuTTY）：**
1. 下载 PuTTY 和 PuTTYgen
2. 用 PuTTYgen 转换 .pem 文件为 .ppk 文件
3. 用 PuTTY 连接，用户名：`ubuntu`

**Mac/Linux 用户：**
```bash
# 修改密钥权限
chmod 400 codemocklab-key.pem

# 连接到服务器
ssh -i codemocklab-key.pem ubuntu@YOUR_EC2_PUBLIC_IP
```

### 5.3 运行自动部署脚本
连接成功后，运行以下命令：

```bash
# 下载部署脚本
curl -O https://raw.githubusercontent.com/ink-hz/CodeMockLab/main/scripts/aws-deploy.sh

# 赋予执行权限
chmod +x aws-deploy.sh

# 运行部署脚本
sudo ./aws-deploy.sh
```

脚本会询问以下信息：
```
数据库端点: 从 RDS 控制台复制的端点
数据库密码: YourSecurePassword123!
Redis 端点: 从 ElastiCache 复制的端点（可选）
域名: 你的域名（可选，可以先用 IP 访问）
DeepSeek API Key: 你的 AI 服务密钥
```

---

## 🌐 第六步：配置域名和 SSL（可选，10分钟）

### 6.1 申请 SSL 证书
1. 在 AWS 控制台搜索 **"Certificate Manager"**
2. 点击 **"请求证书"**
3. 选择 **"请求公有证书"**
4. 输入域名：`your-domain.com`
5. 验证方法：选择 **"DNS 验证"**
6. 点击 **"请求"**

### 6.2 配置 DNS 验证
1. 点击证书详情
2. 复制 DNS 验证记录
3. 在你的域名提供商处添加 CNAME 记录
4. 等待验证完成（几分钟到几小时）

### 6.3 创建负载均衡器
1. 在 EC2 控制台点击 **"负载均衡器"**
2. 点击 **"创建负载均衡器"**
3. 选择 **"Application Load Balancer"**
4. 配置：
   ```
   名称: codemocklab-alb
   方案: 面向互联网
   IP 地址类型: IPv4
   监听器: HTTP:80, HTTPS:443
   可用区: 选择至少2个
   ```
5. 配置安全组：允许 HTTP 和 HTTPS
6. 配置目标组：
   ```
   目标类型: 实例
   协议: HTTP
   端口: 80
   健康检查路径: /api/health
   ```
7. 注册目标：选择你的 EC2 实例
8. 在 HTTPS 监听器添加 SSL 证书

---

## ✅ 第七步：验证部署

### 7.1 检查服务状态
在 EC2 实例上运行：
```bash
# 检查应用状态
sudo -u codemocklab pm2 status

# 检查应用日志
sudo -u codemocklab pm2 logs codemocklab --lines 20

# 检查 Nginx 状态
sudo systemctl status nginx

# 测试本地访问
curl http://localhost/api/health
```

### 7.2 测试外部访问
```bash
# 直接 IP 访问
curl http://YOUR_EC2_PUBLIC_IP/api/health

# 如果配置了域名
curl https://your-domain.com/api/health
```

### 7.3 功能测试
1. 访问你的网站：`http://YOUR_EC2_PUBLIC_IP` 或 `https://your-domain.com`
2. 测试用户注册和登录
3. 测试简历上传功能
4. 测试 AI 分析功能

---

## 📊 第八步：监控设置（可选）

### 8.1 启用 CloudWatch 监控
1. 在 EC2 实例详情点击 **"监控"** 标签
2. 点击 **"启用详细监控"**

### 8.2 设置告警
1. 在 CloudWatch 控制台创建告警
2. 设置 CPU、内存、磁盘使用率阈值
3. 配置 SNS 通知

---

## 💰 成本优化建议

### 测试环境
```
EC2 t2.micro: 免费套餐
RDS db.t3.micro: 免费套餐
总计: $0/月（12个月免费）
```

### 生产环境
```
EC2 t3.medium: ~$30/月
RDS db.t3.small: ~$25/月
ElastiCache t3.micro: ~$12/月
ALB: ~$18/月
总计: ~$85/月
```

---

## 🆘 常见问题

### 1. 无法连接到 EC2
- 检查安全组是否允许 SSH (端口22)
- 确认密钥文件权限正确 (chmod 400)
- 检查公网 IP 是否正确

### 2. 应用无法访问数据库
- 检查 RDS 安全组是否允许来自 EC2 的连接
- 确认数据库端点和密码正确
- 检查网络 ACL 设置

### 3. 网站无法访问
- 检查 EC2 安全组是否允许 HTTP/HTTPS
- 确认 Nginx 和应用正在运行
- 检查防火墙设置

### 4. SSL 证书验证失败
- 确认 DNS 记录已正确添加
- 等待 DNS 传播（可能需要几小时）
- 检查域名解析是否正确

---

## 📞 获取帮助

遇到问题？按优先级联系：

1. **查看日志**：`sudo -u codemocklab pm2 logs codemocklab`
2. **检查 AWS 文档**：[AWS 官方文档](https://docs.aws.amazon.com/)
3. **联系支持**：ink.hz.github@gmail.com
4. **提交 Issue**：[GitHub Issues](https://github.com/ink-hz/CodeMockLab/issues)

---

🎉 **恭喜！** 你已经成功在 AWS 上部署了 CodeMockLab！