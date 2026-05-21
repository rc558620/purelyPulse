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
import type { ComponentType } from 'react';

/**
 * 创建带 preload() 方法的懒加载组件。
 *
 * 相比简单版本，这里额外做了两件事：
 * 1. promise 缓存：同一个 chunk 只会触发一次网络请求
 * 2. 错误重置：加载失败后清除缓存，下次调用会重新尝试，
 *    避免一次网络抖动后页面永久加载失败
 */
function lazyWithPreload<T extends ComponentType>(
  factory: () => Promise<{ default: T }>,
) {
  let promise: Promise<{ default: T }> | undefined;

  const load = () => {
    promise ??= factory().catch((error) => {
      promise = undefined;
      throw error;
    });
    return promise;
  };

  const Component = lazy(load);

  const preload = () => {
    void load();
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
  revenueDetail:    lazyWithPreload(() => import('../pages/revenueDetail/revenueDetail')),
  promotionDetail:  lazyWithPreload(() => import('../pages/promotionDetail/promotionDetail')),
  // ─── 会员管理 ───────────────────────────────────────────────────────
  memberPoints: lazyWithPreload(() => import('../pages/memberPoints/memberPoints')),
  partnerBeans: lazyWithPreload(() => import('../pages/partnerBeans/partnerBeans')),
  memberList:   lazyWithPreload(() => import('../pages/memberList/memberList')),
  memberDetail: lazyWithPreload(() => import('../pages/memberDetail/memberDetail')),
  // ─── 用户管理 ───────────────────────────────────────────────────────
  banManagement: lazyWithPreload(() => import('../pages/banManagement/banManagement')),
} as const;
