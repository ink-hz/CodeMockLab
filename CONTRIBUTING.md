# 🤝 贡献指南

感谢你对 CodeMockLab 的关注！我们欢迎所有形式的贡献。

## 🌟 贡献方式

### 1. 代码贡献
- 修复bug
- 添加新功能
- 改进文档
- 优化性能

### 2. 非代码贡献
- 提交bug报告
- 建议新功能
- 改进文档
- 分享使用经验

## 🚀 开始贡献

### 1. Fork 项目
```bash
# Fork 到你的账户，然后克隆
git clone https://github.com/your-username/CodeMockLab.git
cd CodeMockLab
```

### 2. 创建分支
```bash
# 创建功能分支
git checkout -b feature/your-feature-name
# 或者修复分支
git checkout -b fix/your-fix-name
```

### 3. 本地开发
```bash
# 安装依赖
npm install

# 配置环境
cp .env.example .env.local

# 启动开发服务器
npm run dev
```

### 4. 提交代码
```bash
# 运行测试
npm run test

# 运行安全检查
./scripts/pre-commit-security-check.sh

# 提交代码
git add .
git commit -m "feat: 添加新功能描述"
git push origin feature/your-feature-name
```

### 5. 创建 Pull Request
- 详细描述你的更改
- 包含相关的issue链接
- 添加测试用例
- 确保CI通过

## 📝 代码规范

### Git提交信息格式
```
type(scope): subject

body

footer
```

**类型说明:**
- `feat`: 新功能
- `fix`: bug修复
- `docs`: 文档更新
- `style`: 代码格式调整
- `refactor`: 重构
- `test`: 测试相关
- `chore`: 构建过程或辅助工具的变动

**示例:**
```
feat(ai): 添加GPT-4支持

- 集成OpenAI GPT-4 API
- 添加模型选择配置
- 更新AI提示词优化

Closes #123
```

### 代码风格
- 使用TypeScript
- 遵循ESLint规则
- 使用Prettier格式化
- 添加必要的类型注解

## 🐛 Bug 报告

使用 [Bug报告模板](https://github.com/ink-hz/CodeMockLab/issues/new?template=bug_report.md)

**包含信息:**
- 详细的问题描述
- 复现步骤
- 期望行为
- 实际行为
- 环境信息
- 截图或视频

## 💡 功能建议

使用 [功能请求模板](https://github.com/ink-hz/CodeMockLab/issues/new?template=feature_request.md)

**包含信息:**
- 功能描述
- 使用场景
- 解决的问题
- 可能的实现方案
- 参考资料

## ⚡ 开发指南

### 项目结构
```
src/
├── app/          # Next.js App Router
├── components/   # React组件
├── lib/         # 工具函数
├── types/       # TypeScript类型
└── styles/      # 样式文件
```

### 环境变量
```bash
# 必需配置
NEXTAUTH_SECRET=your-secret
DATABASE_URL=postgresql://...
DEEPSEEK_API_KEY=sk-...

# 可选配置  
OPENAI_API_KEY=sk-...
REDIS_URL=redis://...
```

### 数据库操作
```bash
# 同步schema
npx prisma db push

# 生成客户端
npx prisma generate

# 查看数据
npx prisma studio
```

### 常用命令
```bash
# 开发
npm run dev

# 构建
npm run build

# 测试
npm run test

# 类型检查
npm run type-check

# 代码检查
npm run lint
```

## 🧪 测试

### 运行测试
```bash
# 单元测试
npm run test

# E2E测试
npm run test:e2e

# 覆盖率报告
npm run test:coverage
```

### 编写测试
- 为新功能编写测试
- 为bug修复编写回归测试
- 保持测试覆盖率 > 80%

## 📚 文档

### 更新文档
- API变更需更新文档
- 新功能需添加使用说明
- 重要配置需添加示例

### 文档位置
- `README.md` - 项目介绍
- `docs/` - 详细文档
- 代码注释 - 函数和类说明

## 🏆 贡献者权益

### 认可方式
- 贡献者列表展示
- Release Notes致谢
- 社区特别感谢

### 成长路径
1. **新手贡献者** - 修复简单问题
2. **活跃贡献者** - 添加功能，参与讨论
3. **核心贡献者** - Code Review，架构讨论
4. **维护者** - 项目管理，发布管理

## ❓ 获得帮助

### 联系方式
- [GitHub Discussions](https://github.com/ink-hz/CodeMockLab/discussions) - 一般讨论
- [Issues](https://github.com/ink-hz/CodeMockLab/issues) - Bug和功能请求
- [Discord](https://discord.gg/codemocklab) - 实时讨论
- Email: contribute@codemocklab.com

### 资源链接
- [开发文档](https://docs.codemocklab.com/dev)
- [API文档](https://docs.codemocklab.com/api)
- [架构图](https://docs.codemocklab.com/architecture)

## 📄 许可协议

贡献代码即表示同意将代码以 [MIT License](LICENSE) 开源。

---

**感谢你的贡献让 CodeMockLab 变得更好！** 🚀