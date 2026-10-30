#!/usr/bin/env bash
#
# 守卫：环境变量文件是否被 git 跟踪。
#
# 只加 .gitignore 是不够的 —— 已入库的文件不受 .gitignore 约束，会继续被提交、
# 被克隆到每一台开发机。这道检查用于在 CI 上兜住「密钥入库」这类 S0 问题。
set -uo pipefail

# 允许入库的文件白名单：只有示例文件
tracked=$(git ls-files | grep -E '(^|/)\.env' | grep -vE '(^|/)\.env\.example$' || true)

if [ -z "$tracked" ]; then
  echo "✅ 未检测到被 git 跟踪的环境变量文件"
  exit 0
fi

echo "❌ 检测到环境变量文件已被 git 跟踪（停止跟踪不等于从历史中删除）："
printf '  - %s\n' $tracked
echo ""
echo "修复步骤："
echo "  1. git rm --cached --force <上述文件>      # 停止跟踪，本地文件保留"
echo "  2. git commit -m 'chore: 移除入库的环境变量文件'"
echo "  3. 轮换文件中出现过的所有密钥（历史提交仍可被检出，旧密钥视为已泄露）"
echo "  4. 生产环境所需变量改由仓库 Settings → Secrets and variables 注入"
exit 1
