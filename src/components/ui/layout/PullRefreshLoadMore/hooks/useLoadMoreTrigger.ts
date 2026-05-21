// 管理加载更多触发、状态反馈与底部可见检测
import { useCallback, useEffect, useMemo, useRef, useState, type RefObject } from 'react';
import { safeNum } from '@utils/utils';
import type { LoadMoreStatus } from '../PullRefreshLoadMore.types';

interface UseLoadMoreTriggerOptions {
  /** 滚动容器引用 */
  containerRef: RefObject<HTMLDivElement | null>;
  /** 底部区域引用 */
  footerRef: RefObject<HTMLDivElement | null>;
  /** 加载更多回调 */
  onLoadMore?: () => Promise<unknown> | unknown;
  /** 是否仍有更多数据 */
  hasMore: boolean;
  /** 是否禁用 */
  disabled: boolean;
  /** 自动加载触发阈值 */
  loadMoreThreshold: number;
  /** 调试标签 */
  debugLabel?: string;
}

interface UseLoadMoreTriggerResult {
  /** 当前加载更多状态 */
  loadMoreStatus: LoadMoreStatus;
  /** 主动触发加载更多 */
  requestLoadMore: () => Promise<void>;
}

type LoadMoreTriggerSource = 'auto' | 'manual';

interface LoadMoreDebugStats {
  autoTriggerCount: number;
  manualTriggerCount: number;
  successCount: number;
  errorCount: number;
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

const logLoadMoreDebug = (
  debugLabel: string | undefined,
  stage: string,
  payload?: Record<string, unknown>,
): void => {
  void debugLabel;
  void stage;
  void payload;
};

export const useLoadMoreTrigger = ({
  containerRef,
  footerRef,
  onLoadMore,
  hasMore,
  disabled,
  loadMoreThreshold,
  debugLabel,
}: UseLoadMoreTriggerOptions): UseLoadMoreTriggerResult => {
  const [loadMoreStatus, setLoadMoreStatus] = useState<LoadMoreStatus>('idle');
  const mountedRef = useRef(true);
  const footerVisibleRef = useRef(false);
  const loadMoreStatusRef = useRef<LoadMoreStatus>('idle');
  const autoLoadFrameRef = useRef<number | null>(null);
  const tryAutoLoadMoreRef = useRef<() => void>(() => undefined);
  const loadMoreMeasureIdRef = useRef(0);
  const loadMoreDebugStatsRef = useRef<LoadMoreDebugStats>({
    autoTriggerCount: 0,
    manualTriggerCount: 0,
    successCount: 0,
    errorCount: 0,
  });
  const loadMoreMeasurePrefix = useMemo(
    () => (debugLabel ? `PullRefreshLoadMore:${debugLabel}:loadMore` : ''),
    [debugLabel],
  );

  const setLoadMoreStatusSafely = useCallback((status: LoadMoreStatus): void => {
    loadMoreStatusRef.current = status;
    setLoadMoreStatus((prev) => (prev === status ? prev : status));
  }, []);

  const cancelScheduledAutoLoad = useCallback((): void => {
    if (autoLoadFrameRef.current !== null) {
      window.cancelAnimationFrame(autoLoadFrameRef.current);
      autoLoadFrameRef.current = null;
    }
  }, []);

  const scheduleAutoLoadCheck = useCallback((callback: () => void): void => {
    if (autoLoadFrameRef.current !== null) {
      return;
    }

    autoLoadFrameRef.current = window.requestAnimationFrame(() => {
      autoLoadFrameRef.current = null;
      callback();
    });
  }, []);

  useEffect(() => {
    if (!debugLabel || !loadMoreMeasurePrefix || !supportsPerformanceEntryType('measure')) {
      return undefined;
    }

    const perf = getPerformanceApi();
    if (!perf) {
      return undefined;
    }

    const observer = new window.PerformanceObserver((entryList) => {
      entryList.getEntries().forEach((entry) => {
        if (!entry.name.startsWith(loadMoreMeasurePrefix)) {
          return;
        }

        logLoadMoreDebug(debugLabel, 'load more callback measure', {
          name: entry.name,
          durationMs: Number(entry.duration.toFixed(2)),
        });
        perf.clearMeasures(entry.name);
      });
    });

    observer.observe({ entryTypes: ['measure'] });
    return () => {
      observer.disconnect();
    };
  }, [debugLabel, loadMoreMeasurePrefix]);

  const runLoadMore = useCallback(async (source: LoadMoreTriggerSource, onSettled?: () => void): Promise<void> => {
    if (!onLoadMore || disabled || !hasMore || loadMoreStatusRef.current === 'loading') {
      return;
    }

    const perf = getPerformanceApi();
    const stats = loadMoreDebugStatsRef.current;
    if (source === 'auto') {
      stats.autoTriggerCount += 1;
    } else {
      stats.manualTriggerCount += 1;
    }

    const totalTriggerCount = stats.autoTriggerCount + stats.manualTriggerCount;
    const measureName = loadMoreMeasurePrefix ? `${loadMoreMeasurePrefix}:${loadMoreMeasureIdRef.current + 1}` : '';
    const startMark = measureName ? `${measureName}:start` : '';
    const endMark = measureName ? `${measureName}:end` : '';

    logLoadMoreDebug(debugLabel, 'load more trigger', {
      source,
      totalTriggerCount,
      autoTriggerCount: stats.autoTriggerCount,
      manualTriggerCount: stats.manualTriggerCount,
    });

    setLoadMoreStatusSafely('loading');

    if (perf && measureName) {
      loadMoreMeasureIdRef.current += 1;
      perf.mark(startMark);
    }

    try {
      await Promise.resolve(onLoadMore());
      if (!mountedRef.current) {
        return;
      }

      if (perf && measureName) {
        perf.mark(endMark);
        perf.measure(measureName, startMark, endMark);
        perf.clearMarks(startMark);
        perf.clearMarks(endMark);
      }

      stats.successCount += 1;
      setLoadMoreStatusSafely('idle');
      footerVisibleRef.current = false;
      logLoadMoreDebug(debugLabel, 'load more settled', {
        source,
        status: 'success',
        totalTriggerCount,
        autoTriggerCount: stats.autoTriggerCount,
        manualTriggerCount: stats.manualTriggerCount,
        successCount: stats.successCount,
        errorCount: stats.errorCount,
      });
      onSettled?.();
    } catch {
      if (!mountedRef.current) {
        return;
      }

      if (perf && measureName) {
        perf.mark(endMark);
        perf.measure(measureName, startMark, endMark);
        perf.clearMarks(startMark);
        perf.clearMarks(endMark);
      }

      stats.errorCount += 1;
      setLoadMoreStatusSafely('error');
      footerVisibleRef.current = false;
      logLoadMoreDebug(debugLabel, 'load more settled', {
        source,
        status: 'error',
        totalTriggerCount,
        autoTriggerCount: stats.autoTriggerCount,
        manualTriggerCount: stats.manualTriggerCount,
        successCount: stats.successCount,
        errorCount: stats.errorCount,
      });
    }
  }, [debugLabel, disabled, hasMore, loadMoreMeasurePrefix, onLoadMore, setLoadMoreStatusSafely]);

  const scheduleTryAutoLoadMore = useCallback((): void => {
    scheduleAutoLoadCheck(() => {
      tryAutoLoadMoreRef.current();
    });
  }, [scheduleAutoLoadCheck]);

  const tryAutoLoadMore = useCallback((): void => {
    const containerNode = containerRef.current;
    const footerNode = footerRef.current;
    if (!containerNode || !footerNode || !onLoadMore || disabled || !hasMore) {
      footerVisibleRef.current = false;
      return;
    }

    const remainingDistance = Math.max(
      safeNum(containerNode.scrollHeight) - safeNum(containerNode.scrollTop) - safeNum(containerNode.clientHeight),
      0,
    );
    const footerEntered = remainingDistance <= safeNum(loadMoreThreshold);

    if (!footerEntered) {
      footerVisibleRef.current = false;
      return;
    }

    if (footerVisibleRef.current || loadMoreStatusRef.current === 'loading') {
      return;
    }

    footerVisibleRef.current = true;
    logLoadMoreDebug(debugLabel, 'auto load more threshold hit', {
      remainingDistance: Number(remainingDistance.toFixed(2)),
      loadMoreThreshold,
    });
    void runLoadMore('auto', scheduleTryAutoLoadMore);
  }, [containerRef, debugLabel, disabled, footerRef, hasMore, loadMoreThreshold, onLoadMore, runLoadMore, scheduleTryAutoLoadMore]);

  useEffect(() => {
    tryAutoLoadMoreRef.current = tryAutoLoadMore;
  }, [tryAutoLoadMore]);

  const requestLoadMore = useCallback(async (): Promise<void> => {
    await runLoadMore('manual', scheduleTryAutoLoadMore);
  }, [runLoadMore, scheduleTryAutoLoadMore]);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      cancelScheduledAutoLoad();
    };
  }, [cancelScheduledAutoLoad]);

  useEffect(() => {
    if (!hasMore && loadMoreStatusRef.current !== 'loading') {
      footerVisibleRef.current = false;
      const rafId = window.requestAnimationFrame(() => {
        setLoadMoreStatusSafely('idle');
      });

      return () => {
        window.cancelAnimationFrame(rafId);
      };
    }

    return undefined;
  }, [hasMore, setLoadMoreStatusSafely]);

  useEffect(() => {
    const node = containerRef.current;
    if (!node) {
      return undefined;
    }

    const handleScroll = (): void => {
      scheduleTryAutoLoadMore();
    };

    node.addEventListener('scroll', handleScroll, { passive: true });
    scheduleTryAutoLoadMore();

    return () => {
      node.removeEventListener('scroll', handleScroll);
      cancelScheduledAutoLoad();
    };
  }, [cancelScheduledAutoLoad, containerRef, scheduleTryAutoLoadMore]);

  return {
    loadMoreStatus,
    requestLoadMore,
  };
};
