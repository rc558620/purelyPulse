---
name: purelypulse-ui-patterns
description: purelyPulse 的页面骨架、列表与反馈组件、设置页布局、弹窗模式、表单接入方式和样式约束。用于新增页面 UI、复用 PageHeader、Toast、OperationModalShell、SettingsPageLayout、表单字段、会员弹窗和反馈组件。触发词包括 purelyPulse UI、页面骨架、PageHeader、Toast、弹窗、SettingsPageLayout、表单、样式规范、CSS Modules。
---

# purelyPulse UI 模式

## 最小前置

- 先读 `purelyPulse/.agent/instructions.md`
- 再读 `/Users/f0rest/Documents/AgentMode/f0rest_frontend_conventions.md`
- 全部 UI 改动都遵守 `CSS Modules + Less`

## 共享层怎么选

- `src/components/ui`：跨业务稳定 UI
- `src/components/form`：表单基础设施与输入控件
- `src/components/overlay`：通用弹窗、模态层、裁剪层
- `src/components/business`：带业务语义的共享组件
- `src/pages/**/components`：页面私有 UI

判断规则：
- 单页面用一次：留页面目录
- 同类页面会复用：提业务域共享层
- 真正跨业务稳定复用：再上提到共享组件

## 页面骨架优先复用

高频骨架：
- `PageHeader`
- `SettingsPageLayout`
- `ToastContainer` + `showToast()`
- `OperationModalShell`
- `PullRefreshLoadMore`
- `PageFab`

不要新页面一上来就从零手拼头部、容器、反馈层。

## PageHeader 模式

- 默认用于页面顶部导航
- `title` 控制页面标题
- `onBack` 不传时默认 `navigate(-1)`
- `variant` 可选 `sticky` / `transparent` / `absolute` / `relative`
- `leftExtra`、`rightExtra` 用于附加操作区

适用场景：
- 普通详情页
- 设置页
- 需要透明顶栏的个人中心风格页

## SettingsPageLayout 模式

- 这是设置类页面的现成外壳
- 已封装背景、`PageHeader`、内容区宽度和间距
- `heightMode` 控制滚动模式
- `gap` 控制内容间距

凡是修改密码、修改昵称、设置类表单页，优先考虑复用它。

## Toast 模式

- 使用 `showToast({ type, message })` 触发提示
- 不要在页面里额外挂多个 toast 容器
- `ToastContainer` 已在 `App.tsx` 全局注入
- 命令式事件派发和 React 树解耦，不需要为一个 toast 额外建页面 state

## 弹窗模式

- 通用模态能力优先看 `src/components/overlay`
- `OperationModalShell` 适合标题、操作区、提交按钮稳定的弹窗
- 页面私有复杂弹窗继续放页面目录，例如会员详情下的各类资产/状态弹窗
- 提交失败时优先保持弹窗打开，外部通过 toast 提示

## 表单模式

- 表单基础设施统一来自 `@components/form`
- 受控输入优先复用现有 `Input`、`Checkbox` 等控件
- 页面只组合字段和校验规则，不要在展示组件里混入 service 请求
- 登录等敏感表单，密码加密、profile 拉取、会话同步都在 service / session 层，不在表单组件里做

## 样式与交互硬约束

- 统一 `CSS Modules + Less`
- 类名组合用 `cx()`
- 默认不用 inline style
- 数值展示前优先 `safeNum()`
- 列表渲染前优先做数组非空保护
- 图标、按钮、状态 badge 优先复用现有模式，不要重复造轮子
- 金额相关 UI 只负责展示，不负责计算
- 页面、卡片、弹窗、表单、统计组件里禁止根据原始字段自行计算金额，只能消费后端或 `service` 层整理好的展示值

## 当前项目的 UI 风格关键词

- 移动端后台感
- 卡片式分区
- 顶部头部明确
- 渐变与柔和阴影较多
- 设置页、详情页、弹窗页都有清晰的“头部 + 内容 + 操作区”结构
- 会员相关页面偏信息卡片、状态徽标、资产操作弹窗

## 什么时候不该上提组件

以下通常先留页面目录：
- 只服务一个页面的 `HeaderActions`
- 只服务一个详情页的状态卡片
- 只服务某一个弹窗的步骤条、提示条、资格说明块
- 只在单页面出现的组合布局

## 快速判断

做 purelyPulse UI 时按这个顺序：
1. 先看页面目录里有没有现成组件
2. 再看 `ui` / `form` / `overlay`
3. 设置类页面先想 `SettingsPageLayout`
4. 顶栏先想 `PageHeader`
5. 反馈先想 `showToast()`
6. 弹窗提交失败默认不关闭
7. 如果看到金额计算需求，先回到后端返回字段或 `service` 映射层，不要在 UI 层实现
