// 聚合下拉刷新、加载更多与回到顶部的编排 hook
import { useRef } from 'react';
import type { PullRefreshLoadMoreController } from './PullRefreshLoadMore.types';
import { useBackToTopVisibility } from './hooks/useBackToTopVisibility';
import { useLoadMoreTrigger } from './hooks/useLoadMoreTrigger';
import { usePullRefreshGesture } from './hooks/usePullRefreshGesture';

interface UsePullRefreshLoadMoreOptions {
  /** 下拉刷新回调 */
  onRefresh?: () => Promise<unknown> | unknown;
  /** 上拉加载更多回调 */
  onLoadMore?: () => Promise<unknown> | unknown;
  /** 是否仍有更多数据 */
  hasMore: boolean;
  /** 是否禁用 */
  disabled?: boolean;
  /** 刷新触发阈值 */
  refreshThreshold?: number;
  /** 下拉最大距离 */
  maxPullDistance?: number;
  /** 刷新保持距离 */
  refreshHoldDistance?: number;
  /** 自动加载触发阈值 */
  loadMoreThreshold?: number;
  /** 是否启用鼠标拖拽刷新 */
  enableMouseDrag?: boolean;
  /** 成功提示停留时长 */
  successDuration?: number;
  /** 失败提示停留时长 */
  errorDuration?: number;
  /** 回顶按钮显示阈值 */
  backToTopThreshold?: number;
  /** 调试标签 */
  debugLabel?: string;
}

export const usePullRefreshLoadMore = ({
  onRefresh,
  onLoadMore,
  hasMore,
  disabled = false,
  refreshThreshold = 72,
  maxPullDistance = 160,
  refreshHoldDistance = 64,
  loadMoreThreshold = 96,
  enableMouseDrag = true,
  successDuration = 720,
  errorDuration = 1100,
  backToTopThreshold = 360,
  debugLabel,
}: UsePullRefreshLoadMoreOptions): PullRefreshLoadMoreController => {
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const footerRef = useRef<HTMLDivElement>(null);

  const {
    dragging,
    refreshStatus,
    refreshIndicatorVisible,
    refreshIndicatorPinned,
    requestRefresh,
  } = usePullRefreshGesture({
    containerRef,
    contentRef,
    onRefresh,
    disabled,
    refreshThreshold,
    maxPullDistance,
    refreshHoldDistance,
    enableMouseDrag,
    successDuration,
    errorDuration,
    debugLabel,
  });

  const { loadMoreStatus, requestLoadMore } = useLoadMoreTrigger({
    containerRef,
    footerRef,
    onLoadMore,
    hasMore,
    disabled,
    loadMoreThreshold,
    debugLabel,
  });

  const { backToTopVisible, scrollToTop } = useBackToTopVisibility({
    containerRef,
    threshold: backToTopThreshold,
  });

  return {
    containerRef,
    contentRef,
    footerRef,
    dragging,
    refreshStatus,
    loadMoreStatus,
    refreshIndicatorVisible,
    refreshIndicatorPinned,
    backToTopVisible,
    requestRefresh,
    requestLoadMore,
    scrollToTop,
  };
};
