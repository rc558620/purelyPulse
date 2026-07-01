// 管理加载更多触发、状态反馈与底部可见检测（装配层）
import { useCallback, type RefObject } from 'react';
import { safeNum } from '@utils/utils';
import type { LoadMoreStatus } from '../PullRefreshLoadMore.types';
import { useLoadMoreAutoScheduler } from './useLoadMoreAutoScheduler.helper';
import { useLoadMoreAutoTrigger } from './useLoadMoreAutoTrigger.helper';
import { useLoadMoreLifecycle } from './useLoadMoreLifecycle.helper';
import { useLoadMoreMeasureReporter } from './useLoadMoreMeasureReporter.helper';
import { useLoadMoreStatusState } from './useLoadMoreStatusState.helper';
import { useLoadMoreTriggerEffects } from './useLoadMoreTriggerEffects.helper';
import { useMountedRefLifecycle } from './useMountedRefLifecycle.helper';

interface UseLoadMoreTriggerOptions {
  /** 滚动容器引用 */
  containerRef: RefObject<HTMLDivElement | null>;
  /** 底部区域引用 */
  footerRef: RefObject<HTMLDivElement | null>;
  /** 加载更多回调 */
  onLoadMore?: () => Promise<unknown> | unknown;
  /** 是否仍有更多数据 */
  hasMore: boolean;
  /** 是否禁用 */
  disabled: boolean;
  /** 自动加载触发阈值 */
  loadMoreThreshold: number;
  /** 调试标签 */
  debugLabel?: string;
}

interface UseLoadMoreTriggerResult {
  /** 当前加载更多状态 */
  loadMoreStatus: LoadMoreStatus;
  /** 主动触发加载更多 */
  requestLoadMore: () => Promise<void>;
}

export const useLoadMoreTrigger = ({
  containerRef,
  footerRef,
  onLoadMore,
  hasMore,
  disabled,
  loadMoreThreshold,
  debugLabel,
}: UseLoadMoreTriggerOptions): UseLoadMoreTriggerResult => {
  const normalizedLoadMoreThreshold = safeNum(loadMoreThreshold);
  const {
    loadMoreStatus,
    footerVisibleRef,
    loadMoreStatusRef,
    loadMoreDebugStatsRef,
    setLoadMoreStatusSafely,
  } = useLoadMoreStatusState();
  const {
    reportPullRefreshDebug,
    startMeasureSession,
    finishMeasureSession,
  } = useLoadMoreMeasureReporter({ debugLabel });
  const {
    tryAutoLoadMoreRef,
    cancelScheduledAutoLoad,
    scheduleTryAutoLoadMore,
  } = useLoadMoreAutoScheduler();
  const { mountedRef } = useMountedRefLifecycle({
    onUnmount: cancelScheduledAutoLoad,
  });
  const { runLoadMore } = useLoadMoreLifecycle({
    onLoadMore,
    disabled,
    hasMore,
    mountedRef,
    footerVisibleRef,
    loadMoreStatusRef,
    loadMoreDebugStatsRef,
    setLoadMoreStatusSafely,
    reportPullRefreshDebug,
    startMeasureSession,
    finishMeasureSession,
  });
  const { tryAutoLoadMore } = useLoadMoreAutoTrigger({
    containerRef,
    footerRef,
    onLoadMore,
    disabled,
    hasMore,
    loadMoreThreshold: normalizedLoadMoreThreshold,
    footerVisibleRef,
    loadMoreStatusRef,
    reportPullRefreshDebug,
    runLoadMore,
    scheduleTryAutoLoadMore,
  });

  useLoadMoreTriggerEffects({
    containerRef,
    hasMore,
    footerVisibleRef,
    loadMoreStatusRef,
    tryAutoLoadMoreRef,
    tryAutoLoadMore,
    cancelScheduledAutoLoad,
    scheduleTryAutoLoadMore,
    setLoadMoreStatusSafely,
  });

  const requestLoadMore = useCallback(async (): Promise<void> => {
    await runLoadMore('manual', scheduleTryAutoLoadMore);
  }, [runLoadMore, scheduleTryAutoLoadMore]);

  return {
    loadMoreStatus,
    requestLoadMore,
  };
};
