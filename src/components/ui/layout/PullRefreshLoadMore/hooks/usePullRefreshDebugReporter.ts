// 管理 PullRefreshLoadMore 相关 hooks 的统一调试上报出口
import { useCallback } from 'react';

export interface PullRefreshDebugPayload {
  [key: string]: unknown;
}

interface UsePullRefreshDebugReporterOptions {
  /** 调试标签 */
  debugLabel?: string;
}

interface UsePullRefreshDebugReporterResult {
  /** 上报一次调试事件 */
  reportPullRefreshDebug: (stage: string, payload?: PullRefreshDebugPayload) => void;
}

export const usePullRefreshDebugReporter = ({
  debugLabel,
}: UsePullRefreshDebugReporterOptions): UsePullRefreshDebugReporterResult => {
  const reportPullRefreshDebug = useCallback((stage: string, payload?: PullRefreshDebugPayload): void => {
    void debugLabel;
    void stage;
    void payload;
  }, [debugLabel]);

  return {
    reportPullRefreshDebug,
  };
};
