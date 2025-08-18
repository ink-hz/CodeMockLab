# CodeMockLab - AI驱动的程序员模拟面试平台

## 项目概述
基于大语言模型的智能面试准备平台，为程序员提供个性化、高质量的模拟面试体验。

## 技术栈
- **前端**: Next.js 14, TypeScript, Tailwind CSS
- **后端**: Node.js, Prisma ORM
- **数据库**: PostgreSQL
- **AI集成**: OpenAI/Anthropic API
- **认证**: NextAuth.js

## 核心功能
1. **智能简历解析** - 自动提取技术栈和项目经验
2. **动态面试生成** - 根据岗位JD和简历定制问题
3. **实时AI交互** - 多轮追问，代码实时运行
4. **详细评估报告** - 能力分析与改进建议

## 快速开始

```bash
# 安装依赖
npm install

# 配置环境变量
cp .env.example .env.local

# 初始化数据库
npx prisma generate
npx prisma db push

# 启动开发服务器
npm run dev
```

访问 [http://localhost:3000](http://localhost:3000) 查看应用

## 项目结构
```
codemocklab/
├── src/
│   ├── app/          # Next.js应用路由
│   ├── components/   # React组件
│   ├── lib/          # 工具函数和配置
│   └── types/        # TypeScript类型定义
├── prisma/           # 数据库模型
└── public/           # 静态资源
```

## 开发进度
- ✅ 项目基础架构
- ✅ 数据库模型设计
- ✅ 用户认证系统
- ✅ 核心页面布局
- 🔄 简历解析功能
- 📋 AI模型集成
- 📋 面试流程实现
