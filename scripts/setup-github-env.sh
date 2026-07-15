#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────
# purelyPulse — GitHub 仓库环境一键初始化脚本
# 使用 gh CLI (gh auth login 之后运行)
#
# 功能：
#   1. main 分支保护规则（PR 合并 + CI status checks 必填）
#   2. GitHub Pages source 设为 GitHub Actions
#   3. 创建 github-pages Environment
# ─────────────────────────────────────────────────────────────
set -euo pipefail

# ── 颜色输出 ─────────────────────────────────────────────────
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

info()  { printf "${GREEN}[✓]${NC} %s\n" "$1"; }
warn()  { printf "${YELLOW}[!]${NC} %s\n" "$1"; }
error() { printf "${RED}[✗]${NC} %s\n" "$1"; }

# ── 前置检查 ─────────────────────────────────────────────────
if ! command -v gh &>/dev/null; then
  error "gh CLI 未安装，请先安装: https://cli.github.com/"
  exit 1
fi

if ! gh auth status &>/dev/null; then
  error "gh 未登录，请先运行: gh auth login"
  exit 1
fi

# ── 获取仓库信息 ─────────────────────────────────────────────
REPO=$(gh repo view --json nameWithOwner -q '.nameWithOwner')
OWNER="${REPO%/*}"
REPO_NAME="${REPO#*/}"

info "目标仓库: ${REPO}"
echo ""

# ── 1. main 分支保护规则 ─────────────────────────────────────
# Status check context 格式: "{workflow name} / {job name}"
# 对应 ci.yml (name: CI) 的 1 个 job
echo "── 配置 main 分支保护规则 ──────────────────────────────"

if gh api \
  --method PUT \
  "repos/${REPO}/branches/main/protection" \
  --input - <<'EOF'
{
  "required_status_checks": {
    "strict": true,
    "contexts": [
      "CI / Lint · Type-check · Test"
    ]
  },
  "enforce_admins": true,
  "required_pull_request_reviews": {
    "required_approving_review_count": 0,
    "dismiss_stale_reviews": false
  },
  "restrictions": null,
  "required_linear_history": false,
  "allow_force_pushes": false,
  "allow_deletions": false,
  "block_creations": false,
  "required_conversation_resolution": false
}
EOF
then
  info "main 分支保护规则已配置"
  echo "    • 强制 PR 合并（禁止直接 push）"
  echo "    • Status checks 必填："
  echo "        - CI / Lint · Type-check · Test"
  echo "    • 管理员同样受约束"
else
  warn "分支保护规则配置失败（可能已存在，请手动检查）"
fi

echo ""

# ── 2. GitHub Pages source 设为 GitHub Actions ───────────────
echo "── 配置 GitHub Pages ────────────────────────────────────"

# 先检查 Pages 是否已配置，避免重复创建报错
PAGES_STATUS=$(gh api "repos/${REPO}/pages" --jq '.status' 2>/dev/null || echo "not_configured")

if [ "$PAGES_STATUS" = "not_configured" ]; then
  if gh api \
    --method POST \
    "repos/${REPO}/pages" \
    --input - <<'EOF'
{
  "build_type": "workflow",
  "workflow": {
    "enabled": true
  }
}
EOF
  then
    info "GitHub Pages 已配置：source = GitHub Actions"
  else
    warn "GitHub Pages 配置失败，请手动检查 Settings → Pages"
  fi
else
  info "GitHub Pages 已存在，跳过配置（当前状态: ${PAGES_STATUS}）"
fi

echo ""

# ── 3. 创建 github-pages Environment ─────────────────────────
echo "── 创建 github-pages Environment ────────────────────────"

# Environment 没有"查询单个"的 API，直接 PUT 创建（幂等）
if gh api \
  --method PUT \
  "repos/${REPO}/environments/github-pages" \
  --input - <<'EOF'
{
  "wait_timer": 0
}
EOF
then
  info "github-pages Environment 已创建"
  echo "    • 可在 Settings → Environments → github-pages 中添加 Secrets/Variables"
else
  warn "Environment 创建失败（可能已存在）"
fi

echo ""
echo "────────────────────────────────────────────────────────"
info "全部配置完成！"
echo ""
echo "后续可选操作："
echo "  • 添加 API 地址等变量: Settings → Environments → github-pages → Variables"
echo "  • 添加密钥:           Settings → Environments → github-pages → Secrets"
echo "  • 验证 Pages 部署:    推送代码到 main 分支后访问 https://${OWNER}.github.io/${REPO_NAME}/"
echo "────────────────────────────────────────────────────────"
