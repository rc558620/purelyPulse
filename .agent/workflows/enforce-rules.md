---
description: 自动执行 f0rest 2026.03 规范校验
---

> [!CAUTION]
> **所有回答必须使用简体中文**，无论用户用什么语言提问。执行以下每一步前，先确认语言设置。

## 前置步骤（每次任务必须执行）

// turbo
1. 读取全局规范文件：
   ```bash
   # 调用 view_file 读取以下路径
   /Users/f0rest/Documents/AgentMode/f0rest_frontend_conventions.md
   ```
   - **禁止跳过**，即便已在本次会话中读取过也需确认关键规则。
   - 读取后在回答开头标注模式，如：【模式：main】。

## 代码交付前校验流程

// turbo
2. 对每个修改/新建的文件运行校验：
   ```bash
   node scripts/check-f0rest-rules.mjs [文件完整路径]
   ```

3. **违规处理**
   - Exit Code 1 → **严禁**将代码直接提交用户。
   - 根据报错信息重构（如文件超 400 行 → 拆分组件）。
   - 修复后**必须重新运行步骤 2**，直到返回 ✅。

4. **结果交付**
   - 仅校验全部通过（✅）后，才能向用户发送完成信息。
   - 用**简体中文**附上校验通过的日志摘要。

## 高频违规速查（代码生成时主动检查）

| 规则 | 正确 | 错误 |
|------|------|------|
| 类名拼接 | `cx(styles.a, isX && styles.b)` | `` `${styles.a} ${styles.b}` `` |
| 列表渲染 | `isNonEmptyArray(list) && list.map(...)` | `list.map(...)` |
| 数字展示 | `safeNum(value)` | `value \|\| 0` |
| 随机 key | `fallbackKey('item', id)` | `Math.random()` |
| 异步 | `async/await` | `.then().catch()` |
| 类型 | 显式声明参数/返回类型 | `any` |
| 组件注释 | `// 组件功能说明`（顶部单行） | 块级 JSDoc |
