// 管理下拉刷新手势、刷新状态机与滚动锁切换
import { useCallback, useEffect, useMemo, useRef, useState, type RefObject } from 'react';
import { safeNum } from '@utils/utils';
import type { RefreshStatus } from '../PullRefreshLoadMore.types';

interface UsePullRefreshGestureOptions {
  /** 滚动容器引用 */
  containerRef: RefObject<HTMLDivElement | null>;
  /** 内容容器引用 */
  contentRef: RefObject<HTMLDivElement | null>;
  /** 下拉刷新回调 */
  onRefresh?: () => Promise<unknown> | unknown;
  /** 是否禁用 */
  disabled: boolean;
  /** 刷新触发阈值 */
  refreshThreshold: number;
  /** 下拉最大距离 */
  maxPullDistance: number;
  /** 刷新保持距离 */
  refreshHoldDistance: number;
  /** 是否启用鼠标拖拽 */
  enableMouseDrag: boolean;
  /** 成功提示停留时长 */
  successDuration: number;
  /** 失败提示停留时长 */
  errorDuration: number;
  /** 调试标签 */
  debugLabel?: string;
}

interface UsePullRefreshGestureResult {
  /** 当前是否正在拖拽 */
  dragging: boolean;
  /** 当前刷新状态 */
  refreshStatus: RefreshStatus;
  /** 刷新提示是否显示 */
  refreshIndicatorVisible: boolean;
  /** 刷新提示是否固定 */
  refreshIndicatorPinned: boolean;
  /** 主动触发刷新 */
  requestRefresh: () => Promise<void>;
}

interface GestureSnapshot {
  active: boolean;
  startY: number;
}

type GestureInputSource = 'touch' | 'mouse';

interface DragPerfSession {
  source: GestureInputSource;
  startTime: number;
  frameCount: number;
  totalFrameDelta: number;
  lastFrameTime: number | null;
  minFrameDelta: number;
  maxFrameDelta: number;
  longTaskCount: number;
  totalLongTaskDuration: number;
  maxLongTaskDuration: number;
  frameLoopId: number | null;
  longTaskObserver: PerformanceObserver | null;
}

interface GestureUiState {
  pullDistance: number;
  dragging: boolean;
  refreshStatus: RefreshStatus;
  transitionDurationMs: number;
}

const INTERACTIVE_SELECTOR = [
  'button',
  'a',
  'input',
  'textarea',
  'select',
  'label',
  '[role="button"]',
  '[data-pull-ignore="true"]',
].join(',');

const RESET_TRANSITION_DURATION_MS = 220;

const isElement = (value: EventTarget | null): value is Element => value instanceof Element;

const shouldIgnoreTarget = (target: EventTarget | null): boolean =>
  isElement(target) && target.closest(INTERACTIVE_SELECTOR) !== null;

const applyResistance = (delta: number, maxPullDistance: number): number => {
  if (delta <= 0) {
    return 0;
  }

  if (delta <= maxPullDistance) {
    return delta * 0.72;
  }

  return maxPullDistance * 0.72 + (delta - maxPullDistance) * 0.18;
};

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

const logPullRefreshDebug = (
  debugLabel: string | undefined,
  stage: string,
  payload?: Record<string, unknown>,
): void => {
  void debugLabel;
  void stage;
  void payload;
};

export const usePullRefreshGesture = ({
  containerRef,
  contentRef,
  onRefresh,
  disabled,
  refreshThreshold,
  maxPullDistance,
  refreshHoldDistance,
  enableMouseDrag,
  successDuration,
  errorDuration,
  debugLabel,
}: UsePullRefreshGestureOptions): UsePullRefreshGestureResult => {
  const [dragging, setDragging] = useState(false);
  const [refreshStatus, setRefreshStatus] = useState<RefreshStatus>('idle');
  const mountedRef = useRef(true);
  const mousePointerIdRef = useRef<number | null>(null);
  const refreshFeedbackTimerRef = useRef<number | null>(null);
  const gestureScrollLockedRef = useRef(false);
  const gestureRef = useRef<GestureSnapshot>({ active: false, startY: 0 });
  const pullDistanceRef = useRef(0);
  const draggingRef = useRef(false);
  const refreshStatusRef = useRef<RefreshStatus>('idle');
  const dragPerfSessionRef = useRef<DragPerfSession | null>(null);
  const refreshMeasureIdRef = useRef(0);
  const refreshMeasurePrefix = useMemo(
    () => (debugLabel ? `PullRefreshLoadMore:${debugLabel}:refresh` : ''),
    [debugLabel],
  );

  const applyContentOffset = useCallback((pullDistance: number, transitionDurationMs: number): void => {
    const node = contentRef.current;
    if (!node) {
      return;
    }

    node.style.setProperty('--pull-refresh-offset', `${pullDistance}px`);
    node.style.setProperty('--pull-refresh-transition-duration', `${transitionDurationMs}ms`);
  }, [contentRef]);

  const syncGestureUi = useCallback((nextState: GestureUiState): void => {
    pullDistanceRef.current = nextState.pullDistance;
    applyContentOffset(nextState.pullDistance, nextState.transitionDurationMs);

    if (draggingRef.current !== nextState.dragging) {
      draggingRef.current = nextState.dragging;
      setDragging(nextState.dragging);
    }

    if (refreshStatusRef.current !== nextState.refreshStatus) {
      refreshStatusRef.current = nextState.refreshStatus;
      setRefreshStatus(nextState.refreshStatus);
    }
  }, [applyContentOffset]);

  const clearRefreshTimer = useCallback((): void => {
    if (refreshFeedbackTimerRef.current !== null) {
      window.clearTimeout(refreshFeedbackTimerRef.current);
      refreshFeedbackTimerRef.current = null;
    }
  }, []);

  const finalizeDragPerfSession = useCallback((reason: string): void => {
    const perf = getPerformanceApi();
    const session = dragPerfSessionRef.current;
    if (!debugLabel || !perf || !session) {
      dragPerfSessionRef.current = null;
      return;
    }

    if (session.frameLoopId !== null) {
      window.cancelAnimationFrame(session.frameLoopId);
      session.frameLoopId = null;
    }
    session.longTaskObserver?.disconnect();
    dragPerfSessionRef.current = null;

    const durationMs = Math.max(perf.now() - session.startTime, 0);
    const avgFrameDeltaMs = session.frameCount > 0 ? session.totalFrameDelta / session.frameCount : 0;
    const estimatedFps = avgFrameDeltaMs > 0 ? 1000 / avgFrameDeltaMs : 0;

    logPullRefreshDebug(debugLabel, 'drag performance summary', {
      source: session.source,
      reason,
      durationMs: Number(durationMs.toFixed(2)),
      sampledFrames: session.frameCount,
      estimatedFps: Number(estimatedFps.toFixed(2)),
      avgFrameDeltaMs: Number(avgFrameDeltaMs.toFixed(2)),
      minFrameDeltaMs: session.minFrameDelta === Number.POSITIVE_INFINITY ? 0 : Number(session.minFrameDelta.toFixed(2)),
      maxFrameDeltaMs: Number(session.maxFrameDelta.toFixed(2)),
      longTaskCount: session.longTaskCount,
      totalLongTaskMs: Number(session.totalLongTaskDuration.toFixed(2)),
      maxLongTaskMs: Number(session.maxLongTaskDuration.toFixed(2)),
    });
  }, [debugLabel]);

  const startDragPerfSession = useCallback((source: GestureInputSource): void => {
    const perf = getPerformanceApi();
    if (!debugLabel || !perf) {
      return;
    }

    finalizeDragPerfSession('restart');

    const session: DragPerfSession = {
      source,
      startTime: perf.now(),
      frameCount: 0,
      totalFrameDelta: 0,
      lastFrameTime: null,
      minFrameDelta: Number.POSITIVE_INFINITY,
      maxFrameDelta: 0,
      longTaskCount: 0,
      totalLongTaskDuration: 0,
      maxLongTaskDuration: 0,
      frameLoopId: null,
      longTaskObserver: null,
    };

    const sampleFrame = (timestamp: number): void => {
      const activeSession = dragPerfSessionRef.current;
      if (activeSession !== session) {
        return;
      }

      if (session.lastFrameTime !== null) {
        const frameDelta = Math.max(timestamp - session.lastFrameTime, 0);
        session.frameCount += 1;
        session.totalFrameDelta += frameDelta;
        session.minFrameDelta = Math.min(session.minFrameDelta, frameDelta);
        session.maxFrameDelta = Math.max(session.maxFrameDelta, frameDelta);
      }

      session.lastFrameTime = timestamp;
      session.frameLoopId = window.requestAnimationFrame(sampleFrame);
    };

    session.frameLoopId = window.requestAnimationFrame(sampleFrame);

    if (supportsPerformanceEntryType('longtask')) {
      session.longTaskObserver = new window.PerformanceObserver((entryList) => {
        entryList.getEntries().forEach((entry) => {
          session.longTaskCount += 1;
          session.totalLongTaskDuration += entry.duration;
          session.maxLongTaskDuration = Math.max(session.maxLongTaskDuration, entry.duration);
        });
      });

      session.longTaskObserver.observe({ entryTypes: ['longtask'] });
    }

    dragPerfSessionRef.current = session;
    logPullRefreshDebug(debugLabel, 'drag performance session start', {
      source,
      longTaskObserverEnabled: supportsPerformanceEntryType('longtask'),
    });
  }, [debugLabel, finalizeDragPerfSession]);

  const lockScrollForGesture = useCallback((): void => {
    const node = containerRef.current;
    if (!node || gestureScrollLockedRef.current) {
      return;
    }

    gestureScrollLockedRef.current = true;
    node.style.overflowY = 'hidden';
    node.style.overscrollBehaviorY = 'none';
    node.style.setProperty('-webkit-overflow-scrolling', 'auto');
    logPullRefreshDebug(debugLabel, 'refresh gesture lock-scroll');
  }, [containerRef, debugLabel]);

  const unlockScrollForGesture = useCallback((): void => {
    const node = containerRef.current;
    if (!node || !gestureScrollLockedRef.current) {
      return;
    }

    gestureScrollLockedRef.current = false;
    node.style.overflowY = '';
    node.style.overscrollBehaviorY = '';
    node.style.removeProperty('-webkit-overflow-scrolling');
    logPullRefreshDebug(debugLabel, 'refresh gesture unlock-scroll');
  }, [containerRef, debugLabel]);

  useEffect(() => {
    applyContentOffset(0, RESET_TRANSITION_DURATION_MS);
  }, [applyContentOffset]);

  useEffect(() => {
    if (!debugLabel || !refreshMeasurePrefix || !supportsPerformanceEntryType('measure')) {
      return undefined;
    }

    const perf = getPerformanceApi();
    if (!perf) {
      return undefined;
    }

    const observer = new window.PerformanceObserver((entryList) => {
      entryList.getEntries().forEach((entry) => {
        if (!entry.name.startsWith(refreshMeasurePrefix)) {
          return;
        }

        logPullRefreshDebug(debugLabel, 'refresh callback measure', {
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
  }, [debugLabel, refreshMeasurePrefix]);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      clearRefreshTimer();
      finalizeDragPerfSession('unmount');
      unlockScrollForGesture();
      applyContentOffset(0, 0);
    };
  }, [applyContentOffset, clearRefreshTimer, finalizeDragPerfSession, unlockScrollForGesture]);

  const finishRefresh = useCallback((nextStatus: Extract<RefreshStatus, 'success' | 'error'>): void => {
    if (!mountedRef.current) {
      return;
    }

    const feedbackDuration = nextStatus === 'success'
      ? successDuration
      : Math.max(errorDuration, 48);

    clearRefreshTimer();
    syncGestureUi({
      pullDistance: refreshHoldDistance,
      dragging: false,
      refreshStatus: nextStatus,
      transitionDurationMs: RESET_TRANSITION_DURATION_MS,
    });
    refreshFeedbackTimerRef.current = window.setTimeout(() => {
      if (!mountedRef.current) {
        return;
      }
      syncGestureUi({
        pullDistance: 0,
        dragging: false,
        refreshStatus: 'idle',
        transitionDurationMs: RESET_TRANSITION_DURATION_MS,
      });
    }, feedbackDuration);
  }, [clearRefreshTimer, errorDuration, refreshHoldDistance, successDuration, syncGestureUi]);

  const requestRefresh = useCallback(async (): Promise<void> => {
    if (!onRefresh || disabled || refreshStatusRef.current === 'refreshing') {
      return;
    }

    const perf = getPerformanceApi();
    const measureName = refreshMeasurePrefix ? `${refreshMeasurePrefix}:${refreshMeasureIdRef.current + 1}` : '';
    const startMark = measureName ? `${measureName}:start` : '';
    const endMark = measureName ? `${measureName}:end` : '';

    clearRefreshTimer();
    syncGestureUi({
      pullDistance: refreshHoldDistance,
      dragging: false,
      refreshStatus: 'refreshing',
      transitionDurationMs: RESET_TRANSITION_DURATION_MS,
    });

    if (perf && measureName) {
      refreshMeasureIdRef.current += 1;
      perf.mark(startMark);
    }

    try {
      await Promise.resolve(onRefresh());
      if (!mountedRef.current) {
        return;
      }
      if (perf && measureName) {
        perf.mark(endMark);
        perf.measure(measureName, startMark, endMark);
        perf.clearMarks(startMark);
        perf.clearMarks(endMark);
      }
      finishRefresh('success');
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
      finishRefresh('error');
    }
  }, [clearRefreshTimer, disabled, finishRefresh, onRefresh, refreshHoldDistance, refreshMeasurePrefix, syncGestureUi]);

  const resetGesture = useCallback((): void => {
    gestureRef.current = { active: false, startY: 0 };
    mousePointerIdRef.current = null;
    unlockScrollForGesture();
    finalizeDragPerfSession('cancelled');
    syncGestureUi({
      pullDistance: 0,
      dragging: false,
      refreshStatus: 'idle',
      transitionDurationMs: RESET_TRANSITION_DURATION_MS,
    });
    logPullRefreshDebug(debugLabel, 'refresh gesture reset');
  }, [debugLabel, finalizeDragPerfSession, syncGestureUi, unlockScrollForGesture]);

  const beginGesture = useCallback((clientY: number, target: EventTarget | null, source: GestureInputSource): boolean => {
    const node = containerRef.current;
    const scrollTop = safeNum(node?.scrollTop);
    const nearTopThreshold = 48;

    if (!node || disabled || !onRefresh || refreshStatusRef.current === 'refreshing' || shouldIgnoreTarget(target)) {
      return false;
    }

    if (scrollTop > nearTopThreshold) {
      return false;
    }

    if (scrollTop > 0) {
      node.scrollTop = 0;
    }

    clearRefreshTimer();
    gestureRef.current = { active: true, startY: clientY };
    lockScrollForGesture();
    startDragPerfSession(source);
    logPullRefreshDebug(debugLabel, 'refresh gesture begin', {
      source,
      startY: safeNum(clientY),
      scrollTop,
    });
    return true;
  }, [clearRefreshTimer, containerRef, debugLabel, disabled, lockScrollForGesture, onRefresh, startDragPerfSession]);

  const updateGesture = useCallback((clientY: number, event: Event): void => {
    if (!gestureRef.current.active || disabled || !onRefresh) {
      return;
    }

    const nextDistance = applyResistance(clientY - gestureRef.current.startY, maxPullDistance);
    if (nextDistance <= 0) {
      unlockScrollForGesture();
      syncGestureUi({
        pullDistance: 0,
        dragging: false,
        refreshStatus: 'idle',
        transitionDurationMs: 0,
      });
      return;
    }

    const nextStatus: RefreshStatus = nextDistance >= refreshThreshold ? 'armed' : 'pulling';

    lockScrollForGesture();
    syncGestureUi({
      pullDistance: nextDistance,
      dragging: true,
      refreshStatus: nextStatus,
      transitionDurationMs: 0,
    });
    event.preventDefault();
  }, [disabled, lockScrollForGesture, maxPullDistance, onRefresh, refreshThreshold, syncGestureUi, unlockScrollForGesture]);

  const endGesture = useCallback((): void => {
    if (!gestureRef.current.active) {
      return;
    }

    gestureRef.current.active = false;
    unlockScrollForGesture();

    if (!draggingRef.current) {
      finalizeDragPerfSession('released-without-drag');
      syncGestureUi({
        pullDistance: 0,
        dragging: false,
        refreshStatus: 'idle',
        transitionDurationMs: RESET_TRANSITION_DURATION_MS,
      });
      return;
    }

    if (pullDistanceRef.current >= refreshThreshold) {
      finalizeDragPerfSession('refresh-triggered');
      void requestRefresh();
      return;
    }

    finalizeDragPerfSession('released-before-threshold');
    syncGestureUi({
      pullDistance: 0,
      dragging: false,
      refreshStatus: 'idle',
      transitionDurationMs: RESET_TRANSITION_DURATION_MS,
    });
  }, [finalizeDragPerfSession, refreshThreshold, requestRefresh, syncGestureUi, unlockScrollForGesture]);

  useEffect(() => {
    const node = containerRef.current;
    if (!node) {
      return undefined;
    }

    const touchStartOptions: AddEventListenerOptions = { passive: true, capture: true };
    const touchMoveOptions: AddEventListenerOptions = { passive: false, capture: true };

    const handleTouchStart = (event: TouchEvent): void => {
      const touch = event.touches[0];
      if (!touch) {
        return;
      }
      beginGesture(touch.clientY, event.target, 'touch');
    };

    const handleTouchMove = (event: TouchEvent): void => {
      const touch = event.touches[0];
      if (!touch) {
        return;
      }
      updateGesture(touch.clientY, event);
    };

    const handlePointerDown = (event: PointerEvent): void => {
      if (!enableMouseDrag || event.pointerType !== 'mouse' || event.button !== 0) {
        return;
      }
      if (!beginGesture(event.clientY, event.target, 'mouse')) {
        return;
      }
      mousePointerIdRef.current = event.pointerId;
      if (typeof node.setPointerCapture === 'function') {
        node.setPointerCapture(event.pointerId);
      }
    };

    const handlePointerMove = (event: PointerEvent): void => {
      if (!enableMouseDrag || event.pointerType !== 'mouse' || mousePointerIdRef.current !== event.pointerId) {
        return;
      }
      updateGesture(event.clientY, event);
    };

    const handlePointerUp = (event: PointerEvent): void => {
      if (event.pointerType !== 'mouse' || mousePointerIdRef.current !== event.pointerId) {
        return;
      }
      if (typeof node.releasePointerCapture === 'function') {
        node.releasePointerCapture(event.pointerId);
      }
      endGesture();
    };

    const handlePointerCancel = (event: PointerEvent): void => {
      if (event.pointerType !== 'mouse' || mousePointerIdRef.current !== event.pointerId) {
        return;
      }
      if (typeof node.releasePointerCapture === 'function') {
        node.releasePointerCapture(event.pointerId);
      }
      resetGesture();
    };

    node.addEventListener('touchstart', handleTouchStart, touchStartOptions);
    node.addEventListener('touchmove', handleTouchMove, touchMoveOptions);
    node.addEventListener('touchend', endGesture, true);
    node.addEventListener('touchcancel', resetGesture, true);
    node.addEventListener('pointerdown', handlePointerDown);
    node.addEventListener('pointermove', handlePointerMove);
    node.addEventListener('pointerup', handlePointerUp);
    node.addEventListener('pointercancel', handlePointerCancel);

    return () => {
      node.removeEventListener('touchstart', handleTouchStart, true);
      node.removeEventListener('touchmove', handleTouchMove, true);
      node.removeEventListener('touchend', endGesture, true);
      node.removeEventListener('touchcancel', resetGesture, true);
      node.removeEventListener('pointerdown', handlePointerDown);
      node.removeEventListener('pointermove', handlePointerMove);
      node.removeEventListener('pointerup', handlePointerUp);
      node.removeEventListener('pointercancel', handlePointerCancel);
    };
  }, [beginGesture, containerRef, enableMouseDrag, endGesture, resetGesture, updateGesture]);

  return {
    dragging,
    refreshStatus,
    refreshIndicatorVisible: dragging || refreshStatus !== 'idle',
    refreshIndicatorPinned: refreshStatus === 'refreshing',
    requestRefresh,
  };
};
