// 管理下拉刷新拖拽过程中的性能采样与调试埋点
import { useCallback, useEffect, useRef } from 'react';
import { safeNum } from '@utils/utils';
import { usePullRefreshDebugReporter } from './usePullRefreshDebugReporter';
import { usePullRefreshPerfRuntime } from './usePullRefreshPerfRuntime';
import {
  buildDragPerfSummary,
  createDragPerfSession,
  type DragPerfSession,
  type PullRefreshGestureInputSource,
} from './usePullRefreshDragPerfSession';
import { startDragPerfSampler, stopDragPerfSampler } from './usePullRefreshDragPerfSampler';

export type { PullRefreshGestureInputSource } from './usePullRefreshDragPerfSession';

interface UsePullRefreshDragPerfOptions {
  /** 调试标签 */
  debugLabel?: string;
}

interface UsePullRefreshDragPerfResult {
  /** 开启一次新的拖拽性能采样会话 */
  startDragPerfSession: (source: PullRefreshGestureInputSource) => void;
  /** 结束当前拖拽性能采样会话 */
  finalizeDragPerfSession: (reason: string) => void;
}

export const usePullRefreshDragPerf = ({
  debugLabel,
}: UsePullRefreshDragPerfOptions): UsePullRefreshDragPerfResult => {
  const dragPerfSessionRef = useRef<DragPerfSession | null>(null);
  const { reportPullRefreshDebug } = usePullRefreshDebugReporter({ debugLabel });
  const { getPerformanceApi, supportsPerformanceEntryType } = usePullRefreshPerfRuntime();

  const finalizeDragPerfSession = useCallback((reason: string): void => {
    const session = dragPerfSessionRef.current;
    if (!session) {
      return;
    }

    stopDragPerfSampler(session);
    dragPerfSessionRef.current = null;

    if (!debugLabel) {
      return;
    }

    const perf = getPerformanceApi();
    if (!perf) {
      return;
    }

    const summary = buildDragPerfSummary({
      session,
      endTime: safeNum(perf.now()),
      reason,
    });

    reportPullRefreshDebug('drag performance summary', { ...summary });
  }, [debugLabel, getPerformanceApi, reportPullRefreshDebug]);

  const startDragPerfSession = useCallback((source: PullRefreshGestureInputSource): void => {
    const perf = getPerformanceApi();
    if (!debugLabel || !perf) {
      return;
    }

    finalizeDragPerfSession('restart');

    const session = createDragPerfSession(source, safeNum(perf.now()));
    const longTaskObserverEnabled = supportsPerformanceEntryType('longtask');
    dragPerfSessionRef.current = session;

    startDragPerfSampler({
      session,
      trackLongTask: longTaskObserverEnabled,
      getActiveSession: () => dragPerfSessionRef.current,
    });

    reportPullRefreshDebug('drag performance session start', {
      source,
      longTaskObserverEnabled,
    });
  }, [debugLabel, finalizeDragPerfSession, getPerformanceApi, reportPullRefreshDebug, supportsPerformanceEntryType]);

  useEffect(() => () => {
    finalizeDragPerfSession('unmount');
  }, [finalizeDragPerfSession]);

  return {
    startDragPerfSession,
    finalizeDragPerfSession,
  };
};
