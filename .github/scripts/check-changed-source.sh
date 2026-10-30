#!/usr/bin/env bash
#
# f0rest 规范增量校验：只对「本次变更的源码文件」跑 check-f0rest-rules.mjs。
#
# 为什么不全量扫描：校验器是启发式扫描（例如「文件里有 number 类型却没提到
# safeNum」即报错），对存量文件全量跑会输出海量历史误报，真正的新增违规反而被
# 淹没。增量扫描让「新代码零违规、存量逐步收敛」成为可执行门禁。
#
# 输入（均由 workflow 通过环境变量注入）：
#   BASE_SHA  diff 基准提交；为空则跳过校验（例如首次推送、fork 无法取基准）
#   HEAD_SHA  diff 终点提交，默认 HEAD
#   RULES_STRICT  为 true 时校验失败即阻断 CI，默认 false（仅告警）
#
# 为什么默认只告警：校验器的部分规则是启发式的 —— 例如「文件里出现 number 类型
# 却没提到 safeNum 即报错」，在 service / dto 这类非渲染层是稳定误报。
# 若直接阻断，会产生频繁假红，最终结果往往是团队绕过门禁 ——
# 门禁一旦失去可信度，比没有门禁更糟。因此先以告警保持可见可控，
# 待存量违规清理后再通过 RULES_STRICT 切换为阻断。
set -uo pipefail

# BASE_SHA / HEAD_SHA 透传给共用的变更文件计算脚本，避免 diff 逻辑重复实现
script_dir=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)
strict="${RULES_STRICT:-false}"

changed_files=$(bash "$script_dir/changed-files.sh")

if [ -z "$changed_files" ]; then
  echo "本次变更未涉及 src 下的 TS / TSX 文件，跳过规范校验"
  exit 0
fi

echo "规范校验范围（共 $(printf '%s\n' "$changed_files" | wc -l | tr -d ' ') 个文件）："
printf '  - %s\n' $changed_files
echo ""

failed_files=()
while IFS= read -r file; do
  if ! node scripts/check-f0rest-rules.mjs "$file"; then
    failed_files+=("$file")
  fi
done <<< "$changed_files"

if [ "${#failed_files[@]}" -gt 0 ]; then
  summary_path="${GITHUB_STEP_SUMMARY:-/dev/stdout}"
  {
    echo "### ⚠️ f0rest 规范校验：${#failed_files[@]} 个文件存在提示（未阻断 CI）"
    echo ""
    echo "| 文件 |"
    echo "|------|"
    printf '| `%s` |\n' "${failed_files[@]}"
    echo ""
    echo "校验器对 service / dto 等非渲染层存在已知启发式误报，"
    echo "改动上述文件时请人工判断是真违规还是误报。"
    echo "存量清理完成后，可在 workflow 中设置 \`RULES_STRICT: 'true'\` 升级为阻断门禁。"
  } >> "$summary_path"

  echo "⚠️ ${#failed_files[@]} 个文件未通过 f0rest 规范校验（告警模式）"

  if [ "$strict" = "true" ]; then
    echo "❌ RULES_STRICT=true，规范校验失败阻断 CI"
    exit 1
  fi
  exit 0
fi

echo "✅ 本次变更文件全部通过 f0rest 规范校验"
