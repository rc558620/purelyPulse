/**
 * 页面资源层。
 *
 * 这个文件只做一件事：
 * 1. 把每个页面注册成 React.lazy 懒加载组件
 * 2. 给每个懒加载页面补一个 preload() 方法
 *
 * 为什么要单独拆这个文件：
 * - 新增页面时，只需要先来这里注册页面资源
 * - route 定义层只关心“这个 path 对应哪个 page”，不关心懒加载细节
 * - preload 逻辑集中维护，避免散落在各个文件里
 */

import { lazy } from 'react';

/**
 * 创建带 preload() 方法的懒加载组件。
 *
 * 返回结果包含两个能力：
 * - Component：给路由渲染时使用的 React.lazy 组件
 * - preload：在真正进入路由前，提前触发 import() 下载页面 chunk
 *
 * 这里的 preload 可以放心重复调用：
 * - import() 结果会被浏览器缓存
 * - 同一个 chunk 不会因为多次调用而重复下载
 */
function lazyWithPreload<T extends React.ComponentType>(
  factory: () => Promise<{ default: T }>,
) {
  const Component = lazy(factory);

  const preload = () => {
    factory();
  };

  return { Component, preload };
}

/**
 * 单个懒加载页面的统一类型。
 *
 * 结构等价于：
 * {
 *   Component: React.lazy(...) 得到的组件
 *   preload: () => void
 * }
 */
export type LazyPage = ReturnType<typeof lazyWithPreload>;

/**
 * 全部页面资源注册表。
 *
 * key 是项目内部使用的页面名，value 是带 preload 能力的懒加载页面。
 * 后面的 routeDefinitions 只需要引用这里的页面，不需要关心 import 路径。
 *
 * 维护规则：
 * - 新增页面：先在这里加一条
 * - 删除页面：先删这里，再删 definitions 里的路由声明
 * - 这里不放路由 path，只放“页面资源”
 */
export const pages = {
  login:         lazyWithPreload(() => import('../pages/login/login')),
  home:          lazyWithPreload(() => import('../pages/home/home')),
  partnerReview: lazyWithPreload(() => import('../pages/partnerReview/partnerReview')),
  partnerPayout: lazyWithPreload(() => import('../pages/partnerPayout/partnerPayout')),
  revenueDetail:        lazyWithPreload(() => import('../pages/revenueDetail/revenueDetail')),
  promotionRankDetail:  lazyWithPreload(() => import('../pages/promotionDetail/promotionRankDetail')),
  // ─── 会员管理 ───────────────────────────────────────────────────────
  memberPoints: lazyWithPreload(() => import('../pages/memberPoints/memberPoints')),
  partnerBeans: lazyWithPreload(() => import('../pages/partnerBeans/partnerBeans')),
  memberList:   lazyWithPreload(() => import('../pages/memberList/memberList')),
  memberDetail: lazyWithPreload(() => import('../pages/memberList/memberDetail')),
  // ─── 用户管理 ───────────────────────────────────────────────────────
  banManagement: lazyWithPreload(() => import('../pages/banManagement/banManagement')),
} as const;
