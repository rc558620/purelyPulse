/**
 * router 对外出口。
 *
 * 把 definitions / pages / guards 组装成真正可运行的路由能力，对外暴露：
 * - routeConfig：给 App.tsx 渲染 <Routes> 使用
 * - getRoutePreload：给 useAnimatedNavigate 在跳转前预加载页面 chunk 使用
 * - idlePreloadRoutePaths：给 RouteIdlePreloader 空闲预热使用
 * - preloadRoutes：批量触发 preload（去重 + 跳过当前路由）
 */

import type { ReactNode } from 'react';
import { matchPath, type RouteObject, type To } from 'react-router-dom';
import { routeDefinitions } from './definitions';
import { ROUTE_PATHS } from './paths';
import type { LazyPage } from './pages';
import type { AppRouteDefinition } from './types';

function hasPreloadablePage(
  route: AppRouteDefinition,
): route is AppRouteDefinition & { page: LazyPage } {
  return Boolean(route.page);
}

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

const preloadableRoutes = routeDefinitions.filter(hasPreloadablePage);

const staticRoutePreloadMap: Record<string, () => void> = Object.fromEntries(
  preloadableRoutes
    .filter((route) => !route.path.includes(':'))
    .map((route) => [route.path, route.page.preload]),
);

const dynamicRoutePreloadEntries = preloadableRoutes.filter((route) =>
  route.path.includes(':'),
);

function stripSearchAndHash(path: string): string {
  const separatorIndex = path.search(/[?#]/);
  const pathname = separatorIndex >= 0 ? path.slice(0, separatorIndex) : path;
  if (!pathname) return '/';
  return pathname.startsWith('/') ? pathname : `/${pathname}`;
}

function normalizeRoutePath(to: To): string {
  if (typeof to !== 'string') {
    return stripSearchAndHash(to.pathname ?? '');
  }
  if (/^[a-z][a-z\d+.-]*:/i.test(to)) {
    try {
      return stripSearchAndHash(new URL(to).pathname);
    } catch {
      return stripSearchAndHash(to);
    }
  }
  return stripSearchAndHash(to);
}

export function getRoutePreload(path: To): (() => void) | undefined {
  const normalizedPath = normalizeRoutePath(path);
  const staticPreload = staticRoutePreloadMap[normalizedPath];
  if (staticPreload) {
    return staticPreload;
  }
  return dynamicRoutePreloadEntries.find((route) => (
    matchPath({ path: route.path, end: true }, normalizedPath)
  ))?.page.preload;
}

/**
 * 空闲时预加载的高频路由列表。
 * RouteIdlePreloader 会在浏览器空闲期批量触发这些页面的 chunk 下载。
 */
export const idlePreloadRoutePaths = [
  ROUTE_PATHS.home,
  ROUTE_PATHS.partnerReview,
  ROUTE_PATHS.partnerPayout,
  ROUTE_PATHS.revenueDetail,
  ROUTE_PATHS.promotionDetail,
] as const;

/**
 * 批量 preload 路由，自动跳过当前路由和重复项。
 */
export function preloadRoutes(paths: readonly To[], currentPath?: To): void {
  const currentNormalizedPath = currentPath ? normalizeRoutePath(currentPath) : undefined;
  const seen = new Set<string>();
  paths.forEach((path) => {
    const normalizedPath = normalizeRoutePath(path);
    if (normalizedPath === currentNormalizedPath || seen.has(normalizedPath)) {
      return;
    }
    seen.add(normalizedPath);
    getRoutePreload(normalizedPath)?.();
  });
}

export const routeConfig: RouteObject[] = routeDefinitions.map((route) => ({
  path: route.path,
  element: createRouteElement(route),
}));
