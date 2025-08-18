# 🚀 CodeMockLab 快速部署指南

## 🎯 推荐方案：Vercel + Supabase (5分钟部署)

### 第一步：准备数据库 (Supabase)

1. **注册Supabase**
   - 访问 [https://supabase.com](https://supabase.com)
   - 使用GitHub账户登录
   - 创建新项目

2. **配置数据库**
   ```sql
   -- 在Supabase SQL编辑器中执行以下命令
   -- 复制 prisma/schema.prisma 中的表结构
   -- 或使用我们的schema导入工具
   ```

3. **获取连接字符串**
   - 进入 Settings → Database
   - 复制 Connection string (URI)
   - 格式：`postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres`

### 第二步：部署到Vercel

1. **连接GitHub**
   - 访问 [https://vercel.com](https://vercel.com)
   - 使用GitHub账户登录
   - 选择 `CodeMockLab` 仓库

2. **配置环境变量**
   ```bash
   # 必需的环境变量
   DATABASE_URL=postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres
   NEXTAUTH_URL=https://your-project.vercel.app
   NEXTAUTH_SECRET=your-super-secret-jwt-key
   DEEPSEEK_API_KEY=sk-your-deepseek-api-key
   ```

3. **部署设置**
   - Framework Preset: `Next.js`
   - Build Command: `prisma generate && next build`
   - Output Directory: `.next`
   - Install Command: `npm install`

### 第三步：配置域名 (可选)

1. **添加自定义域名**
   - 在Vercel项目设置中添加域名
   - 配置DNS记录指向Vercel

2. **更新环境变量**
   ```bash
   NEXTAUTH_URL=https://your-domain.com
   ```

## 🔑 环境变量详细说明

### 必需变量

| 变量名 | 说明 | 示例 |
|--------|------|------|
| `DATABASE_URL` | 数据库连接字符串 | `postgresql://...` |
| `NEXTAUTH_URL` | 应用访问地址 | `https://your-app.vercel.app` |
| `NEXTAUTH_SECRET` | JWT密钥 | 使用 `openssl rand -base64 32` 生成 |
| `DEEPSEEK_API_KEY` | DeepSeek AI密钥 | `sk-xxx` |

### 可选变量

| 变量名 | 说明 | 默认值 |
|--------|------|--------|
| `OPENAI_API_KEY` | OpenAI备用AI服务 | - |
| `ANTHROPIC_API_KEY` | Claude备用AI服务 | - |
| `UPLOAD_MAX_SIZE` | 文件上传限制 | `10485760` |

## 🛠️ 数据库初始化

### 自动迁移 (推荐)
```bash
# Vercel会自动执行
npx prisma db push
```

### 手动执行SQL
```sql
-- 复制并执行 prisma/schema.prisma 中的所有模型定义
-- 或使用导出的SQL文件
```

## 🔍 部署验证

1. **健康检查**
   ```bash
   curl https://your-app.vercel.app/api/health
   ```

2. **功能测试**
   - [ ] 用户注册/登录
   - [ ] 简历上传
   - [ ] AI分析
   - [ ] 面试生成
   - [ ] 报告下载

## 🆘 故障排除

### 常见问题

1. **数据库连接失败**
   ```bash
   # 检查DATABASE_URL格式
   # 确保Supabase项目未暂停
   # 验证密码正确性
   ```

2. **AI服务不可用**
   ```bash
   # 检查DEEPSEEK_API_KEY是否有效
   # 验证API配额未用完
   # 确认网络连接正常
   ```

3. **构建失败**
   ```bash
   # 检查所有环境变量是否设置
   # 验证依赖安装正确
   # 查看Vercel构建日志
   ```

### 调试命令

```bash
# 本地测试数据库连接
npx prisma db push

# 检查环境变量
node -e "console.log(process.env.DATABASE_URL)"

# 测试AI服务
curl -X POST "https://api.deepseek.com/v1/chat/completions" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"model":"deepseek-chat","messages":[{"role":"user","content":"Hello"}]}'
```

## 📊 监控和维护

1. **Vercel Analytics**
   - 自动启用页面访问统计
   - 性能监控和错误跟踪

2. **数据库监控**
   - Supabase Dashboard查看连接数
   - 监控查询性能

3. **API使用监控**
   - DeepSeek控制台查看API调用量
   - 设置使用限制和告警

## 🔐 安全配置

1. **环境变量安全**
   - 定期更换API密钥
   - 不在代码中硬编码密钥
   - 使用Vercel环境变量管理

2. **数据库安全**
   - 启用SSL连接
   - 限制访问IP (可选)
   - 定期备份数据

## 💰 成本估算

### 免费额度
- **Vercel**: 100GB带宽/月
- **Supabase**: 500MB数据库，5万次API调用/月
- **DeepSeek**: 新用户有免费额度

### 付费计划
- **Vercel Pro**: $20/月
- **Supabase Pro**: $25/月  
- **DeepSeek**: 按使用量计费

## 🎉 部署完成！

部署成功后，你的CodeMockLab将拥有：

✅ 高性能的全球CDN加速  
✅ 自动SSL证书  
✅ 无服务器架构，自动扩展  
✅ 实时监控和日志  
✅ 持续集成/部署 (CI/CD)

**立即访问你的应用**: `https://your-project.vercel.app`

---

## 📞 获取帮助

- 📧 邮件: ink.hz.github@gmail.com
- 🐛 问题反馈: [GitHub Issues](https://github.com/ink-hz/CodeMockLab/issues)
- 📚 文档: [完整部署指南](./DEPLOYMENT_GUIDE.md)