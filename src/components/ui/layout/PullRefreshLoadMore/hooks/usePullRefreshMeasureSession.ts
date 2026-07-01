// 管理 PullRefreshLoadMore 回调 measure 会话的统一生命周期
import { useCallback, useRef } from 'react';
import { usePullRefreshPerfRuntime } from './usePullRefreshPerfRuntime';

export interface PullRefreshMeasureSession {
  measureName: string;
  startMark: string;
  endMark: string;
}

interface UsePullRefreshMeasureSessionOptions {
  /** measure 名称前缀 */
  measurePrefix: string;
}

export const createPullRefreshMeasurePrefix = (debugLabel: string | undefined, measureName: string): string => {
  if (!debugLabel || !measureName) {
    return '';
  }

  return `PullRefreshLoadMore:${debugLabel}:${measureName}`;
};

interface UsePullRefreshMeasureSessionResult {
  /** 创建并启动一次新的 measure 会话 */
  startMeasureSession: () => PullRefreshMeasureSession | null;
  /** 结束一次 measure 会话并写入 Performance.measure */
  finishMeasureSession: (session: PullRefreshMeasureSession | null) => void;
}

export const usePullRefreshMeasureSession = ({
  measurePrefix,
}: UsePullRefreshMeasureSessionOptions): UsePullRefreshMeasureSessionResult => {
  const measureIdRef = useRef(0);
  const { getPerformanceApi } = usePullRefreshPerfRuntime();

  const startMeasureSession = useCallback((): PullRefreshMeasureSession | null => {
    const perf = getPerformanceApi();
    if (!perf || !measurePrefix) {
      return null;
    }

    const nextMeasureId = measureIdRef.current + 1;
    measureIdRef.current = nextMeasureId;

    const measureName = `${measurePrefix}:${nextMeasureId}`;
    const startMark = `${measureName}:start`;
    const endMark = `${measureName}:end`;

    perf.mark(startMark);

    return {
      measureName,
      startMark,
      endMark,
    };
  }, [getPerformanceApi, measurePrefix]);

  const finishMeasureSession = useCallback((session: PullRefreshMeasureSession | null): void => {
    if (!session) {
      return;
    }

    const perf = getPerformanceApi();
    if (!perf) {
      return;
    }

    perf.mark(session.endMark);
    perf.measure(session.measureName, session.startMark, session.endMark);
    perf.clearMarks(session.startMark);
    perf.clearMarks(session.endMark);
  }, [getPerformanceApi]);

  return {
    startMeasureSession,
    finishMeasureSession,
  };
};
