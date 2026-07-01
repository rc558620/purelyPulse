// 管理下拉刷新手势事件编排，并委托 pointer capture / scroll lock / refresh state / drag perf 子模块
import { useEffect, useRef, type RefObject } from 'react';
import { safeNum } from '@utils/utils';
import type { RefreshStatus } from '../PullRefreshLoadMore.types';
import { useRefreshGestureState } from './useRefreshGestureState';
import { useGesturePointerCapture } from './useGesturePointerCapture';
import { useGestureScrollLock } from './useGestureScrollLock';
import { usePullRefreshDebugReporter } from './usePullRefreshDebugReporter';
import { usePullRefreshDragPerf } from './usePullRefreshDragPerf';
import { bindPullRefreshGestureEvents } from './pullRefreshGestureBinder.helper';
import { usePullRefreshGestureController } from './pullRefreshGestureController.helper';
import {
  createIdleGestureSnapshot,
  type GestureSnapshot,
} from './pullRefreshGestureStage.helper';

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
  const gestureRef = useRef<GestureSnapshot>(createIdleGestureSnapshot());
  const normalizedRefreshThreshold = safeNum(refreshThreshold);
  const normalizedMaxPullDistance = safeNum(maxPullDistance);
  const { reportPullRefreshDebug } = usePullRefreshDebugReporter({ debugLabel });

  const {
    dragging,
    refreshStatus,
    refreshIndicatorVisible,
    refreshIndicatorPinned,
    syncGestureUi,
    clearRefreshTimer,
    isRefreshing,
    isDragging,
    getPullDistance,
    requestRefresh,
  } = useRefreshGestureState({
    contentRef,
    onRefresh,
    disabled,
    refreshHoldDistance,
    successDuration,
    errorDuration,
    debugLabel,
  });

  const {
    setActiveMousePointerId,
    matchesActiveMousePointer,
    captureMousePointer,
    releaseMousePointerCapture,
    clearActiveMousePointer,
  } = useGesturePointerCapture({ containerRef });

  const {
    lockScrollForGesture,
    unlockScrollForGesture,
  } = useGestureScrollLock({
    containerRef,
    debugLabel,
  });

  const {
    startDragPerfSession,
    finalizeDragPerfSession,
  } = usePullRefreshDragPerf({ debugLabel });

  const gestureController = usePullRefreshGestureController({
    containerRef,
    gestureRef,
    disabled,
    hasRefreshHandler: Boolean(onRefresh),
    maxPullDistance: normalizedMaxPullDistance,
    refreshThreshold: normalizedRefreshThreshold,
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
  });

  useEffect(() => () => {
    clearRefreshTimer();
    releaseMousePointerCapture();
    unlockScrollForGesture();
  }, [clearRefreshTimer, releaseMousePointerCapture, unlockScrollForGesture]);

  useEffect(() => {
    const node = containerRef.current;
    if (!node) {
      return undefined;
    }

    return bindPullRefreshGestureEvents({
      containerNode: node,
      enableMouseDrag,
      gestureController,
      setActiveMousePointerId,
      matchesActiveMousePointer,
      clearActiveMousePointer,
    });
  }, [clearActiveMousePointer, containerRef, enableMouseDrag, gestureController, matchesActiveMousePointer, setActiveMousePointerId]);

  return {
    dragging,
    refreshStatus,
    refreshIndicatorVisible,
    refreshIndicatorPinned,
    requestRefresh,
  };
};
