// 管理加载更多的自动触发阈值判断与回调装配
import { useCallback, type MutableRefObject, type RefObject } from 'react';
import { safeNum } from '@utils/utils';
import type { LoadMoreStatus } from '../PullRefreshLoadMore.types';
import type { LoadMoreTriggerSource } from './useLoadMoreLifecycle.helper';
import type { PullRefreshDebugPayload } from './usePullRefreshDebugReporter';

interface UseLoadMoreAutoTriggerOptions {
  /** 滚动容器引用 */
  containerRef: RefObject<HTMLDivElement | null>;
  /** 底部区域引用 */
  footerRef: RefObject<HTMLDivElement | null>;
  /** 加载更多回调 */
  onLoadMore?: () => Promise<unknown> | unknown;
  /** 是否禁用 */
  disabled: boolean;
  /** 是否仍有更多数据 */
  hasMore: boolean;
  /** 自动加载触发阈值 */
  loadMoreThreshold: number;
  /** footer 可见状态 ref */
  footerVisibleRef: MutableRefObject<boolean>;
  /** 当前加载状态 ref */
  loadMoreStatusRef: MutableRefObject<LoadMoreStatus>;
  /** debug 上报 */
  reportPullRefreshDebug: (stage: string, payload?: PullRefreshDebugPayload) => void;
  /** 执行 load more 生命周期 */
  runLoadMore: (source: LoadMoreTriggerSource, onSettled?: () => void) => Promise<void>;
  /** 重新调度自动检测 */
  scheduleTryAutoLoadMore: () => void;
}

interface UseLoadMoreAutoTriggerResult {
  /** 执行一次自动加载判定 */
  tryAutoLoadMore: () => void;
}

const executeTryAutoLoadMore = ({
  containerRef,
  footerRef,
  onLoadMore,
  disabled,
  hasMore,
  loadMoreThreshold,
  footerVisibleRef,
  loadMoreStatusRef,
  reportPullRefreshDebug,
  runLoadMore,
  scheduleTryAutoLoadMore,
}: UseLoadMoreAutoTriggerOptions): void => {
  const containerNode = containerRef.current;
  const footerNode = footerRef.current;
  if (!containerNode || !footerNode || !onLoadMore || disabled || !hasMore) {
    footerVisibleRef.current = false;
    return;
  }

  const remainingDistance = Math.max(
    safeNum(containerNode.scrollHeight) - safeNum(containerNode.scrollTop) - safeNum(containerNode.clientHeight),
    0,
  );
  const normalizedThreshold = safeNum(loadMoreThreshold);
  const footerEntered = remainingDistance <= normalizedThreshold;

  if (!footerEntered) {
    footerVisibleRef.current = false;
    return;
  }

  if (footerVisibleRef.current || loadMoreStatusRef.current === 'loading') {
    return;
  }

  footerVisibleRef.current = true;
  reportPullRefreshDebug('auto load more threshold hit', {
    remainingDistance: Number(safeNum(remainingDistance).toFixed(2)),
    loadMoreThreshold: normalizedThreshold,
  });
  void runLoadMore('auto', scheduleTryAutoLoadMore);
};

export const useLoadMoreAutoTrigger = ({
  containerRef,
  footerRef,
  onLoadMore,
  disabled,
  hasMore,
  loadMoreThreshold,
  footerVisibleRef,
  loadMoreStatusRef,
  reportPullRefreshDebug,
  runLoadMore,
  scheduleTryAutoLoadMore,
}: UseLoadMoreAutoTriggerOptions): UseLoadMoreAutoTriggerResult => {
  const tryAutoLoadMore = useCallback((): void => {
    executeTryAutoLoadMore({
      containerRef,
      footerRef,
      onLoadMore,
      disabled,
      hasMore,
      loadMoreThreshold,
      footerVisibleRef,
      loadMoreStatusRef,
      reportPullRefreshDebug,
      runLoadMore,
      scheduleTryAutoLoadMore,
    });
  }, [containerRef, disabled, footerRef, footerVisibleRef, hasMore, loadMoreStatusRef, loadMoreThreshold, onLoadMore, reportPullRefreshDebug, runLoadMore, scheduleTryAutoLoadMore]);

  return {
    tryAutoLoadMore,
  };
};
