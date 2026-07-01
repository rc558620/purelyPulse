// 管理加载更多 measure observer 与 debug reporter 装配
import type { PullRefreshDebugPayload } from './usePullRefreshDebugReporter';
import type { PullRefreshMeasureSession } from './usePullRefreshMeasureSession';
import { usePullRefreshMeasureReporter } from './usePullRefreshMeasureReporter.helper';

interface UseLoadMoreMeasureReporterOptions {
  /** 调试标签 */
  debugLabel?: string;
}

export interface UseLoadMoreMeasureReporterResult {
  reportPullRefreshDebug: (stage: string, payload?: PullRefreshDebugPayload) => void;
  startMeasureSession: () => PullRefreshMeasureSession | null;
  finishMeasureSession: (session: PullRefreshMeasureSession | null) => void;
}

export const useLoadMoreMeasureReporter = ({
  debugLabel,
}: UseLoadMoreMeasureReporterOptions): UseLoadMoreMeasureReporterResult => {
  return usePullRefreshMeasureReporter({
    debugLabel,
    measureName: 'loadMore',
    reportStage: 'load more callback measure',
  });
};
