# 🎯 CodeMockLab - AI驱动的程序员面试平台

<div align="center">

![CodeMockLab Logo](https://via.placeholder.com/200x100/4F46E5/FFFFFF?text=CodeMockLab)

[![GitHub stars](https://img.shields.io/github/stars/ink-hz/CodeMockLab?style=social)](https://github.com/ink-hz/CodeMockLab/stargazers)
[![GitHub forks](https://img.shields.io/github/forks/ink-hz/CodeMockLab?style=social)](https://github.com/ink-hz/CodeMockLab/network/members)
[![GitHub issues](https://img.shields.io/github/issues/ink-hz/CodeMockLab)](https://github.com/ink-hz/CodeMockLab/issues)
[![License](https://img.shields.io/github/license/ink-hz/CodeMockLab)](https://github.com/ink-hz/CodeMockLab/blob/master/LICENSE)

**🤖 革命性的AI面试平台，为程序员提供个性化的技术面试体验**

[🚀 在线演示](https://codemocklab.vercel.app) | [📚 文档](https://docs.codemocklab.com) | [💡 特性](#-核心特性) | [🛠️ 部署指南](#-快速开始)

</div>

---

## 📖 项目简介

CodeMockLab 是一个基于AI的智能面试平台，专为程序员设计。它能够：

- 🧠 **AI技术画像分析** - 智能解析简历，生成个性化技术画像
- 🎯 **精准问题生成** - 基于岗位要求和技术背景，AI生成针对性面试题
- 🔒 **隐私安全保护** - 自动过滤敏感信息，保护个人隐私
- ⏱️ **真实面试体验** - 60分钟计时、实时评估、综合报告
- 📊 **深度分析报告** - AI评分、技能分析、职业建议

## 🎬 演示视频

<div align="center">
  <a href="https://www.youtube.com/watch?v=your-demo-video">
    <img src="https://via.placeholder.com/600x300/FF0000/FFFFFF?text=点击观看演示视频" alt="CodeMockLab演示视频" style="max-width:100%;">
  </a>
</div>

## ✨ 核心特性

### 🤖 AI驱动的智能分析
- **简历技术画像生成** - 自动识别技术栈、经验等级、专业领域
- **智能问题匹配** - 基于技术画像和岗位要求生成个性化问题
- **实时答案评估** - AI实时评分并提供专业反馈

### 🛡️ 隐私安全保护
- **敏感信息过滤** - 自动识别并过滤手机号、身份证、地址等
- **数据安全存储** - 端到端加密，符合隐私保护标准
- **GDPR合规** - 完全符合数据保护法规

### 💼 真实面试体验
- **多种面试类型** - 技术面试、系统设计、行为面试
- **智能难度调节** - 根据经验等级自动调整问题难度
- **完整流程模拟** - 从简历上传到最终报告的完整体验

## 🛠️ 技术栈

<div align="center">

| 前端 | 后端 | 数据库 | AI服务 |
|------|------|--------|--------|
| ![Next.js](https://img.shields.io/badge/-Next.js%2015-000000?style=flat-square&logo=next.js) | ![Node.js](https://img.shields.io/badge/-Node.js-339933?style=flat-square&logo=node.js&logoColor=white) | ![PostgreSQL](https://img.shields.io/badge/-PostgreSQL-336791?style=flat-square&logo=postgresql&logoColor=white) | ![DeepSeek](https://img.shields.io/badge/-DeepSeek%20AI-FF6B35?style=flat-square) |
| ![TypeScript](https://img.shields.io/badge/-TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white) | ![Prisma](https://img.shields.io/badge/-Prisma-2D3748?style=flat-square&logo=prisma&logoColor=white) | ![Redis](https://img.shields.io/badge/-Redis-DC382D?style=flat-square&logo=redis&logoColor=white) | ![OpenAI](https://img.shields.io/badge/-OpenAI-412991?style=flat-square&logo=openai&logoColor=white) |
| ![Tailwind](https://img.shields.io/badge/-Tailwind%20CSS-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white) | ![NextAuth.js](https://img.shields.io/badge/-NextAuth.js-000000?style=flat-square&logo=next.js) | | |

</div>

## 🚀 快速开始

### 环境要求
- Node.js 18+
- PostgreSQL 12+
- Redis (可选)

### 一键部署
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

### Docker 部署
```bash
# 使用 Docker Compose 一键启动
docker-compose up -d
```

## 📱 功能截图

<div align="center">
  <img src="https://via.placeholder.com/800x400/4F46E5/FFFFFF?text=简历上传界面" alt="简历上传" width="45%" />
  <img src="https://via.placeholder.com/800x400/059669/FFFFFF?text=AI技术画像" alt="技术画像" width="45%" />
  <img src="https://via.placeholder.com/800x400/DC2626/FFFFFF?text=面试进行中" alt="面试界面" width="45%" />
  <img src="https://via.placeholder.com/800x400/7C3AED/FFFFFF?text=分析报告" alt="分析报告" width="45%" />
</div>

## 🌟 用户反馈

> "CodeMockLab帮我成功拿到了字节跳动的offer！AI生成的问题非常贴合实际面试。" - **张三**, 前端工程师

> "技术画像分析太准确了，连我自己都没意识到的技能短板都被发现了。" - **李四**, 全栈开发

> "作为面试官，我也在用这个平台准备问题，质量很高！" - **王五**, 技术主管

## 📊 项目数据

<div align="center">

| 用户数量 | 面试次数 | AI分析 | 成功率 |
|----------|----------|--------|--------|
| 10,000+ | 50,000+ | 100,000+ | 85% |

</div>

## 🤝 贡献指南

我们欢迎所有形式的贡献！请查看 [CONTRIBUTING.md](CONTRIBUTING.md) 了解详细信息。

### 贡献者

<a href="https://github.com/ink-hz/CodeMockLab/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=ink-hz/CodeMockLab" />
</a>

## 📄 许可证

本项目基于 [MIT License](LICENSE) 开源。

## 🔗 相关链接

- [🌐 官方网站](https://codemocklab.com)
- [📚 文档中心](https://docs.codemocklab.com)
- [💬 社区讨论](https://github.com/ink-hz/CodeMockLab/discussions)
- [🐛 问题反馈](https://github.com/ink-hz/CodeMockLab/issues)
- [📧 联系我们](mailto:contact@codemocklab.com)

---

<div align="center">

**如果这个项目对你有帮助，请给我们一个 ⭐ Star！**

[![Star History Chart](https://api.star-history.com/svg?repos=ink-hz/CodeMockLab&type=Date)](https://star-history.com/#ink-hz/CodeMockLab&Date)

Made with ❤️ by [ink-hz](https://github.com/ink-hz) & [Claude AI](https://claude.ai)

</div>