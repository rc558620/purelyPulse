// 管理 PullRefreshLoadMore measure 观察与上报的统一逻辑
import { useEffect } from 'react';
import { safeNum } from '@utils/utils';
import type { PullRefreshDebugPayload } from './usePullRefreshDebugReporter';
import { usePullRefreshPerfRuntime } from './usePullRefreshPerfRuntime';

export interface PullRefreshMeasureReportPayload extends PullRefreshDebugPayload {
  name: string;
  durationMs: number;
}

interface UsePullRefreshMeasureObserverReporterOptions {
  /** measure 名称前缀 */
  measurePrefix: string;
  /** 消费一次 measure 上报结果 */
  onReportMeasure: (payload: PullRefreshMeasureReportPayload) => void;
}

export const usePullRefreshMeasureObserverReporter = ({
  measurePrefix,
  onReportMeasure,
}: UsePullRefreshMeasureObserverReporterOptions): void => {
  const { getPerformanceApi, supportsPerformanceEntryType } = usePullRefreshPerfRuntime();

  useEffect(() => {
    if (!measurePrefix || !supportsPerformanceEntryType('measure')) {
      return undefined;
    }

    const perf = getPerformanceApi();
    if (!perf) {
      return undefined;
    }

    const observer = new window.PerformanceObserver((entryList) => {
      entryList.getEntries().forEach((entry) => {
        if (!entry.name.startsWith(measurePrefix)) {
          return;
        }

        onReportMeasure({
          name: entry.name,
          durationMs: Number(safeNum(entry.duration).toFixed(2)),
        });
        perf.clearMeasures(entry.name);
      });
    });

    observer.observe({ entryTypes: ['measure'] });
    return () => {
      observer.disconnect();
    };
  }, [getPerformanceApi, measurePrefix, onReportMeasure, supportsPerformanceEntryType]);
};
