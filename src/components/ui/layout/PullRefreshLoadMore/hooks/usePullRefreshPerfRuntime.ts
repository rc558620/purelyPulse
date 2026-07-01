// 管理 PullRefreshLoadMore 相关 hooks 的共享 Performance Runtime 能力
interface UsePullRefreshPerfRuntimeResult {
  /** 获取浏览器 Performance API 实例 */
  getPerformanceApi: () => Performance | null;
  /** 判断当前环境是否支持指定 entry type */
  supportsPerformanceEntryType: (entryType: string) => boolean;
}

const getPerformanceApi = (): Performance | null => {
  if (typeof window === 'undefined' || typeof window.performance === 'undefined') {
    return null;
  }

  return window.performance;
};

const isPerformanceObserverSupported = (): boolean => typeof window !== 'undefined' && 'PerformanceObserver' in window;

const supportsPerformanceEntryType = (entryType: string): boolean => {
  if (!isPerformanceObserverSupported()) {
    return false;
  }

  const observerCtor = window.PerformanceObserver as typeof PerformanceObserver & {
    supportedEntryTypes?: string[];
  };

  return Array.isArray(observerCtor.supportedEntryTypes) && observerCtor.supportedEntryTypes.includes(entryType);
};

export const usePullRefreshPerfRuntime = (): UsePullRefreshPerfRuntimeResult => ({
  getPerformanceApi,
  supportsPerformanceEntryType,
});
