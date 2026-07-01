// 管理下拉刷新回调 measure 与调试埋点
import type { PullRefreshMeasureSession } from './usePullRefreshMeasureSession';
import { usePullRefreshMeasureReporter } from './usePullRefreshMeasureReporter.helper';

interface UsePullRefreshCallbackPerfOptions {
  /** 调试标签 */
  debugLabel?: string;
}

interface UsePullRefreshCallbackPerfResult {
  /** 标记一次新的刷新回调测量开始 */
  startRefreshMeasure: () => PullRefreshMeasureSession | null;
  /** 结束当前刷新回调测量并写入 measure */
  finishRefreshMeasure: (session: PullRefreshMeasureSession | null) => void;
}

export const usePullRefreshCallbackPerf = ({
  debugLabel,
}: UsePullRefreshCallbackPerfOptions): UsePullRefreshCallbackPerfResult => {
  const {
    startMeasureSession,
    finishMeasureSession,
  } = usePullRefreshMeasureReporter({
    debugLabel,
    measureName: 'refresh',
    reportStage: 'refresh callback measure',
  });

  return {
    startRefreshMeasure: startMeasureSession,
    finishRefreshMeasure: finishMeasureSession,
  };
};
