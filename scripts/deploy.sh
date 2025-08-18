#!/bin/bash
# CodeMockLab 部署脚本

set -e

echo "🚀 开始部署 CodeMockLab..."

# 检查环境
if [ -z "$NODE_ENV" ]; then
    export NODE_ENV=production
fi

echo "📝 环境: $NODE_ENV"

# 安装依赖
echo "📦 安装依赖..."
npm ci --only=production

# 生成 Prisma 客户端
echo "🔧 生成 Prisma 客户端..."
npx prisma generate

# 数据库迁移
echo "🗄️ 执行数据库迁移..."
npx prisma db push

# 构建应用
echo "🔨 构建应用..."
npm run build

# 启动应用 (使用 PM2)
echo "🚀 启动应用..."
if command -v pm2 &> /dev/null; then
    pm2 stop codemocklab || true
    pm2 delete codemocklab || true
    pm2 start npm --name "codemocklab" -- start
    pm2 save
else
    echo "⚠️  PM2 未安装，直接启动应用..."
    npm start
fi

echo "✅ 部署完成！"
echo "🌐 应用访问地址: http://localhost:3000"
echo "💚 健康检查: http://localhost:3000/api/health"