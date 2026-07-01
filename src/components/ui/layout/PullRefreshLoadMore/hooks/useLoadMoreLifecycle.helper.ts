// 管理加载更多回调生命周期、状态转移与调试上报
import { useCallback, type MutableRefObject } from 'react';
import { safeNum } from '@utils/utils';
import type { LoadMoreStatus } from '../PullRefreshLoadMore.types';
import type { PullRefreshMeasureSession } from './usePullRefreshMeasureSession';
import type { LoadMoreDebugStats } from './useLoadMoreStatusState.helper';
import type { PullRefreshDebugPayload } from './usePullRefreshDebugReporter';

export type LoadMoreTriggerSource = 'auto' | 'manual';

interface UseLoadMoreLifecycleOptions {
  /** 加载更多回调 */
  onLoadMore?: () => Promise<unknown> | unknown;
  /** 是否禁用 */
  disabled: boolean;
  /** 是否仍有更多数据 */
  hasMore: boolean;
  /** mounted 状态 ref */
  mountedRef: MutableRefObject<boolean>;
  /** footer 可见状态 ref */
  footerVisibleRef: MutableRefObject<boolean>;
  /** 当前加载状态 ref */
  loadMoreStatusRef: MutableRefObject<LoadMoreStatus>;
  /** 调试统计 ref */
  loadMoreDebugStatsRef: MutableRefObject<LoadMoreDebugStats>;
  /** 安全更新加载状态 */
  setLoadMoreStatusSafely: (status: LoadMoreStatus) => void;
  /** debug 上报 */
  reportPullRefreshDebug: (stage: string, payload?: PullRefreshDebugPayload) => void;
  /** 开始一次 measure */
  startMeasureSession: () => PullRefreshMeasureSession | null;
  /** 完成一次 measure */
  finishMeasureSession: (session: PullRefreshMeasureSession | null) => void;
}

interface CreateLoadMoreSettledPayloadOptions {
  source: LoadMoreTriggerSource;
  status: 'success' | 'error';
  totalTriggerCount: number;
  stats: LoadMoreDebugStats;
}

interface UseLoadMoreLifecycleResult {
  /** 触发一次 load more 生命周期 */
  runLoadMore: (source: LoadMoreTriggerSource, onSettled?: () => void) => Promise<void>;
}

const createLoadMoreSettledPayload = ({
  source,
  status,
  totalTriggerCount,
  stats,
}: CreateLoadMoreSettledPayloadOptions): PullRefreshDebugPayload => ({
  source,
  status,
  totalTriggerCount: safeNum(totalTriggerCount),
  autoTriggerCount: safeNum(stats.autoTriggerCount),
  manualTriggerCount: safeNum(stats.manualTriggerCount),
  successCount: safeNum(stats.successCount),
  errorCount: safeNum(stats.errorCount),
});

export const useLoadMoreLifecycle = ({
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
}: UseLoadMoreLifecycleOptions): UseLoadMoreLifecycleResult => {
  const runLoadMore = useCallback(async (source: LoadMoreTriggerSource, onSettled?: () => void): Promise<void> => {
    if (!onLoadMore || disabled || !hasMore || loadMoreStatusRef.current === 'loading') {
      return;
    }

    const stats = loadMoreDebugStatsRef.current;
    if (source === 'auto') {
      stats.autoTriggerCount += 1;
    } else {
      stats.manualTriggerCount += 1;
    }

    const totalTriggerCount = safeNum(stats.autoTriggerCount) + safeNum(stats.manualTriggerCount);
    const measureSession = startMeasureSession();

    reportPullRefreshDebug('load more trigger', {
      source,
      totalTriggerCount,
      autoTriggerCount: safeNum(stats.autoTriggerCount),
      manualTriggerCount: safeNum(stats.manualTriggerCount),
    });

    setLoadMoreStatusSafely('loading');

    try {
      await Promise.resolve(onLoadMore());
      if (!mountedRef.current) {
        return;
      }

      finishMeasureSession(measureSession);
      stats.successCount += 1;
      setLoadMoreStatusSafely('idle');
      footerVisibleRef.current = false;
      reportPullRefreshDebug('load more settled', createLoadMoreSettledPayload({
        source,
        status: 'success',
        totalTriggerCount,
        stats,
      }));
      onSettled?.();
    } catch {
      if (!mountedRef.current) {
        return;
      }

      finishMeasureSession(measureSession);
      stats.errorCount += 1;
      setLoadMoreStatusSafely('error');
      footerVisibleRef.current = false;
      reportPullRefreshDebug('load more settled', createLoadMoreSettledPayload({
        source,
        status: 'error',
        totalTriggerCount,
        stats,
      }));
    }
  }, [disabled, finishMeasureSession, hasMore, loadMoreDebugStatsRef, loadMoreStatusRef, mountedRef, onLoadMore, reportPullRefreshDebug, setLoadMoreStatusSafely, startMeasureSession, footerVisibleRef]);

  return {
    runLoadMore,
  };
};
