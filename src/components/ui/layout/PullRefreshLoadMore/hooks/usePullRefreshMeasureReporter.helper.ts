// 管理 PullRefreshLoadMore measure reporter 的共享装配骨架
import { useCallback } from 'react';
import {
  usePullRefreshDebugReporter,
  type PullRefreshDebugPayload,
} from './usePullRefreshDebugReporter';
import {
  usePullRefreshMeasureObserverReporter,
  type PullRefreshMeasureReportPayload,
} from './usePullRefreshMeasureObserverReporter';
import {
  createPullRefreshMeasurePrefix,
  usePullRefreshMeasureSession,
  type PullRefreshMeasureSession,
} from './usePullRefreshMeasureSession';

interface UsePullRefreshMeasureReporterOptions {
  /** 调试标签 */
  debugLabel?: string;
  /** measure 名称 */
  measureName: string;
  /** observer 上报阶段名 */
  reportStage: string;
}

export interface UsePullRefreshMeasureReporterResult {
  /** 调试上报出口 */
  reportPullRefreshDebug: (stage: string, payload?: PullRefreshDebugPayload) => void;
  /** 开始一次 measure 会话 */
  startMeasureSession: () => PullRefreshMeasureSession | null;
  /** 完成一次 measure 会话 */
  finishMeasureSession: (session: PullRefreshMeasureSession | null) => void;
}

export const usePullRefreshMeasureReporter = ({
  debugLabel,
  measureName,
  reportStage,
}: UsePullRefreshMeasureReporterOptions): UsePullRefreshMeasureReporterResult => {
  const measurePrefix = createPullRefreshMeasurePrefix(debugLabel, measureName);
  const { reportPullRefreshDebug } = usePullRefreshDebugReporter({ debugLabel });
  const { startMeasureSession, finishMeasureSession } = usePullRefreshMeasureSession({
    measurePrefix,
  });

  const handleMeasureReport = useCallback((payload: PullRefreshMeasureReportPayload): void => {
    reportPullRefreshDebug(reportStage, payload);
  }, [reportPullRefreshDebug, reportStage]);

  usePullRefreshMeasureObserverReporter({
    measurePrefix,
    onReportMeasure: handleMeasureReport,
  });

  return {
    reportPullRefreshDebug,
    startMeasureSession,
    finishMeasureSession,
  };
};
