#!/bin/bash

# CodeMockLab 生产环境部署脚本

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${GREEN}🚀 部署 CodeMockLab 到生产环境...${NC}"

# 检查环境变量
check_production_env() {
    echo -e "${BLUE}检查生产环境配置...${NC}"
    
    # 检查必要的环境变量
    required_vars=("DATABASE_URL" "NEXTAUTH_SECRET" "NEXTAUTH_URL")
    
    for var in "${required_vars[@]}"; do
        if [ -z "${!var}" ]; then
            echo -e "${RED}❌ 环境变量 $var 未设置${NC}"
            exit 1
        fi
    done
    
    # 检查 AI API 密钥
    if [ -z "$OPENAI_API_KEY" ] && [ -z "$ANTHROPIC_API_KEY" ]; then
        echo -e "${RED}❌ 至少需要设置 OPENAI_API_KEY 或 ANTHROPIC_API_KEY${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}✅ 生产环境配置检查通过${NC}"
}

# 构建应用
build_application() {
    echo -e "${BLUE}构建应用...${NC}"
    
    # 安装依赖
    npm ci --only=production
    
    # 生成 Prisma 客户端
    npx prisma generate
    
    # 构建 Next.js 应用
    npm run build
    
    echo -e "${GREEN}✅ 应用构建完成${NC}"
}

# 数据库迁移
migrate_database() {
    echo -e "${BLUE}执行数据库迁移...${NC}"
    
    # 部署数据库变更
    npx prisma db push
    
    echo -e "${GREEN}✅ 数据库迁移完成${NC}"
}

# 启动生产服务器
start_production_server() {
    echo -e "${BLUE}启动生产服务器...${NC}"
    
    # 设置生产环境
    export NODE_ENV=production
    
    # 启动服务器
    npm start
}

# 健康检查
health_check() {
    echo -e "${BLUE}执行健康检查...${NC}"
    
    # 等待服务器启动
    sleep 5
    
    # 检查服务器是否响应
    if curl -f http://localhost:3000/api/health 2>/dev/null; then
        echo -e "${GREEN}✅ 健康检查通过${NC}"
    else
        echo -e "${YELLOW}⚠️  健康检查失败，但服务可能正在启动...${NC}"
    fi
}

# Docker 部署模式
docker_deploy() {
    echo -e "${BLUE}使用 Docker 部署...${NC}"
    
    # 构建 Docker 镜像
    docker build -t codemocklab:latest .
    
    # 停止旧容器
    docker stop codemocklab 2>/dev/null || true
    docker rm codemocklab 2>/dev/null || true
    
    # 启动新容器
    docker run -d \
        --name codemocklab \
        --env-file .env.local \
        -p 3000:3000 \
        --restart unless-stopped \
        codemocklab:latest
    
    echo -e "${GREEN}✅ Docker 部署完成${NC}"
}

# 显示帮助信息
show_help() {
    echo "CodeMockLab 生产环境部署脚本"
    echo ""
    echo "用法:"
    echo "  ./scripts/prod.sh [选项]"
    echo ""
    echo "选项:"
    echo "  --docker    使用 Docker 部署"
    echo "  --build     仅构建，不启动服务器"
    echo "  --migrate   仅执行数据库迁移"
    echo "  --help      显示此帮助信息"
    echo ""
}

# 主函数
main() {
    # 解析命令行参数
    case "${1:-}" in
        --docker)
            check_production_env
            docker_deploy
            ;;
        --build)
            check_production_env
            build_application
            ;;
        --migrate)
            check_production_env
            migrate_database
            ;;
        --help)
            show_help
            ;;
        "")
            check_production_env
            build_application
            migrate_database
            start_production_server
            ;;
        *)
            echo -e "${RED}❌ 未知选项: $1${NC}"
            show_help
            exit 1
            ;;
    esac
}

# 运行主函数
main "$@"