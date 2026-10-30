#!/usr/bin/env bash
#
# 输出「本次变更且仍存在」的 src 下 TS / TSX 文件，每行一个。
#
# 被 lint 与规范校验两个步骤共用，保证两者看到同一份变更集合 ——
# 若各自实现一遍 diff 逻辑，很容易在 PR 里出现「lint 报 missing、规范报另一批」。
#
# 环境变量：
#   BASE_SHA  diff 基准；为空则无输出（首次推送、基准不可达）
#   HEAD_SHA  diff 终点，默认 HEAD
set -uo pipefail

base_sha="${BASE_SHA:-}"
head_sha="${HEAD_SHA:-HEAD}"

[ -z "$base_sha" ] && exit 0

# CI 的 checkout 多为浅克隆，基准提交可能不在本地，按需补拉
if ! git cat-file -e "${base_sha}^{commit}" 2>/dev/null; then
  git fetch --no-tags --depth=1 origin "$base_sha" 2>/dev/null || true
fi

git cat-file -e "${base_sha}^{commit}" 2>/dev/null || exit 0

git diff --diff-filter=ACMR --name-only "$base_sha" "$head_sha" \
  | grep -E '^src/.+\.(ts|tsx)$' \
  | grep -vE '\.d\.ts$' \
  | while IFS= read -r file; do
      # 跳过已被删除的文件：eslint / 校验器再聪明也读不到
      [ -f "$file" ] && printf '%s\n' "$file"
    done
