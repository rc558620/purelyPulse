// 下拉刷新加载更多组件的公共类型定义
import React, { type RefObject } from 'react';

/** 刷新区当前状态 */
export type RefreshStatus = 'idle' | 'pulling' | 'armed' | 'refreshing' | 'success' | 'error';

/** 加载更多区当前状态 */
export type LoadMoreStatus = 'idle' | 'loading' | 'error';

export interface PullRefreshTextConfig {
  /** 空闲刷新文案 */
  idleRefreshText: string;
  /** 下拉中刷新文案 */
  pullingText: string;
  /** 达到阈值后的刷新文案 */
  releaseToRefreshText: string;
  /** 刷新中的文案 */
  refreshingText: string;
  /** 刷新成功文案 */
  refreshSuccessText: string;
  /** 刷新失败文案 */
  refreshErrorText: string;
  /** 加载更多中的文案 */
  loadingMoreText: string;
  /** 空闲加载更多文案 */
  loadMoreIdleText: string;
  /** 加载更多失败文案 */
  loadMoreErrorText: string;
  /** 已全部加载完成文案 */
  allLoadedText: string;
  /** 回到顶部按钮文案 */
  backToTopText: string;
}

export interface PullRefreshLoadMoreProps {
  /** 滚动区内容 */
  children: React.ReactNode;
  /** 组件外层样式类名 */
  className?: string;
  /** 内容区样式类名 */
  contentClassName?: string;
  /** 下拉刷新回调 */
  onRefresh?: () => Promise<unknown> | unknown;
  /** 上拉加载更多回调 */
  onLoadMore?: () => Promise<unknown> | unknown;
  /** 是否仍有更多数据 */
  hasMore?: boolean;
  /** 是否整体禁用交互 */
  disabled?: boolean;
  /** 触发刷新的位移阈值 */
  refreshThreshold?: number;
  /** 下拉位移最大距离 */
  maxPullDistance?: number;
  /** 刷新锁定时的吸附距离 */
  refreshHoldDistance?: number;
  /** 加载更多触发阈值 */
  loadMoreThreshold?: number;
  /** 是否启用鼠标拖拽刷新 */
  enableMouseDrag?: boolean;
  /** 是否显示回到顶部按钮 */
  showBackToTop?: boolean;
  /** 回到顶部按钮显示阈值 */
  backToTopThreshold?: number;
  /** 刷新成功提示停留时长 */
  successDuration?: number;
  /** 刷新失败提示停留时长 */
  errorDuration?: number;
  /** 下拉中提示文案 */
  pullingText?: string;
  /** 松手刷新提示文案 */
  releaseToRefreshText?: string;
  /** 刷新中提示文案 */
  refreshingText?: string;
  /** 刷新成功提示文案 */
  refreshSuccessText?: string;
  /** 刷新失败提示文案 */
  refreshErrorText?: string;
  /** 空闲刷新提示文案 */
  idleRefreshText?: string;
  /** 加载更多进行中文案 */
  loadingMoreText?: string;
  /** 空闲加载更多文案 */
  loadMoreIdleText?: string;
  /** 加载更多失败文案 */
  loadMoreErrorText?: string;
  /** 全部加载完成文案 */
  allLoadedText?: string;
  /** 回到顶部按钮文案 */
  backToTopText?: string;
  /** 外部触发回到顶部的信号，变化时会立即跳到顶部 */
  scrollToTopTrigger?: string | number;
  /** 调试日志标签，同时启用 console/performance 调试埋点 */
  debugLabel?: string;
}

export interface PullRefreshLoadMoreController {
  /** 滚动容器引用 */
  containerRef: RefObject<HTMLDivElement | null>;
  /** 内容容器引用 */
  contentRef: RefObject<HTMLDivElement | null>;
  /** 底部加载更多区域引用 */
  footerRef: RefObject<HTMLDivElement | null>;
  /** 当前是否正在拖拽 */
  dragging: boolean;
  /** 当前刷新状态 */
  refreshStatus: RefreshStatus;
  /** 当前加载更多状态 */
  loadMoreStatus: LoadMoreStatus;
  /** 刷新提示是否可见 */
  refreshIndicatorVisible: boolean;
  /** 刷新提示是否固定显示 */
  refreshIndicatorPinned: boolean;
  /** 回到顶部按钮是否可见 */
  backToTopVisible: boolean;
  /** 主动触发刷新 */
  requestRefresh: () => Promise<void>;
  /** 主动触发加载更多 */
  requestLoadMore: () => Promise<void>;
  /** 滚动到顶部，可指定滚动行为 */
  scrollToTop: (behavior?: ScrollBehavior) => void;
}
