// 管理下拉刷新手势控制器，负责拼装阶段函数与运行时依赖
import { useCallback, type MutableRefObject, type RefObject } from 'react';
import { safeNum } from '@utils/utils';
import type { PullRefreshDebugPayload } from './usePullRefreshDebugReporter';
import type { PullRefreshGestureInputSource } from './usePullRefreshDragPerf';
import {
  type GestureSnapshot,
  type RefreshGestureUiState,
  beginPullRefreshGesture,
  endPullRefreshGesture,
  resetPullRefreshGesture,
  updatePullRefreshGesture,
} from './pullRefreshGestureStage.helper';

export interface PullRefreshGestureController {
  resetGesture: () => void;
  beginGesture: (clientY: number, target: EventTarget | null, source: PullRefreshGestureInputSource) => boolean;
  updateGesture: (clientY: number, event: Event) => void;
  endGesture: () => void;
}

interface UsePullRefreshGestureControllerOptions {
  containerRef: RefObject<HTMLDivElement | null>;
  gestureRef: MutableRefObject<GestureSnapshot>;
  disabled: boolean;
  hasRefreshHandler: boolean;
  maxPullDistance: number;
  refreshThreshold: number;
  clearRefreshTimer: () => void;
  startDragPerfSession: (source: PullRefreshGestureInputSource) => void;
  reportPullRefreshDebug: (stage: string, payload?: PullRefreshDebugPayload) => void;
  captureMousePointer: (pointerId: number) => void;
  lockScrollForGesture: () => void;
  unlockScrollForGesture: () => void;
  syncGestureUi: (state: RefreshGestureUiState) => void;
  releaseMousePointerCapture: () => void;
  clearActiveMousePointer: () => void;
  isRefreshing: () => boolean;
  isDragging: () => boolean;
  finalizeDragPerfSession: (reason: string) => void;
  getPullDistance: () => number;
  requestRefresh: () => Promise<void>;
}

export const usePullRefreshGestureController = ({
  containerRef,
  gestureRef,
  disabled,
  hasRefreshHandler,
  maxPullDistance,
  refreshThreshold,
  clearRefreshTimer,
  startDragPerfSession,
  reportPullRefreshDebug,
  captureMousePointer,
  lockScrollForGesture,
  unlockScrollForGesture,
  syncGestureUi,
  releaseMousePointerCapture,
  clearActiveMousePointer,
  isRefreshing,
  isDragging,
  finalizeDragPerfSession,
  getPullDistance,
  requestRefresh,
}: UsePullRefreshGestureControllerOptions): PullRefreshGestureController => {
  const resetGesture = useCallback((): void => {
    resetPullRefreshGesture({
      gestureRef,
      releaseMousePointerCapture,
      clearActiveMousePointer,
      unlockScrollForGesture,
      finalizeDragPerfSession,
      syncGestureUi,
      reportPullRefreshDebug,
    });
  }, [clearActiveMousePointer, finalizeDragPerfSession, gestureRef, releaseMousePointerCapture, reportPullRefreshDebug, syncGestureUi, unlockScrollForGesture]);

  const beginGesture = useCallback((clientY: number, target: EventTarget | null, source: PullRefreshGestureInputSource): boolean =>
    beginPullRefreshGesture({
      gestureRef,
      containerNode: containerRef.current,
      clientY: safeNum(clientY),
      target,
      source,
      disabled,
      hasRefreshHandler,
      refreshing: isRefreshing(),
      clearRefreshTimer,
      startDragPerfSession,
      reportPullRefreshDebug,
    }),
  [clearRefreshTimer, containerRef, disabled, gestureRef, hasRefreshHandler, isRefreshing, reportPullRefreshDebug, startDragPerfSession]);

  const updateGesture = useCallback((clientY: number, event: Event): void => {
    updatePullRefreshGesture({
      gestureRef,
      clientY: safeNum(clientY),
      event,
      disabled,
      hasRefreshHandler,
      maxPullDistance: safeNum(maxPullDistance),
      refreshThreshold: safeNum(refreshThreshold),
      captureMousePointer,
      lockScrollForGesture,
      unlockScrollForGesture,
      syncGestureUi,
    });
  }, [captureMousePointer, disabled, gestureRef, hasRefreshHandler, lockScrollForGesture, maxPullDistance, refreshThreshold, syncGestureUi, unlockScrollForGesture]);

  const endGesture = useCallback((): void => {
    endPullRefreshGesture({
      gestureRef,
      releaseMousePointerCapture,
      unlockScrollForGesture,
      isDragging,
      finalizeDragPerfSession,
      syncGestureUi,
      getPullDistance,
      refreshThreshold: safeNum(refreshThreshold),
      requestRefresh,
    });
  }, [finalizeDragPerfSession, getPullDistance, gestureRef, isDragging, refreshThreshold, releaseMousePointerCapture, requestRefresh, syncGestureUi, unlockScrollForGesture]);

  return {
    resetGesture,
    beginGesture,
    updateGesture,
    endGesture,
  };
};
