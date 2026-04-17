/**
 * 路由声明层。
 *
 * 这个文件只回答一个问题：
 * “系统里有哪些路由，它们分别对应哪个页面，需要套什么守卫？”
 *
 * 它不处理：
 * - preload 查找
 * - RouteObject 组装
 * - 动态路由匹配
 *
 * 这些运行时逻辑都交给 index.tsx。
 */

import { Navigate } from 'react-router-dom';
import { ROUTE_PATHS } from './paths';
import { pages } from './pages';
import type { AppRouteDefinition } from './types';

/**
 * 全量路由定义。
 *
 * 阅读方式：
 * - path：浏览器地址
 * - page：真正要渲染的懒加载页面
 * - wrap：进入页面前额外包裹的守卫
 * - element：特殊节点，比如重定向
 *
 * 维护建议：
 * - 新增页面：先在 pages.tsx 注册，再来这里声明 path
 * - 需要守卫：直接加 wrap
 * - 纯重定向：直接写 element，不需要 page
 */
export const routeDefinitions: AppRouteDefinition[] = [
    // 默认进入项目时，统一跳去登录页。
    { path: ROUTE_PATHS.root, element: <Navigate to={ROUTE_PATHS.login} replace /> },

    { path: ROUTE_PATHS.login, page: pages.login },
    { path: ROUTE_PATHS.home,  page: pages.home },
];
