# 🔒 CodeMockLab 安全指南

## 🚨 敏感信息处理

### ⚠️ 重要提醒

在使用此项目前，请务必：

1. **永远不要提交真实的API密钥到git仓库**
2. **替换所有默认密码和密钥**
3. **定期轮换生产环境的密钥**
4. **使用强密码和安全的认证方式**

## 🛡️ 安全配置清单

### 1. 环境变量配置

#### 必需的环境变量
```bash
# 复制示例文件
cp .env.example .env.local

# 编辑并设置你的真实配置
nano .env.local
```

#### 关键配置项
- `NEXTAUTH_SECRET` - 使用强随机字符串
- `DEEPSEEK_API_KEY` - 你的DeepSeek API密钥
- `DATABASE_URL` - 生产环境数据库连接
- `REDIS_URL` - Redis连接（如果使用）

#### 生成安全密钥
```bash
# 生成 NEXTAUTH_SECRET
openssl rand -hex 32

# 或使用 Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 2. 数据库安全

#### 开发环境
```bash
# 使用强密码
DATABASE_URL="postgresql://username:strong_password@localhost:5432/codemocklab"
```

#### 生产环境
- 使用SSL连接
- 启用防火墙规则
- 定期备份
- 监控异常访问

### 3. API安全

#### 获取API密钥
- [DeepSeek API](https://platform.deepseek.com/) - 获取API密钥
- [OpenAI API](https://platform.openai.com/) - 备选AI服务
- [Anthropic API](https://console.anthropic.com/) - 备选AI服务

#### API密钥管理
```bash
# 永远不要在代码中硬编码
❌ const apiKey = "sk-1234567890"

# 正确使用环境变量
✅ const apiKey = process.env.DEEPSEEK_API_KEY
```

## 🔍 安全检查

### 提交前检查
运行安全检查脚本：
```bash
./scripts/pre-commit-security-check.sh
```

### 手动检查清单
- [ ] 所有敏感文件在 `.gitignore` 中
- [ ] 无API密钥在代码中硬编码
- [ ] 数据库密码足够强
- [ ] 生产环境配置与开发环境分离
- [ ] 所有密钥定期轮换

## 🚫 禁止提交的文件类型

```gitignore
# 环境配置文件
.env.local
.env.production
.env.development

# 密钥文件
*.key
*.pem
*.crt

# 数据库文件
*.db
*.sqlite

# 日志文件
*.log
logs/

# 备份文件
*.backup
*.dump
```

## 📋 生产环境部署安全

### 1. 服务器安全
- 使用HTTPS (SSL/TLS)
- 配置防火墙规则
- 定期更新系统包
- 启用访问日志
- 使用非root用户运行应用

### 2. 应用安全
```bash
# 生产环境变量
NODE_ENV=production
NEXTAUTH_URL=https://your-domain.com
DATABASE_URL=postgresql://user:pass@prod-db:5432/db
```

### 3. 监控和日志
- 启用错误监控 (Sentry)
- 配置访问日志
- 监控异常登录
- 设置告警规则

## 🚨 安全事件响应

### 如果API密钥泄露
1. **立即轮换密钥**
   - 在AI服务平台重新生成密钥
   - 更新生产环境配置
   - 重启应用服务

2. **审计访问日志**
   - 检查异常API调用
   - 监控账户余额变化
   - 查看访问模式

3. **通知相关人员**
   - 通知开发团队
   - 更新文档
   - 审查安全流程

### 如果数据库泄露
1. **立即断开连接**
2. **评估数据影响范围**
3. **重置所有密码**
4. **通知受影响用户**
5. **加强安全措施**

## 🔧 安全工具推荐

### 密钥管理
- [1Password](https://1password.com/) - 团队密码管理
- [HashiCorp Vault](https://www.vaultproject.io/) - 企业级密钥管理
- [AWS Secrets Manager](https://aws.amazon.com/secrets-manager/) - 云端密钥管理

### 代码扫描
- [GitLeaks](https://github.com/zricethezav/gitleaks) - 检测git仓库中的密钥
- [TruffleHog](https://github.com/trufflesecurity/trufflehog) - 扫描密钥和敏感信息
- [Semgrep](https://semgrep.dev/) - 静态代码分析

### 监控工具
- [Sentry](https://sentry.io/) - 错误监控
- [DataDog](https://www.datadoghq.com/) - 应用性能监控
- [New Relic](https://newrelic.com/) - 全栈监控

## 📞 报告安全问题

如果发现安全漏洞，请：

1. **不要在公开issue中报告**
2. **发送邮件到**: security@your-domain.com
3. **包含详细的漏洞描述**
4. **提供复现步骤**
5. **等待安全团队响应**

---

## ⚖️ 免责声明

此项目仅用于教育和开发目的。使用者需要：
- 遵守相关法律法规
- 保护用户隐私数据
- 承担安全配置责任
- 定期更新安全措施

**🔒 记住：安全是一个持续的过程，不是一次性的配置！**