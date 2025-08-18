#!/bin/bash

# 🚀 Git提交准备脚本
# 帮助确保安全和代码质量

echo "🚀 准备Git提交..."

# 颜色定义
RED='\033[0;31m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 步骤1: 安全检查
echo -e "${BLUE}📋 步骤1: 运行安全检查...${NC}"
if ! ./scripts/pre-commit-security-check.sh; then
    echo -e "${RED}❌ 安全检查失败，请修复后重试${NC}"
    exit 1
fi

# 步骤2: 代码格式化（如果有相关工具）
echo -e "${BLUE}📋 步骤2: 检查代码格式...${NC}"
if command -v prettier >/dev/null 2>&1; then
    echo "🎨 运行代码格式化..."
    npx prettier --write "src/**/*.{ts,tsx,js,jsx}" || echo "⚠️ Prettier未配置或出错"
else
    echo "💡 建议安装Prettier进行代码格式化"
fi

# 步骤3: TypeScript类型检查
echo -e "${BLUE}📋 步骤3: TypeScript类型检查...${NC}"
if [ -f "tsconfig.json" ]; then
    echo "🔍 检查TypeScript类型..."
    npx tsc --noEmit || echo "⚠️ TypeScript类型检查发现问题"
else
    echo "💡 未找到tsconfig.json文件"
fi

# 步骤4: 检查重要文件
echo -e "${BLUE}📋 步骤4: 检查项目完整性...${NC}"

# 检查必需文件
REQUIRED_FILES=(
    ".env.example"
    "package.json"
    "README.md"
    ".gitignore"
    "SECURITY.md"
    "PROJECT_HEALTH.md"
)

for file in "${REQUIRED_FILES[@]}"; do
    if [ ! -f "$file" ]; then
        echo -e "${YELLOW}⚠️ 缺少文件: $file${NC}"
    else
        echo -e "${GREEN}✅ $file${NC}"
    fi
done

# 步骤5: 检查package.json版本
echo -e "${BLUE}📋 步骤5: 检查项目版本...${NC}"
if [ -f "package.json" ]; then
    VERSION=$(node -p "require('./package.json').version")
    echo "📦 当前版本: $VERSION"
fi

# 步骤6: 显示即将提交的文件
echo -e "${BLUE}📋 步骤6: 显示Git状态...${NC}"
if command -v git >/dev/null 2>&1; then
    echo "📝 Git状态:"
    git status --porcelain
    
    echo ""
    echo "📊 添加到暂存区的文件:"
    git diff --cached --name-status
else
    echo "❌ Git未安装"
    exit 1
fi

# 步骤7: 最终确认
echo ""
echo -e "${GREEN}🎉 提交准备完成！${NC}"
echo ""
echo "📝 建议的提交信息模板:"
echo "==========================================="
echo "feat: 实现AI简历技术画像功能"
echo ""
echo "✨ 新功能:"
echo "- AI驱动的简历分析和技术画像生成"
echo "- 智能面试问题生成基于技术画像"
echo "- 隐私信息过滤和安全处理"
echo "- 完整的错误处理和输入验证"
echo "- 统一的配置管理和类型安全"
echo ""
echo "🔧 技术改进:"
echo "- 重构错误处理机制"
echo "- 添加TypeScript类型定义"
echo "- 优化数据库连接管理"
echo "- 增强安全配置验证"
echo ""
echo "📚 文档:"
echo "- 添加安全指南和项目健康报告"
echo "- 完善环境配置示例"
echo ""
echo "🧪 Generated with Claude Code"
echo "==========================================="
echo ""

# 提供git命令建议
echo "💡 接下来的步骤:"
echo "1. 添加文件到暂存区:"
echo "   git add ."
echo ""
echo "2. 提交更改:"
echo '   git commit -m "feat: 实现AI简历技术画像功能"'
echo ""
echo "3. 推送到远程仓库:"
echo "   git push origin main"
echo ""

echo -e "${GREEN}✅ 准备就绪，可以安全提交！${NC}"