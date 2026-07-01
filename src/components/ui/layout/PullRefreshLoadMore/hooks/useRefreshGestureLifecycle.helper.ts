// 管理下拉刷新的生命周期：刷新回调执行、反馈定时器、状态转移
import { useCallback, useRef, type MutableRefObject } from 'react';
import { safeNum } from '@utils/utils';
import type { RefreshStatus } from '../PullRefreshLoadMore.types';
import { usePullRefreshCallbackPerf } from './usePullRefreshCallbackPerf';
import { PULL_REFRESH_RESET_TRANSITION_MS } from './useRefreshGestureContentApplier.helper';
import type { RefreshGestureUiState } from './useRefreshGestureUiState.helper';
import { useMountedRefLifecycle } from './useMountedRefLifecycle.helper';

interface UseRefreshGestureLifecycleOptions {
  /** 下拉刷新回调 */
  onRefresh?: () => Promise<unknown> | unknown;
  /** 是否禁用 */
  disabled: boolean;
  /** 刷新保持距离 */
  refreshHoldDistance: number;
  /** 成功提示停留时长 */
  successDuration: number;
  /** 失败提示停留时长 */
  errorDuration: number;
  /** 调试标签 */
  debugLabel?: string;
  /** 刷新状态 getter */
  getRefreshStatus: () => RefreshStatus;
  /** 同步 UI 状态并应用内容位移 */
  syncGestureUi: (nextState: RefreshGestureUiState) => void;
}

interface UseRefreshGestureLifecycleResult {
  /** 主动触发刷新 */
  requestRefresh: () => Promise<void>;
  /** 清理刷新反馈定时器 */
  clearRefreshTimer: () => void;
}

export const useRefreshGestureLifecycle = ({
  onRefresh,
  disabled,
  refreshHoldDistance,
  successDuration,
  errorDuration,
  debugLabel,
  getRefreshStatus,
  syncGestureUi,
}: UseRefreshGestureLifecycleOptions): UseRefreshGestureLifecycleResult => {
  const refreshFeedbackTimerRef: MutableRefObject<number | null> = useRef(null);

  const {
    startRefreshMeasure,
    finishRefreshMeasure,
  } = usePullRefreshCallbackPerf({ debugLabel });

  const clearRefreshTimer = useCallback((): void => {
    if (refreshFeedbackTimerRef.current !== null) {
      window.clearTimeout(refreshFeedbackTimerRef.current);
      refreshFeedbackTimerRef.current = null;
    }
  }, []);

  const { mountedRef } = useMountedRefLifecycle({
    onUnmount: clearRefreshTimer,
  });

  const finishRefresh = useCallback((nextStatus: Extract<RefreshStatus, 'success' | 'error'>): void => {
    if (!mountedRef.current) {
      return;
    }

    const feedbackDuration = nextStatus === 'success'
      ? safeNum(successDuration)
      : Math.max(safeNum(errorDuration), 48);

    clearRefreshTimer();
    syncGestureUi({
      pullDistance: refreshHoldDistance,
      dragging: false,
      refreshStatus: nextStatus,
      transitionDurationMs: PULL_REFRESH_RESET_TRANSITION_MS,
    });
    refreshFeedbackTimerRef.current = window.setTimeout(() => {
      if (!mountedRef.current) {
        return;
      }
      syncGestureUi({
        pullDistance: 0,
        dragging: false,
        refreshStatus: 'idle',
        transitionDurationMs: PULL_REFRESH_RESET_TRANSITION_MS,
      });
    }, feedbackDuration);
  }, [clearRefreshTimer, errorDuration, mountedRef, refreshHoldDistance, successDuration, syncGestureUi]);

  const requestRefresh = useCallback(async (): Promise<void> => {
    if (!onRefresh || disabled || getRefreshStatus() === 'refreshing') {
      return;
    }

    const refreshMeasureSession = startRefreshMeasure();

    clearRefreshTimer();
    syncGestureUi({
      pullDistance: refreshHoldDistance,
      dragging: false,
      refreshStatus: 'refreshing',
      transitionDurationMs: PULL_REFRESH_RESET_TRANSITION_MS,
    });

    try {
      await Promise.resolve(onRefresh());
      finishRefreshMeasure(refreshMeasureSession);
      if (!mountedRef.current) {
        return;
      }
      finishRefresh('success');
    } catch {
      finishRefreshMeasure(refreshMeasureSession);
      if (!mountedRef.current) {
        return;
      }
      finishRefresh('error');
    }
  }, [clearRefreshTimer, disabled, finishRefresh, finishRefreshMeasure, getRefreshStatus, mountedRef, onRefresh, refreshHoldDistance, startRefreshMeasure, syncGestureUi]);

  return {
    requestRefresh,
    clearRefreshTimer,
  };
};
