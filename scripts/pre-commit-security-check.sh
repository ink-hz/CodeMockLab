#!/bin/bash

# 🔒 Git提交前安全检查脚本
# 用于检测可能提交的敏感信息

echo "🔍 开始安全检查..."

# 颜色定义
RED='\033[0;31m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
NC='\033[0m' # No Color

# 错误计数
ERRORS=0
WARNINGS=0

# 检查函数
check_file() {
    local file=$1
    local pattern=$2
    local message=$3
    local level=$4  # error or warning
    
    if [ -f "$file" ]; then
        if grep -q "$pattern" "$file" 2>/dev/null; then
            if [ "$level" = "error" ]; then
                echo -e "${RED}❌ 错误: $message${NC}"
                echo -e "   文件: $file"
                ERRORS=$((ERRORS+1))
            else
                echo -e "${YELLOW}⚠️  警告: $message${NC}"
                echo -e "   文件: $file"
                WARNINGS=$((WARNINGS+1))
            fi
        fi
    fi
}

# 检查 .env 文件是否被意外添加
echo "📁 检查环境文件..."
for env_file in .env .env.local .env.development.local .env.test.local .env.production.local; do
    if git ls-files --error-unmatch "$env_file" >/dev/null 2>&1; then
        echo -e "${RED}❌ 错误: 环境文件 $env_file 不应该被提交${NC}"
        ERRORS=$((ERRORS+1))
    fi
done

# 检查API密钥模式
echo "🔑 检查API密钥..."
API_KEY_PATTERNS=(
    "sk-[a-zA-Z0-9]{32,}"
    "DEEPSEEK_API_KEY.*=.*sk-"
    "OPENAI_API_KEY.*=.*sk-"
    "ANTHROPIC_API_KEY.*=.*sk-"
    "API_KEY.*=.*[a-zA-Z0-9]{20,}"
)

for pattern in "${API_KEY_PATTERNS[@]}"; do
    if git diff --cached | grep -E "$pattern" >/dev/null 2>&1; then
        echo -e "${RED}❌ 错误: 检测到可能的API密钥在暂存区${NC}"
        ERRORS=$((ERRORS+1))
    fi
done

# 检查数据库连接字符串
echo "🗄️  检查数据库连接..."
DB_PATTERNS=(
    "postgresql://.*:.*@.*:.*/"
    "mysql://.*:.*@.*:.*/"
    "mongodb://.*:.*@.*:.*/"
    "DATABASE_URL.*=.*://.*:.*@"
)

for pattern in "${DB_PATTERNS[@]}"; do
    if git diff --cached | grep -E "$pattern" >/dev/null 2>&1; then
        echo -e "${YELLOW}⚠️  警告: 检测到数据库连接字符串${NC}"
        WARNINGS=$((WARNINGS+1))
    fi
done

# 检查密码相关
echo "🔐 检查密码和密钥..."
PASSWORD_PATTERNS=(
    "password.*=.*[^[]"
    "PASSWORD.*=.*[^[]"
    "secret.*=.*[^[]"
    "SECRET.*=.*[^[]"
    "token.*=.*[^[]"
    "TOKEN.*=.*[^[]"
)

for pattern in "${PASSWORD_PATTERNS[@]}"; do
    if git diff --cached | grep -iE "$pattern" >/dev/null 2>&1; then
        # 排除示例文件
        if ! git diff --cached --name-only | grep -E "\.(example|template)" >/dev/null 2>&1; then
            echo -e "${YELLOW}⚠️  警告: 检测到可能的密码或密钥配置${NC}"
            WARNINGS=$((WARNINGS+1))
            break
        fi
    fi
done

# 检查邮箱地址（可能包含敏感信息）
echo "📧 检查邮箱地址..."
if git diff --cached | grep -E "[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}" >/dev/null 2>&1; then
    echo -e "${YELLOW}⚠️  警告: 检测到邮箱地址，请确认不是敏感信息${NC}"
    WARNINGS=$((WARNINGS+1))
fi

# 检查IP地址
echo "🌐 检查IP地址..."
if git diff --cached | grep -E "([0-9]{1,3}\.){3}[0-9]{1,3}" >/dev/null 2>&1; then
    echo -e "${YELLOW}⚠️  警告: 检测到IP地址，请确认不是内网地址${NC}"
    WARNINGS=$((WARNINGS+1))
fi

# 检查硬编码的开发配置
echo "⚙️  检查开发配置..."
DEV_PATTERNS=(
    "localhost:3000"
    "127.0.0.1"
    "development.*true"
    "debug.*true"
)

for pattern in "${DEV_PATTERNS[@]}"; do
    if git diff --cached | grep -E "$pattern" >/dev/null 2>&1; then
        echo -e "${YELLOW}⚠️  警告: 检测到开发环境配置，生产环境可能需要修改${NC}"
        WARNINGS=$((WARNINGS+1))
        break
    fi
done

# 检查大文件
echo "📦 检查大文件..."
large_files=$(git diff --cached --name-only | xargs -I {} find . -name {} -size +1M 2>/dev/null || true)
if [ -n "$large_files" ]; then
    echo -e "${YELLOW}⚠️  警告: 检测到大文件（>1MB）:${NC}"
    echo "$large_files"
    WARNINGS=$((WARNINGS+1))
fi

# 总结报告
echo ""
echo "📊 安全检查报告:"
echo "=================="

if [ $ERRORS -eq 0 ] && [ $WARNINGS -eq 0 ]; then
    echo -e "${GREEN}✅ 恭喜！未检测到安全问题${NC}"
    echo -e "${GREEN}🚀 可以安全提交到git仓库${NC}"
    exit 0
elif [ $ERRORS -eq 0 ]; then
    echo -e "${YELLOW}⚠️  发现 $WARNINGS 个警告${NC}"
    echo -e "${GREEN}✅ 无严重安全问题，可以提交${NC}"
    echo ""
    echo "💡 建议:"
    echo "   - 检查警告信息是否需要处理"
    echo "   - 确认配置信息适用于目标环境"
    exit 0
else
    echo -e "${RED}❌ 发现 $ERRORS 个错误和 $WARNINGS 个警告${NC}"
    echo -e "${RED}🛑 请修复错误后再提交${NC}"
    echo ""
    echo "🔧 修复建议:"
    echo "   1. 移除或重新生成暴露的API密钥"
    echo "   2. 确保敏感文件在 .gitignore 中"
    echo "   3. 使用环境变量替代硬编码配置"
    echo "   4. 重新运行此脚本验证修复"
    exit 1
fi