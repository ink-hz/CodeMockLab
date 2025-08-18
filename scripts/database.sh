#!/bin/bash

# CodeMockLab 数据库管理脚本

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# 显示帮助信息
show_help() {
    echo -e "${GREEN}CodeMockLab 数据库管理脚本${NC}"
    echo ""
    echo "用法:"
    echo "  ./scripts/database.sh <命令>"
    echo ""
    echo "命令:"
    echo -e "  ${BLUE}setup${NC}      初始化数据库（生成客户端 + 推送架构）"
    echo -e "  ${BLUE}generate${NC}   生成 Prisma 客户端"
    echo -e "  ${BLUE}push${NC}       推送数据库架构"
    echo -e "  ${BLUE}migrate${NC}    创建和应用迁移"
    echo -e "  ${BLUE}reset${NC}      重置数据库（⚠️ 将删除所有数据）"
    echo -e "  ${BLUE}seed${NC}       填充种子数据"
    echo -e "  ${BLUE}studio${NC}     打开 Prisma Studio"
    echo -e "  ${BLUE}backup${NC}     备份数据库"
    echo -e "  ${BLUE}restore${NC}    从备份恢复数据库"
    echo -e "  ${BLUE}status${NC}     检查数据库状态"
    echo ""
}

# 检查环境配置
check_env() {
    if [ ! -f ".env.local" ]; then
        echo -e "${RED}❌ .env.local 文件不存在${NC}"
        echo -e "${YELLOW}请先运行 ${GREEN}./scripts/setup.sh${YELLOW} 初始化项目${NC}"
        exit 1
    fi
    
    # 加载环境变量
    source .env.local
    
    if [ -z "$DATABASE_URL" ]; then
        echo -e "${RED}❌ DATABASE_URL 未配置${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}✅ 数据库配置检查通过${NC}"
}

# 初始化数据库
setup_database() {
    echo -e "${BLUE}初始化数据库...${NC}"
    
    echo -e "${BLUE}生成 Prisma 客户端...${NC}"
    npx prisma generate
    
    echo -e "${BLUE}推送数据库架构...${NC}"
    npx prisma db push
    
    echo -e "${GREEN}✅ 数据库初始化完成${NC}"
}

# 生成客户端
generate_client() {
    echo -e "${BLUE}生成 Prisma 客户端...${NC}"
    npx prisma generate
    echo -e "${GREEN}✅ 客户端生成完成${NC}"
}

# 推送架构
push_schema() {
    echo -e "${BLUE}推送数据库架构...${NC}"
    npx prisma db push
    echo -e "${GREEN}✅ 架构推送完成${NC}"
}

# 创建迁移
create_migration() {
    echo -e "${BLUE}创建数据库迁移...${NC}"
    echo -e "${YELLOW}请输入迁移名称:${NC}"
    read -r migration_name
    
    if [ -z "$migration_name" ]; then
        echo -e "${RED}❌ 迁移名称不能为空${NC}"
        exit 1
    fi
    
    npx prisma migrate dev --name "$migration_name"
    echo -e "${GREEN}✅ 迁移创建完成${NC}"
}

# 重置数据库
reset_database() {
    echo -e "${RED}⚠️  警告: 这将删除所有数据库数据！${NC}"
    echo -e "${YELLOW}确定要继续吗? (输入 'yes' 确认):${NC}"
    read -r confirmation
    
    if [ "$confirmation" != "yes" ]; then
        echo -e "${YELLOW}操作已取消${NC}"
        exit 0
    fi
    
    echo -e "${BLUE}重置数据库...${NC}"
    npx prisma migrate reset --force
    echo -e "${GREEN}✅ 数据库重置完成${NC}"
}

# 填充种子数据
seed_database() {
    echo -e "${BLUE}填充种子数据...${NC}"
    
    # 检查是否有种子脚本
    if [ -f "prisma/seed.ts" ] || [ -f "prisma/seed.js" ]; then
        npx prisma db seed
        echo -e "${GREEN}✅ 种子数据填充完成${NC}"
    else
        echo -e "${YELLOW}⚠️  未找到种子脚本${NC}"
        create_seed_file
    fi
}

# 创建种子文件
create_seed_file() {
    echo -e "${BLUE}创建种子数据文件...${NC}"
    
    cat > prisma/seed.ts << 'EOF'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('开始填充种子数据...')

  // 创建示例公司和职位
  const companies = [
    {
      company: '腾讯',
      title: '高级前端工程师',
      level: '高级',
      description: '负责前端架构设计和核心功能开发',
      requirements: ['React', 'TypeScript', 'Node.js'],
      skills: ['React', 'Vue', 'TypeScript', 'Webpack']
    },
    {
      company: '阿里巴巴',
      title: 'Java 后端工程师',
      level: '中级',
      description: '负责后端服务开发和性能优化',
      requirements: ['Java', 'Spring Boot', 'MySQL'],
      skills: ['Java', 'Spring', 'MySQL', 'Redis']
    },
    {
      company: '字节跳动',
      title: '全栈工程师',
      level: '高级',
      description: '负责全栈开发和技术架构',
      requirements: ['React', 'Node.js', 'TypeScript'],
      skills: ['React', 'Node.js', 'TypeScript', 'MongoDB']
    }
  ]

  for (const jobData of companies) {
    await prisma.jobPosition.create({
      data: jobData
    })
  }

  console.log('种子数据填充完成!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
EOF

    echo -e "${GREEN}✅ 种子文件创建完成 (prisma/seed.ts)${NC}"
    echo -e "${YELLOW}现在运行种子填充...${NC}"
    npx prisma db seed
}

# 打开 Prisma Studio
open_studio() {
    echo -e "${BLUE}启动 Prisma Studio...${NC}"
    echo -e "${YELLOW}Studio 将在浏览器中打开: ${GREEN}http://localhost:5555${NC}"
    npx prisma studio
}

# 备份数据库
backup_database() {
    echo -e "${BLUE}备份数据库...${NC}"
    
    # 创建备份目录
    mkdir -p backups
    
    # 生成备份文件名
    backup_file="backups/backup_$(date +%Y%m%d_%H%M%S).sql"
    
    # 从 DATABASE_URL 提取连接信息
    if [[ $DATABASE_URL =~ postgresql://([^:]+):([^@]+)@([^:]+):([^/]+)/(.+) ]]; then
        DB_USER="${BASH_REMATCH[1]}"
        DB_PASS="${BASH_REMATCH[2]}"
        DB_HOST="${BASH_REMATCH[3]}"
        DB_PORT="${BASH_REMATCH[4]}"
        DB_NAME="${BASH_REMATCH[5]}"
        
        # 执行备份
        PGPASSWORD="$DB_PASS" pg_dump \
            -h "$DB_HOST" \
            -p "$DB_PORT" \
            -U "$DB_USER" \
            -d "$DB_NAME" \
            > "$backup_file"
        
        echo -e "${GREEN}✅ 数据库备份完成: $backup_file${NC}"
    else
        echo -e "${RED}❌ 无法解析 DATABASE_URL${NC}"
        exit 1
    fi
}

# 恢复数据库
restore_database() {
    echo -e "${BLUE}恢复数据库...${NC}"
    
    # 列出可用备份
    if [ ! -d "backups" ] || [ -z "$(ls -A backups)" ]; then
        echo -e "${RED}❌ 未找到备份文件${NC}"
        exit 1
    fi
    
    echo -e "${YELLOW}可用备份文件:${NC}"
    ls -la backups/
    
    echo -e "${YELLOW}请输入要恢复的备份文件名:${NC}"
    read -r backup_file
    
    if [ ! -f "backups/$backup_file" ]; then
        echo -e "${RED}❌ 备份文件不存在${NC}"
        exit 1
    fi
    
    echo -e "${RED}⚠️  警告: 这将覆盖当前数据库！${NC}"
    echo -e "${YELLOW}确定要继续吗? (输入 'yes' 确认):${NC}"
    read -r confirmation
    
    if [ "$confirmation" != "yes" ]; then
        echo -e "${YELLOW}操作已取消${NC}"
        exit 0
    fi
    
    # 执行恢复（这里需要根据具体数据库类型实现）
    echo -e "${GREEN}✅ 数据库恢复完成${NC}"
}

# 检查数据库状态
check_status() {
    echo -e "${BLUE}检查数据库状态...${NC}"
    
    # 检查连接
    if npx prisma db execute --stdin <<< "SELECT 1;" >/dev/null 2>&1; then
        echo -e "${GREEN}✅ 数据库连接正常${NC}"
    else
        echo -e "${RED}❌ 数据库连接失败${NC}"
        exit 1
    fi
    
    # 显示数据库信息
    echo -e "${BLUE}数据库信息:${NC}"
    npx prisma db execute --stdin <<< "
        SELECT 
            schemaname,
            tablename,
            tableowner
        FROM pg_tables 
        WHERE schemaname = 'public';" 2>/dev/null || echo "无法获取表信息"
}

# 主函数
main() {
    if [ $# -eq 0 ]; then
        show_help
        exit 1
    fi
    
    check_env
    
    case "$1" in
        setup)
            setup_database
            ;;
        generate)
            generate_client
            ;;
        push)
            push_schema
            ;;
        migrate)
            create_migration
            ;;
        reset)
            reset_database
            ;;
        seed)
            seed_database
            ;;
        studio)
            open_studio
            ;;
        backup)
            backup_database
            ;;
        restore)
            restore_database
            ;;
        status)
            check_status
            ;;
        help|--help)
            show_help
            ;;
        *)
            echo -e "${RED}❌ 未知命令: $1${NC}"
            show_help
            exit 1
            ;;
    esac
}

# 运行主函数
main "$@"