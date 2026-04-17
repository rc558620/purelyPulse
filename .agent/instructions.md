# 前端开发指令（AI 行为准则）

> [!CAUTION]
> ## ⛔ 绝对强制规则（违反即视为任务失败）
>
> 1. **所有回答、解释、分析、代码注释 → 必须使用简体中文**，无论用户用何种语言提问。
> 2. **每次任务开始前**，必须使用 `view_file` 读取全局规范文件，获取"f0rest 2026.03"完整约束。
>    - 规范路径：`/Users/f0rest/Documents/AgentMode/f0rest_frontend_conventions.md`
> 3. **代码生成后、交付前**，必须运行校验脚本，通过才能发送。
>    - 校验命令：`node scripts/check-f0rest-rules.mjs [文件完整路径]`

---

## 一、规范查阅协议（First-Step Protocol）

每次任务开始，**第一步**必须读取：
```
/Users/f0rest/Documents/AgentMode/f0rest_frontend_conventions.md
```
- 禁止依赖记忆或直觉编码，必须实际调用 `view_file`。
- 读取后在回答开头标注当前模式，例如：【模式：main】。

---

## 二、工作模式速查

| 模式 | 触发条件 |
|------|---------|
| `main`（默认） | 日常开发任务 |
| `perf` | 流式状态、高频更新、性能优化 |
| `refactor` | 文件 > 400 行或函数 > 60 行 |
| `strict` | 需要 PR-Ready 质量的审计场景 |
| `dto` | 类型巡检、接口注释补全 |
| `ui` | UI 设计与组件审查 |
| `arch` | 跨文件架构评审 |

---

## 三、核心编码约束（内嵌速查）

以下为最高频违规点，**必须在每次代码生成时主动检查**：

- **语言**：所有中文注释、中文回答
- **类名**：禁止模板字符串或三元拼接，必须用 `cx()`
- **列表渲染**：`map` 前必须 `isNonEmptyArray`
- **数字展示**：必须用 `safeNum`
- **样式**：React 必须 `CSS Modules + Less`，禁止 `inline style`（特殊场景需注释）
- **类型**：禁止 `any`，所有导出函数必须显式类型
- **组件注释**：文件顶部 `// 页面/组件功能说明`（单行，非块级 JSDoc）
- **key**：优先业务主键，回退用 `fallbackKey`，禁止 `Math.random / Date.now`
- **异步**：统一 `async/await`，禁止 `.then().catch()` 链式

---

## 四、质量门（交付前必须满足）

1. 运行 `node scripts/check-f0rest-rules.mjs [文件]`
2. 脚本 Exit Code 必须为 0（✅）
3. 若失败 → 原地重构 → 重新运行，**禁止跳过**

---

*规范详情见全局配置：`/Users/f0rest/Documents/AgentMode/f0rest_frontend_conventions.md`*
