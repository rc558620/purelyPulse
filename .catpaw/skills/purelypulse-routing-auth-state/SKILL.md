---
name: purelypulse-routing-auth-state
description: purelyPulse 的路由注册、懒加载预加载、鉴权守卫、认证会话和 Zustand 用户态模式。用于新增路由、处理登录态、实现重定向、接入受保护页面、修改 `userStore` 或 `authSession` 链路。触发词包括 purelyPulse 路由、登录态、鉴权、ProtectedRoute、userStore、authSession、routeDefinitions、pages.tsx。
---

# purelyPulse 路由与鉴权状态

## 最小前置

- 先读 `purelyPulse/.agent/instructions.md`
- 再读 `/Users/f0rest/Documents/AgentMode/f0rest_frontend_conventions.md`
- 默认模式使用 `【模式：main】`

## 路由四个核心文件

- `src/router/pages.tsx`：注册懒加载页面与 `preload()`
- `src/router/definitions.tsx`：声明 path 对应哪个页面、是否套 guard
- `src/router/paths.ts`：统一维护 `ROUTE_PATHS`
- `src/router/index.tsx`：把 definitions 组装成运行时路由，并提供预加载能力

## 新增页面路由时的正确顺序

1. 在 `src/router/paths.ts` 增加 path 常量
2. 在 `src/router/pages.tsx` 注册 `lazyWithPreload()`
3. 在 `src/router/definitions.tsx` 增加 route definition
4. 如需鉴权，复用 `withAuthGuard` / `ProtectedRoute`
5. 如是高频页面，再判断是否加入 idle preload 列表

不要只改其中一个文件。

## 当前项目的路由特点

- 入口默认从 `/` 重定向到 `/login`
- 登录后页面大多包在 `ProtectedRoute` 中
- `pages.tsx` 负责懒加载与 preload 缓存，不要把懒加载细节散落到页面文件
- `App.tsx` 会渲染 `routeConfig`，并在浏览器空闲时做路由 chunk 预热

## ProtectedRoute 使用原则

- 路由守卫优先放在 `definitions.tsx`
- 页面内部不要重复写“未登录就 navigate('/login')”这种零散逻辑
- 需要未登录提示时，通过 guard 的 `message` 和 `fallback` 统一处理
- 受保护页面默认依赖 `isAuthenticated()`

## 认证会话模式

核心文件：
- `src/pages/login/shared/authSession.ts`
- `src/stores/userStore.ts`
- `src/pages/login/shared/auth.service.ts`
- `src/App.tsx`

分工：
- `auth.service.ts`：登录请求、RSA 加密密码、拉取 `/auth/me`、映射用户信息
- `authSession.ts`：持久化 token、过期时间、同步会话、清理登录态
- `userStore.ts`：持有当前用户信息与初始化状态
- `App.tsx`：配置 HTTP client，统一处理 401 与登录页重定向

## 当前认证实现的关键语义

- 登录密码在 service 层做 `rsaEncrypt()`，不要在页面组件里处理
- `markAuthenticated()` 负责保存 token 与过期时间
- `clearAuthSession()` 负责清理 token、用户态和初始化状态
- `configureHttpClient()` 统一注入 token、csrf、401 处理
- 401 时由全局处理器清理会话并带 `redirect` 参数跳回登录页

## userStore 使用规则

- 全局用户数据单一来源是 `useUserStore`
- `DEFAULT_USER_INFO` 是空用户态基线
- `readPersistedUserInfo()` 负责兼容旧格式与持久化包装结构
- `updateUserInfo()` 用于增量更新用户信息
- `clearUserInfo()` 同时清理持久化和认证相关缓存

## 状态改动边界

可以进 `userStore` 的：
- 当前登录用户基础资料
- 初始化中状态
- 会话级持久化用户信息

不要进 `userStore` 的：
- 页面筛选条件
- 页面弹窗开关
- 纯页面列表数据
- 只在一个页面用一次的局部状态

## 修改登录链路时的优先级

1. 先看 `auth.service.ts` 是否已能承接字段映射
2. 再看 `authSession.ts` 是否需要调整会话持久化
3. 再看 `userStore.ts` 是否需要新增用户态字段
4. 最后才碰页面表单或路由守卫

## 常见反例

- 在页面组件里直接调用 `sessionStorage` 写 token
- 在多个页面重复写未登录跳转逻辑
- 把后端原始 `profile` 结构直接塞给 UI
- 在页面提交回调里混入 RSA、公钥、token 持久化细节
- 新增路由只改 `paths.ts` 不改 `pages.tsx` 与 `definitions.tsx`

## 快速判断

遇到 purelyPulse 登录态、路由、守卫需求时，优先判断：
- 是改 path 常量、page 注册、definition，还是运行时组装
- 是改 service 映射、会话持久化，还是全局 store
- 是否应该走 `ProtectedRoute`
- 是否应该由 `App.tsx` 的统一 HTTP 配置接管
