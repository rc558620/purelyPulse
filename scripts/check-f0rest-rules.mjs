import fs from 'fs';
import path from 'path';

/**
 * f0rest 2026.03 规范校验器
 * 目标：通过静态扫描拦截不合规代码，减少 Agent 与用户的反复纠偏。
 */

const targetFile = process.argv.find(arg => arg.endsWith('.tsx') || arg.endsWith('.ts'));
const enforceLength = process.argv.includes('--enforce-length');

if (!targetFile) {
  console.error('❌ 请指定要检查的文件路径');
  process.exit(1);
}

const content = fs.readFileSync(targetFile, 'utf-8');
const lines = content.split('\n');
const errors = [];
const warnings = [];

// 1. 检查文件长度 (Rule 10)
if (lines.length > 400) {
  const msg = `[Rule 10] 文件行数为 ${lines.length}，超过了 400 行。`;
  if (enforceLength) {
    errors.push(`${msg} (当前重构模式：强制执行)`);
  } else {
    warnings.push(`${msg} (当前普通模式：仅作提醒)`);
  }
}

// 2. 检查强制工具函数 (Rule 4)
// 搜索直接使用 Array.isArray && length > 0 的模式
if (/Array\.isArray\(.*\) && .*\.length > 0/.test(content)) {
  errors.push(`[Rule 4] 禁止手写 Array.isArray 判空。请使用 isNonEmptyArray<T> 工具函数。`);
}

// 搜索 Math.random()/Date.now() 作为 key 的嫌疑 (Rule 6)
if (/key=\{.*(Math\.random|Date\.now).*\}/.test(content)) {
  errors.push(`[Rule 6] 禁止使用 Math.random 或 Date.now 生成 Key。请使用业务主键或 fallbackKey。`);
}

// 检查数字和字符串安全 (Rule 4) - 启发式扫描
// 检查常见的数字运算或显示是否缺少 safeNum
// 排除类型字段声明（`name: number;` / `name: number,`）：那属于类型定义，不是 UI 数字输出
const numSuspects = content.match(/\w+\s*:\s*number(?!\s*[;,])/g);
if (numSuspects && !content.includes('safeNum')) {
  errors.push(`[Rule 4] 检测到数字类型操作，但未引用 safeNum。请确保 UI 数字输出经过 safeNum 处理。`);
}

// 检查链式数字方法是否被 safeNum 包裹 (Rule 4 扩展)
// 上面的启发式只在「整个文件完全没有 safeNum」时才报错，只要文件里有一处 safeNum 就整体放行，
// 无法拦截 x.toFixed() 这类未经兜底的直接调用（后端字段为 null/undefined 时会抛 TypeError 中断整份导出）。
// 说明：safeNum(x, 0).toFixed(2) 中 `safeNum(x, 0)` 含参数括号与逗号，不会被标识符链匹配，故天然放行。
const numericChainViolations = [];
const NUMERIC_CHAIN_PATTERN = /([A-Za-z_$][\w$]*(?:\??\.[A-Za-z_$][\w$]*)*)\.(toFixed|toPrecision)\(/g;

lines.forEach((lineText, lineIndex) => {
  let chainMatch = NUMERIC_CHAIN_PATTERN.exec(lineText);

  while (chainMatch !== null) {
    numericChainViolations.push(`第 ${lineIndex + 1} 行：${chainMatch[1]}.${chainMatch[2]}() 未经 safeNum 兜底`);

    if (NUMERIC_CHAIN_PATTERN.lastIndex === chainMatch.index) {
      NUMERIC_CHAIN_PATTERN.lastIndex += 1;
    }
    chainMatch = NUMERIC_CHAIN_PATTERN.exec(lineText);
  }

  NUMERIC_CHAIN_PATTERN.lastIndex = 0;
});

if (numericChainViolations.length > 0) {
  // 渐进式引入：存量代码尚有历史债务，先以提醒形式暴露，待清理完毕后改为 errors 强拦截。
  warnings.push(
    `[Rule 4] 检测到 ${numericChainViolations.length} 处数字链式调用未使用 safeNum 兜底`
    + `（后端字段缺失时会抛 TypeError）：\n     - ${numericChainViolations.join('\n     - ')}`,
  );
}

// 3. 架构规范 (Rule 5)
if (/class\s+\w+\s+extends\s+React\.Component/.test(content)) {
  errors.push(`[Rule 5] 禁止在 2026.03 架构中使用 class 组件。请改用函数组件 + hooks。`);
}

// 4. 样式冲突检测 (Rule 7)
if (/style=\{\{/.test(content) && !content.includes('transform') && !content.includes('opacity')) {
  errors.push(`[Rule 7] 检测到 inline style。除非是复杂 transform/opacity 动画，否则必须使用 CSS Modules。`);
}

if (warnings.length > 0) {
  console.warn(`⚠️ 在 ${path.basename(targetFile)} 中有 ${warnings.length} 条建议：`);
  warnings.forEach(warn => console.warn(`   - ${warn}`));
}

if (errors.length > 0) {
  console.error(`\n❌ 在 ${path.basename(targetFile)} 中发现 ${errors.length} 处违规：`);
  errors.forEach(err => console.error(`   - ${err}`));
  process.exit(1);
} else {
  console.log(`\n✅ ${path.basename(targetFile)} 合规。`);
  process.exit(0);
}
