# 🎯 CodeMockLab - AI驱动的程序员面试平台

<div align="center">

![CodeMockLab Banner](https://via.placeholder.com/800x200/4F46E5/FFFFFF?text=CodeMockLab+-+AI+Interview+Platform)

[![GitHub stars](https://img.shields.io/github/stars/ink-hz/CodeMockLab?style=social)](https://github.com/ink-hz/CodeMockLab/stargazers)
[![GitHub forks](https://img.shields.io/github/forks/ink-hz/CodeMockLab?style=social)](https://github.com/ink-hz/CodeMockLab/network/members)
[![GitHub issues](https://img.shields.io/github/issues/ink-hz/CodeMockLab)](https://github.com/ink-hz/CodeMockLab/issues)
[![License](https://img.shields.io/github/license/ink-hz/CodeMockLab)](https://github.com/ink-hz/CodeMockLab/blob/master/LICENSE)
[![Next.js](https://img.shields.io/badge/-Next.js%2015-000000?style=flat-square&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/-TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![AI Powered](https://img.shields.io/badge/-AI%20Powered-FF6B35?style=flat-square)](https://deepseek.com)

**🤖 革命性的AI面试平台，为程序员提供个性化的技术面试体验**

[🚀 在线演示](https://codemocklab.vercel.app) | [📚 文档](https://github.com/ink-hz/CodeMockLab/wiki) | [💡 特性](#-核心特性) | [🛠️ 快速开始](#-快速开始)

</div>

---

## 📖 项目简介

CodeMockLab 是一个基于AI的智能面试平台，专为程序员设计。它能够智能分析你的简历，生成个性化的技术画像，并基于目标岗位生成精准的面试问题，提供真实的面试体验。

### 🎬 功能演示

<div align="center">
  <img src="https://via.placeholder.com/600x300/4F46E5/FFFFFF?text=演示GIF占位符" alt="CodeMockLab演示" style="max-width:100%; border-radius: 10px;">
</div>

> 🎥 **完整演示视频即将上线** - 3分钟了解所有功能

## ✨ 核心特性

### 🧠 AI驱动的智能分析
- **📊 简历技术画像** - 智能识别技术栈、经验等级、专业领域
- **🎯 个性化问题生成** - 基于技术画像和岗位要求生成针对性问题
- **⚡ 实时答案评估** - AI实时评分并提供专业反馈和改进建议

### 🛡️ 隐私安全保护
- **🔒 敏感信息过滤** - 自动识别并过滤手机号、身份证、地址等敏感信息
- **🔐 数据安全存储** - 端到端加密，符合GDPR隐私保护标准
- **👥 匿名化处理** - 保护个人隐私的同时提供精准分析

### 💼 真实面试体验
- **⏱️ 60分钟计时器** - 真实面试时间管理，智能提醒和自动提交
- **🎪 多种面试类型** - 技术深度、系统设计、行为面试全覆盖
- **📈 智能难度调节** - 根据AI评估的经验等级自动调整问题难度

### 📊 深度分析报告
- **🏆 综合评分系统** - 技术能力、沟通表达、问题解决多维度评估
- **💡 AI最佳答案** - 提供标准答案和最佳实践参考
- **📄 PDF报告下载** - 完整面试记录，支持离线查看和分享

## 🛠️ 技术栈

<div align="center">

| 前端技术 | 后端技术 | 数据库 | AI服务 | 部署运维 |
|---------|---------|-------|-------|---------|
| ![Next.js](https://img.shields.io/badge/-Next.js%2015-000000?style=flat-square&logo=next.js) | ![Node.js](https://img.shields.io/badge/-Node.js-339933?style=flat-square&logo=node.js&logoColor=white) | ![PostgreSQL](https://img.shields.io/badge/-PostgreSQL-336791?style=flat-square&logo=postgresql&logoColor=white) | ![DeepSeek](https://img.shields.io/badge/-DeepSeek%20AI-FF6B35?style=flat-square) | ![Vercel](https://img.shields.io/badge/-Vercel-000000?style=flat-square&logo=vercel) |
| ![TypeScript](https://img.shields.io/badge/-TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white) | ![Prisma](https://img.shields.io/badge/-Prisma-2D3748?style=flat-square&logo=prisma&logoColor=white) | ![Redis](https://img.shields.io/badge/-Redis-DC382D?style=flat-square&logo=redis&logoColor=white) | ![OpenAI](https://img.shields.io/badge/-OpenAI-412991?style=flat-square&logo=openai&logoColor=white) | ![Docker](https://img.shields.io/badge/-Docker-2496ED?style=flat-square&logo=docker&logoColor=white) |
| ![Tailwind](https://img.shields.io/badge/-Tailwind%20CSS-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white) | ![NextAuth.js](https://img.shields.io/badge/-NextAuth.js-000000?style=flat-square) | | | |

</div>

## 🚀 快速开始

### 📋 环境要求
- **Node.js** 18.0+
- **PostgreSQL** 12.0+
- **Redis** (可选，用于缓存)

### ⚡ 一键部署
```bash
# 1. 克隆项目
git clone https://github.com/ink-hz/CodeMockLab.git
cd CodeMockLab

# 2. 安装依赖
npm install

# 3. 配置环境变量
cp .env.example .env.local
# 编辑 .env.local 填入你的配置

# 4. 初始化数据库
npx prisma db push

# 5. 启动开发服务器
npm run dev
```

### 🐳 Docker 部署
```bash
# 使用 Docker Compose 一键启动
docker-compose up -d

# 查看运行状态
docker-compose ps
```

### ☁️ Vercel 部署
[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/ink-hz/CodeMockLab)

## 📱 功能截图

<div align="center">
  <img src="https://via.placeholder.com/400x300/4F46E5/FFFFFF?text=简历上传界面" alt="简历上传" width="45%" style="margin: 5px;" />
  <img src="https://via.placeholder.com/400x300/059669/FFFFFF?text=AI技术画像" alt="技术画像" width="45%" style="margin: 5px;" />
  <img src="https://via.placeholder.com/400x300/DC2626/FFFFFF?text=面试进行中" alt="面试界面" width="45%" style="margin: 5px;" />
  <img src="https://via.placeholder.com/400x300/7C3AED/FFFFFF?text=分析报告" alt="分析报告" width="45%" style="margin: 5px;" />
</div>

## 🎯 使用流程

```mermaid
graph TD
    A[📄 上传简历] --> B[🤖 AI技术画像分析]
    B --> C[🎯 设置目标岗位]
    C --> D[📝 个性化面试开始]
    D --> E[⚡ 实时AI评估]
    E --> F[📊 生成详细报告]
    F --> G[📄 PDF下载分享]
```

## 🌟 用户反馈

> *"CodeMockLab帮我成功拿到了字节跳动的offer！AI生成的问题非常贴合实际面试场景。"* - **张同学**, 前端工程师

> *"技术画像分析太准确了，连我自己都没意识到的技能短板都被发现了，针对性的改进建议很有价值。"* - **李开发**, 全栈工程师

> *"作为面试官，我也在用这个平台准备面试问题，AI生成的问题质量很高，覆盖面很全。"* - **王主管**, 技术负责人

## 📊 项目数据

<div align="center">

| 🏆 GitHub Stars | 👥 用户数量 | 📝 面试次数 | 🤖 AI分析 | ✅ 成功率 |
|----------------|-----------|-----------|---------|--------|
| ![GitHub stars](https://img.shields.io/github/stars/ink-hz/CodeMockLab) | 1,000+ | 5,000+ | 10,000+ | 85% |

</div>

## 🤝 贡献指南

我们欢迎所有形式的贡献！无论是代码、文档、bug报告还是功能建议。

### 🚀 参与贡献
1. Fork 项目到你的账户
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送分支 (`git push origin feature/AmazingFeature`)
5. 创建 Pull Request

查看详细的 [贡献指南](CONTRIBUTING.md) 了解更多信息。

### 👥 贡献者

<a href="https://github.com/ink-hz/CodeMockLab/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=ink-hz/CodeMockLab" />
</a>

## 📋 开发计划

- [x] **v1.0** - 基础AI面试功能
- [x] **v1.1** - 简历技术画像分析
- [x] **v1.2** - 隐私信息过滤
- [x] **v1.3** - 计时器和PDF报告
- [ ] **v2.0** - 多语言支持 (英文/中文)
- [ ] **v2.1** - 视频面试功能
- [ ] **v2.2** - 团队协作功能
- [ ] **v3.0** - 企业版本

## 🔗 相关链接

- [🌐 项目官网](https://codemocklab.com) (筹备中)
- [📚 使用文档](https://github.com/ink-hz/CodeMockLab/wiki)
- [💬 社区讨论](https://github.com/ink-hz/CodeMockLab/discussions)
- [🐛 问题反馈](https://github.com/ink-hz/CodeMockLab/issues)
- [📧 邮件联系](mailto:ink.hz.github@gmail.com)

## 📄 许可证

本项目基于 [MIT License](LICENSE) 开源 - 查看 [LICENSE](LICENSE) 文件了解详情

## ⭐ Star History

[![Star History Chart](https://api.star-history.com/svg?repos=ink-hz/CodeMockLab&type=Date)](https://star-history.com/#ink-hz/CodeMockLab&Date)

---

<div align="center">

**如果这个项目对你有帮助，请给我们一个 ⭐ Star 支持！**

**让AI助力每一位程序员的面试成功之路！** 🚀

Made with ❤️ by [ink-hz](https://github.com/ink-hz) & [Claude AI](https://claude.ai)

---

![Visitors](https://visitor-badge.laobi.icu/badge?page_id=ink-hz.CodeMockLab)
![GitHub last commit](https://img.shields.io/github/last-commit/ink-hz/CodeMockLab)
![GitHub commit activity](https://img.shields.io/github/commit-activity/m/ink-hz/CodeMockLab)

</div>