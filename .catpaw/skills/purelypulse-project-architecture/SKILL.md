---
name: purelypulse-project-architecture
description: purelyPulse 项目架构、目录分层、owner 业务语境、service 映射边界与页面落层规则。用于理解 purelyPulse 的代码该放在哪一层、如何新增页面模块、如何处理接口映射、如何避免把业务数据和 UI 装配写混。触发词包括 purelyPulse、项目架构、目录结构、放哪层、service、页面拆分、模块边界、owner 后台。
---

# purelyPulse 项目架构

## 最小前置

- 先读 `purelyPulse/.agent/instructions.md`
- 再读 `/Users/f0rest/Documents/AgentMode/f0rest_frontend_conventions.md`
- 默认回答开头标注 `【模式：main】`

## 项目定位

- 这是给商家老板、店主、经营负责人使用的经营与会员管理后台
- 默认业务视角是 owner，不是 C 端会员自助页，也不是员工执行工作台
- 页面文案、字段语义、交互提示都优先站在“老板看经营结果”的语境
- 用户手机号、会员资产、会员等级、合伙人信息在管理场景中允许完整展示，不默认脱敏

## 技术底座

- React 19 + TypeScript + Vite
- 路由：`react-router-dom`
- 状态：`zustand`
- 请求：`@utils/http`
- 表单：项目内 `@components/form`
- 测试：Vitest + Testing Library
- 样式：`CSS Modules + Less`

## 别名与共享层

- `@` -> `src`
- `@components` -> `src/components`
- `@hooks` -> `src/hooks`
- `@pages` -> `src/pages`
- `@stores` -> `src/stores`
- `@utils` -> `src/utils`
- `@router` -> `src/router`
- `@contexts` -> `src/contexts`

## 目录落层规则

- `src/pages/<page>`：页面私有页面、私有组件、页面 hooks、页面 service
- `src/components/ui`：跨业务稳定 UI 组件
- `src/components/form`：表单基础设施与字段控件
- `src/components/overlay`：弹窗、模态层、裁剪层等覆盖层
- `src/components/business`：带业务语义的跨页面组件，例如 `ProtectedRoute`
- `src/stores`：全局状态与持久化状态
- `src/router`：路由 definitions、page 注册、path 常量、guard 组装
- `src/utils`：通用工具、HTTP 基础设施、RSA、数字安全处理

判断顺序：
1. 只在一个页面用吗？是就留页面目录
2. 同一业务域会复用吗？提到该业务域共享层
3. 跨业务长期稳定复用吗？再上提到 `src/components/*` 或 `src/utils/*`
4. 含正式业务数据、请求、映射、竞态控制吗？优先放 `service` / `store` / `hook`

## 页面组织模式

纯页面入口应只做三件事：
- 组合页面私有组件
- 连接页面级 hook / controller
- 处理少量路由级装配

不要把这些塞进页面入口：
- 大段接口字段映射
- 复杂请求防重与竞态处理
- 弹窗提交闭环
- 大量列表格式化逻辑
- 多种业务状态机

## 金额硬约束

- 前端不做任何金额计算，只做展示
- 金额、价格、营收、充值金额、实收、应收、折扣后金额、利润、分账、余额、退款金额等，全部以后端返回结果为准
- 前端只允许做展示格式化、空值兜底、单位文案展示，不允许根据单价、数量、折扣、时长、比例等字段自行推导金额结果
- 若后端未返回可直接展示的金额字段，应优先推动后端补齐，或在 `service` 层做字段映射，不得在页面、组件、hook 中临时计算

## service 层边界

- 页面和 UI 不直接吃后端原始响应
- DTO 映射、字段兼容、默认值兜底放在 `*.service.ts`
- 项目大量接口返回存在多候选字段名，service 层允许做 candidate 兼容映射
- 金额、价格、营收、充值金额等业务结果以后端返回结果为准，前端禁止自行计算
- 前端只消费可直接展示的金额字段，如 `xxxDisplay`

常见模式：
- `resolveEnvPath(import.meta.env.XXX, '/fallback')`
- `createKeyedInFlightRequest()` 或单请求去重
- `safeNum()` 处理数值展示前的安全归一

## 这个项目的高频页面族

- `home`：经营总览、营收趋势、合伙人排行
- `memberList` / `memberDetail`：会员列表、详情、资产、状态、子账号
- `memberPoints` / `partnerBeans`：积分、豆值记录与调整
- `banManagement`：封禁管理
- `membershipSettings`：会员套餐配置
- `profile` / `changePassword` / `changeNickname`：个人与设置类页面
- `login`：登录与鉴权入口

## 编码硬约束

- 中文回答、中文注释
- React 样式统一 `CSS Modules + Less`
- 禁止随意 inline style
- 类名组合使用 `cx()`
- 列表渲染前优先 `isNonEmptyArray()`
- 数字展示优先 `safeNum()`
- 禁止 `any`
- 异步统一 `async/await`

## 新增功能时的推荐流程

1. 先判断是页面私有、业务域共享，还是全局共享
2. 再判断是展示逻辑、控制器逻辑，还是正式业务数据逻辑
3. 请求字段映射和兜底下沉到 `service`
4. 页面只消费整理后的前端语义数据
5. 最后检查是否复用现有骨架与通用组件

## 快速判断

遇到 purelyPulse 需求时优先回答：
- 这段代码该落在哪一层
- 是否应继续留在页面目录
- 是否应该抽到 `service` / `store` / `components`
- 是否破坏了 owner 后台的业务语义
- 是否把 UI 装配与业务数据处理写混了
- 是否出现了任何前端金额计算逻辑
