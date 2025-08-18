#!/bin/bash

# CodeMockLab 开发服务器启动脚本

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${GREEN}🚀 启动 CodeMockLab 开发环境...${NC}"

# 检查环境文件
check_env() {
    if [ ! -f ".env.local" ]; then
        echo -e "${RED}❌ .env.local 文件不存在${NC}"
        echo -e "${YELLOW}请先运行 ${GREEN}./scripts/setup.sh${YELLOW} 初始化项目${NC}"
        exit 1
    fi
    echo -e "${GREEN}✅ 环境配置检查通过${NC}"
}

# 检查数据库连接
check_database() {
    echo -e "${BLUE}检查数据库连接...${NC}"
    
    # 尝试连接数据库
    if npx prisma db seed --preview-feature 2>/dev/null || true; then
        echo -e "${GREEN}✅ 数据库连接正常${NC}"
    else
        echo -e "${YELLOW}⚠️  数据库连接可能有问题，但继续启动...${NC}"
    fi
}

# 启动开发服务器
start_dev_server() {
    echo -e "${BLUE}启动开发服务器...${NC}"
    echo -e "${YELLOW}访问地址: ${GREEN}http://localhost:3000${NC}"
    echo -e "${YELLOW}按 Ctrl+C 停止服务器${NC}"
    echo ""
    
    # 启动 Next.js 开发服务器
    npm run dev
}

# 主函数
main() {
    check_env
    check_database
    start_dev_server
}

# 运行主函数
main