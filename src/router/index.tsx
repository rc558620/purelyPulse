/**
 * router 对外出口。
 *
 * 这个文件负责把 definitions / pages / guards 这些“静态声明”
 * 组装成真正可运行的路由能力，并对外只暴露两个结果：
 * - routeConfig：给 App.tsx 渲染 <Routes> 使用
 * - getRoutePreload：给 useAnimatedNavigate 在跳转前预加载页面 chunk 使用
 *
 * 可以把它理解成 router 的“运行时适配层”。
 */

import type { ReactNode } from 'react';
import { matchPath, type RouteObject } from 'react-router-dom';
import { routeDefinitions } from './definitions';
import type { LazyPage } from './pages';
import type { AppRouteDefinition } from './types';

/**
 * 类型守卫：把“可能有 page 的路由”收窄成“一定有 page 的路由”。
 *
 * 为什么需要它：
 * - routeDefinitions 里既有 page 路由，也有 element 路由（例如 Navigate）
 * - 只有 page 路由才有 preload 能力
 * - 经过这个过滤后，TypeScript 才知道后面可以安全访问 route.page.preload
 */
function hasPreloadablePage(
  route: AppRouteDefinition,
): route is AppRouteDefinition & { page: LazyPage } {
  return Boolean(route.page);
}

/**
 * 把一条声明式路由定义转换成真正可渲染的 React 节点。
 *
 * 转换规则：
 * 1. 如果本身就写了 element，直接返回（例如 Navigate 重定向）
 * 2. 如果写的是 page，则先生成 <page.Component />
 * 3. 如果同时配置了 wrap，就再套一层守卫或容器
 */
function createRouteElement(route: AppRouteDefinition): ReactNode {
  if (route.element) {
    return route.element;
  }

  if (!route.page) {
    throw new Error(`[router] Missing page or element for path: ${route.path}`);
  }

  const pageElement = <route.page.Component />;
  return route.wrap ? route.wrap(pageElement) : pageElement;
}

/**
 * 所有支持 preload 的页面路由。
 *
 * 这里会把纯 element 路由过滤掉，因为它们没有页面 chunk，自然也不需要 preload。
 */
const preloadableRoutes = routeDefinitions.filter(hasPreloadablePage);

/**
 * 静态路由 preload 表。
 *
 * 例如：
 * - /login
 * - /home
 * - /profile
 *
 * 这些 path 没有动态参数，可以直接 O(1) 查表命中。
 */
const staticRoutePreloadMap: Record<string, () => void> = Object.fromEntries(
  preloadableRoutes
    .filter((route) => !route.path.includes(':'))
    .map((route) => [route.path, route.page.preload]),
);

/**
 * 动态路由 preload 列表。
 *
 * 例如：
 * - /employee-detail/:id
 *
 * 这类路由不能直接用字符串精确匹配，所以放到单独列表里，
 * 在静态路由未命中时，再用 react-router 的 matchPath 做兜底匹配。
 */
const dynamicRoutePreloadEntries = preloadableRoutes.filter((route) =>
  route.path.includes(':'),
);

/**
 * 按“即将跳转到的真实路径”查找对应页面的 preload 函数。
 *
 * 查找顺序：
 * 1. 先查静态路由表，速度最快
 * 2. 静态未命中，再匹配动态路由
 * 3. 还找不到就返回 undefined，表示这个路径没有配置 preload
 *
 * 使用方：
 * - useAnimatedNavigate 在 navigate 前调用它
 * - 找到后立即执行 preload，让 chunk 下载和页面转场动画并行进行
 */
export function getRoutePreload(path: string): (() => void) | undefined {
  const staticPreload = staticRoutePreloadMap[path];
  if (staticPreload) {
    return staticPreload;
  }

  return dynamicRoutePreloadEntries.find((route) => (
    matchPath({ path: route.path, end: true }, path)
  ))?.page.preload;
}

/**
 * 提供给 App.tsx 的最终路由配置。
 *
 * App.tsx 不需要知道 pages / guards / definitions 的细节，
 * 只需要消费这一份标准 RouteObject[] 即可。
 */
export const routeConfig: RouteObject[] = routeDefinitions.map((route) => ({
  path: route.path,
  element: createRouteElement(route),
}));
