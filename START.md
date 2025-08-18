# 🚀 CodeMockLab 启动指南

欢迎使用 CodeMockLab - AI驱动的程序员模拟面试平台！

## 快速启动

### 方式一：一键初始化（推荐）
```bash
npm run setup
```

### 方式二：手动步骤
```bash
# 1. 安装依赖
npm install

# 2. 配置环境变量
cp .env.example .env.local
# 编辑 .env.local 文件，配置数据库和API密钥

# 3. 初始化数据库
npm run db:generate
npm run db:push

# 4. 启动开发服务器
npm run dev
```

### 方式三：Docker 部署
```bash
# 启动所有服务（包括数据库）
npm run docker:run

# 查看日志
npm run docker:logs

# 停止服务
npm run docker:stop
```

## 🔧 常用命令

### 开发相关
```bash
npm run dev           # 启动开发服务器
npm run dev:start     # 使用启动脚本（包含检查）
npm run build         # 构建生产版本
npm run start         # 启动生产服务器
```

### 数据库管理
```bash
npm run db:generate   # 生成Prisma客户端
npm run db:push       # 推送数据库架构
npm run db:migrate    # 创建数据库迁移
npm run db:reset      # 重置数据库
npm run db:seed       # 填充种子数据
npm run db:studio     # 打开Prisma Studio
```

### 高级数据库操作
```bash
./scripts/database.sh setup     # 初始化数据库
./scripts/database.sh backup    # 备份数据库
./scripts/database.sh restore   # 恢复数据库
./scripts/database.sh status    # 检查状态
```

### Docker 相关
```bash
npm run docker:build   # 构建Docker镜像
npm run docker:run     # 启动Docker服务
npm run docker:stop    # 停止Docker服务
npm run docker:logs    # 查看日志
```

### 生产部署
```bash
npm run prod:deploy    # 生产环境部署
./scripts/prod.sh --docker  # Docker生产部署
```

## 📋 环境配置

### 必需配置
在 `.env.local` 文件中配置以下变量：

```bash
# 数据库连接
DATABASE_URL="postgresql://user:password@localhost:5432/codemocklab"

# 认证密钥
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key"

# AI服务密钥（至少配置一个）
OPENAI_API_KEY="your-openai-api-key"
ANTHROPIC_API_KEY="your-anthropic-api-key"
```

### 可选配置
```bash
# 文件上传
UPLOAD_MAX_SIZE=10485760

# Redis缓存
REDIS_URL="redis://localhost:6379"
```

## 🎯 功能测试

1. **访问首页**: http://localhost:3000
2. **用户注册**: 创建新账户
3. **上传简历**: 测试AI解析功能
4. **创建面试**: 选择面试类型和难度
5. **进行面试**: 体验AI问答流程

## 📁 项目结构

```
codemocklab/
├── src/
│   ├── app/              # Next.js 页面和API路由
│   ├── components/       # React 组件
│   ├── lib/              # 工具函数和服务
│   └── types/            # TypeScript 类型
├── prisma/               # 数据库模型和迁移
├── scripts/              # 启动和部署脚本
├── public/               # 静态资源
└── docker-compose.yml    # Docker 配置
```

## 🔍 故障排除

### 常见问题

1. **数据库连接失败**
   ```bash
   # 检查数据库状态
   ./scripts/database.sh status
   ```

2. **Prisma 客户端错误**
   ```bash
   # 重新生成客户端
   npm run db:generate
   ```

3. **端口占用**
   ```bash
   # 查看端口使用情况
   lsof -i :3000
   ```

4. **环境变量未配置**
   ```bash
   # 检查环境配置
   cat .env.local
   ```

### 重置项目
```bash
# 完全重置（谨慎使用）
npm run db:reset
rm -rf node_modules .next
npm install
npm run setup
```

## 📞 支持

- 🐛 **Bug 报告**: 在 GitHub Issues 中提交
- 💡 **功能建议**: 通过 GitHub Discussions 讨论
- 📖 **文档**: 查看项目 README.md

## 🎉 开始使用

选择上述任一方式启动项目，然后访问 http://localhost:3000 开始体验！

---
**祝您使用愉快！** 🚀