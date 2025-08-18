#!/bin/bash

# CodeMockLab 项目初始化脚本
# 用于首次设置和启动项目

set -e  # 遇到错误时退出

echo "🚀 CodeMockLab 项目初始化开始..."

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 检查 Node.js 版本
check_node() {
    echo -e "${BLUE}检查 Node.js 版本...${NC}"
    if ! command -v node &> /dev/null; then
        echo -e "${RED}❌ Node.js 未安装。请先安装 Node.js 18+${NC}"
        exit 1
    fi
    
    NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$NODE_VERSION" -lt 18 ]; then
        echo -e "${RED}❌ Node.js 版本过低 (当前: $(node -v))。请升级到 Node.js 18+${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}✅ Node.js 版本检查通过: $(node -v)${NC}"
}

# 检查 npm/yarn
check_package_manager() {
    echo -e "${BLUE}检查包管理器...${NC}"
    if command -v npm &> /dev/null; then
        PACKAGE_MANAGER="npm"
        echo -e "${GREEN}✅ 使用 npm: $(npm -v)${NC}"
    else
        echo -e "${RED}❌ npm 未找到${NC}"
        exit 1
    fi
}

# 安装依赖
install_dependencies() {
    echo -e "${BLUE}安装项目依赖...${NC}"
    if [ "$PACKAGE_MANAGER" = "npm" ]; then
        npm install
    fi
    echo -e "${GREEN}✅ 依赖安装完成${NC}"
}

# 设置环境变量
setup_env() {
    echo -e "${BLUE}配置环境变量...${NC}"
    
    if [ ! -f ".env.local" ]; then
        if [ -f ".env.example" ]; then
            cp .env.example .env.local
            echo -e "${YELLOW}📋 已复制 .env.example 到 .env.local${NC}"
        else
            echo -e "${YELLOW}⚠️  .env.example 文件不存在，创建默认配置...${NC}"
            cat > .env.local << EOF
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/codemocklab"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-here-$(openssl rand -hex 32)"

# AI Services
OPENAI_API_KEY="your-openai-api-key"
ANTHROPIC_API_KEY="your-anthropic-api-key"

# File Upload
UPLOAD_MAX_SIZE=10485760

# Redis (optional)
REDIS_URL="redis://localhost:6379"
EOF
        fi
        
        echo -e "${RED}⚠️  请编辑 .env.local 文件，配置以下必要信息:${NC}"
        echo -e "${YELLOW}   1. DATABASE_URL - PostgreSQL 数据库连接${NC}"
        echo -e "${YELLOW}   2. OPENAI_API_KEY - OpenAI API 密钥${NC}"
        echo -e "${YELLOW}   3. ANTHROPIC_API_KEY - Anthropic API 密钥 (可选)${NC}"
        echo -e "${YELLOW}   4. NEXTAUTH_SECRET - 已自动生成${NC}"
        echo ""
        echo -e "${BLUE}是否现在打开编辑器配置? (y/n)${NC}"
        read -r response
        if [[ "$response" =~ ^[Yy]$ ]]; then
            ${EDITOR:-nano} .env.local
        fi
    else
        echo -e "${GREEN}✅ .env.local 已存在${NC}"
    fi
}

# 初始化数据库
setup_database() {
    echo -e "${BLUE}初始化数据库...${NC}"
    
    # 检查是否有 DATABASE_URL
    if grep -q "postgresql://user:password@localhost:5432/codemocklab" .env.local; then
        echo -e "${YELLOW}⚠️  检测到默认数据库配置，请确保已配置正确的 DATABASE_URL${NC}"
        echo -e "${BLUE}是否继续数据库初始化? (y/n)${NC}"
        read -r response
        if [[ ! "$response" =~ ^[Yy]$ ]]; then
            echo -e "${YELLOW}⏸️  跳过数据库初始化${NC}"
            return
        fi
    fi
    
    # 生成 Prisma 客户端
    echo -e "${BLUE}生成 Prisma 客户端...${NC}"
    npx prisma generate
    
    # 推送数据库架构
    echo -e "${BLUE}推送数据库架构...${NC}"
    npx prisma db push
    
    echo -e "${GREEN}✅ 数据库初始化完成${NC}"
}

# 构建项目
build_project() {
    echo -e "${BLUE}构建项目...${NC}"
    if [ "$PACKAGE_MANAGER" = "npm" ]; then
        npm run build
    fi
    echo -e "${GREEN}✅ 项目构建完成${NC}"
}

# 主函数
main() {
    echo -e "${GREEN}"
    echo "  ____          _      __  __            _    _           _     "
    echo " / ___|___   __| | ___|  \/  | ___   ___| | _| |    __ _ | |__  "
    echo "| |   / _ \ / _\` |/ _ \ |\/| |/ _ \ / __| |/ / |   / _\` || '_ \ "
    echo "| |__| (_) | (_| |  __/ |  | | (_) | (__|   <| |__| (_| || |_) |"
    echo " \____\___/ \__,_|\___|_|  |_|\___/ \___|_|\_\_____\__,_||_.__/ "
    echo ""
    echo -e "${NC}AI 驱动的程序员模拟面试平台"
    echo ""
    
    check_node
    check_package_manager
    install_dependencies
    setup_env
    setup_database
    
    echo -e "${GREEN}🎉 项目初始化完成！${NC}"
    echo ""
    echo -e "${BLUE}下一步操作:${NC}"
    echo -e "${YELLOW}  1. 确保 .env.local 中的配置正确${NC}"
    echo -e "${YELLOW}  2. 运行 ${GREEN}npm run dev${YELLOW} 启动开发服务器${NC}"
    echo -e "${YELLOW}  3. 访问 ${GREEN}http://localhost:3000${YELLOW} 查看应用${NC}"
    echo ""
    
    echo -e "${BLUE}是否现在启动开发服务器? (y/n)${NC}"
    read -r response
    if [[ "$response" =~ ^[Yy]$ ]]; then
        echo -e "${GREEN}🚀 启动开发服务器...${NC}"
        npm run dev
    fi
}

# 运行主函数
main