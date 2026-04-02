#!/bin/bash

# ============================================
# 智能录单系统 - 生产环境一键构建脚本
# 用法: sh prod_build.sh
# ============================================

set -e  # 任何命令失败立即退出

echo "============================================"
echo "开始构建智能录单系统..."
echo "============================================"

# 获取脚本所在目录（绝对路径）
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR" && pwd)"

echo "项目根目录: $PROJECT_ROOT"

# ============================================
# 1. 构建前端 (client)
# ============================================
echo ""
echo ">>> [1/2] 构建前端 (client)..."
echo ""

cd "$PROJECT_ROOT/client"

echo "安装前端依赖..."
npm install

echo "构建前端 Web 版本..."
npx expo export -p web

if [ ! -d "$PROJECT_ROOT/client/dist" ]; then
  echo "错误: 前端构建失败，dist 目录不存在！"
  exit 1
fi

echo "前端构建完成！"

# ============================================
# 2. 构建后端 (server)
# ============================================
echo ""
echo ">>> [2/2] 构建后端 (server)..."
echo ""

cd "$PROJECT_ROOT/server"

echo "安装后端依赖..."
npm install

echo "构建后端..."
npm run build

if [ ! -d "$PROJECT_ROOT/server/dist" ]; then
  echo "错误: 后端构建失败，dist 目录不存在！"
  exit 1
fi

echo "后端构建完成！"

# ============================================
# 构建完成
# ============================================
echo ""
echo "============================================"
echo "✅ 构建成功完成！"
echo "============================================"
echo ""
echo "后续步骤:"
echo "1. 配置环境变量: 编辑 server/.env 文件"
echo "2. 启动服务: cd server && npm start"
echo ""
