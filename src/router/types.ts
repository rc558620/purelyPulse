/**
 * router 领域类型定义。
 *
 * 这个文件只放“路由系统自己的类型”，不放实现逻辑。
 * 这样做的好处：
 * - pages / guards / definitions / index 都可以共享同一套类型
 * - 后续给路由扩展 meta、title、权限字段时，改这里最清晰
 */

import type { ReactNode } from 'react';
import type { LazyPage } from './pages';

/**
 * 路由包装器。
 *
 * 它接收“原始页面节点”，返回“包装后的页面节点”。
 * 常见用途：
 * - 套一层登录守卫
 * - 套一层业务前置校验
 * - 套一层 layout / 权限容器
 *
 * 例如：
 *   (page) => <ProtectedRoute>{page}</ProtectedRoute>
 */
export type RouteWrapper = (page: ReactNode) => ReactNode;

/**
 * 单条路由定义的数据结构。
 *
 * 字段说明：
 * - path：路由地址，给 react-router 使用
 * - page：常规页面，来自 pages.tsx 的懒加载页面资源
 * - element：特殊场景下直接写死的 React 节点，比如重定向
 * - wrap：可选包装器，用来给页面套守卫或其他壳层
 *
 * 约定：
 * - 正常页面通常写 page
 * - 重定向 / 特殊节点通常写 element
 * - page 和 element 二选一，至少要有一个
 */
export type AppRouteDefinition = {
  path: string;
  page?: LazyPage;
  element?: ReactNode;
  wrap?: RouteWrapper;
};
