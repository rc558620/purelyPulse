// 管理加载更多自动触发的 RAF 调度
import { useCallback, useRef, type MutableRefObject } from 'react';

export interface UseLoadMoreAutoSchedulerResult {
  tryAutoLoadMoreRef: MutableRefObject<() => void>;
  cancelScheduledAutoLoad: () => void;
  scheduleTryAutoLoadMore: () => void;
}

export const useLoadMoreAutoScheduler = (): UseLoadMoreAutoSchedulerResult => {
  const autoLoadFrameRef = useRef<number | null>(null);
  const tryAutoLoadMoreRef = useRef<() => void>(() => undefined);

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

  const scheduleTryAutoLoadMore = useCallback((): void => {
    scheduleAutoLoadCheck(() => {
      tryAutoLoadMoreRef.current();
    });
  }, [scheduleAutoLoadCheck]);

  return {
    tryAutoLoadMoreRef,
    cancelScheduledAutoLoad,
    scheduleTryAutoLoadMore,
  };
};
