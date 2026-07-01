// 管理下拉刷新手势各阶段的纯编排逻辑
import { safeNum } from '@utils/utils';
import type { RefreshStatus } from '../PullRefreshLoadMore.types';
import type { PullRefreshDebugPayload } from './usePullRefreshDebugReporter';
import type { PullRefreshGestureInputSource } from './usePullRefreshDragPerf';
import { PULL_REFRESH_RESET_TRANSITION_MS } from './useRefreshGestureState';

export interface GestureSnapshot {
  active: boolean;
  startY: number;
}

export interface RefreshGestureUiState {
  pullDistance: number;
  dragging: boolean;
  refreshStatus: RefreshStatus;
  transitionDurationMs: number;
}

interface ResetPullRefreshGestureOptions {
  gestureRef: { current: GestureSnapshot };
  releaseMousePointerCapture: () => void;
  clearActiveMousePointer: () => void;
  unlockScrollForGesture: () => void;
  finalizeDragPerfSession: (reason: string) => void;
  syncGestureUi: (state: RefreshGestureUiState) => void;
  reportPullRefreshDebug: (stage: string, payload?: PullRefreshDebugPayload) => void;
}

interface BeginPullRefreshGestureOptions {
  gestureRef: { current: GestureSnapshot };
  containerNode: HTMLDivElement | null;
  clientY: number;
  target: EventTarget | null;
  source: PullRefreshGestureInputSource;
  disabled: boolean;
  hasRefreshHandler: boolean;
  refreshing: boolean;
  clearRefreshTimer: () => void;
  startDragPerfSession: (source: PullRefreshGestureInputSource) => void;
  reportPullRefreshDebug: (stage: string, payload?: PullRefreshDebugPayload) => void;
}

interface UpdatePullRefreshGestureOptions {
  gestureRef: { current: GestureSnapshot };
  clientY: number;
  event: Event;
  disabled: boolean;
  hasRefreshHandler: boolean;
  maxPullDistance: number;
  refreshThreshold: number;
  captureMousePointer: (pointerId: number) => void;
  lockScrollForGesture: () => void;
  unlockScrollForGesture: () => void;
  syncGestureUi: (state: RefreshGestureUiState) => void;
}

interface EndPullRefreshGestureOptions {
  gestureRef: { current: GestureSnapshot };
  releaseMousePointerCapture: () => void;
  unlockScrollForGesture: () => void;
  isDragging: () => boolean;
  finalizeDragPerfSession: (reason: string) => void;
  syncGestureUi: (state: RefreshGestureUiState) => void;
  getPullDistance: () => number;
  refreshThreshold: number;
  requestRefresh: () => Promise<void>;
}

const INTERACTIVE_SELECTOR = [
  'input',
  'textarea',
  'select',
  'label',
  '[contenteditable="true"]',
  '[data-pull-ignore="true"]',
].join(',');

const NEAR_TOP_THRESHOLD = 48;

const isElement = (value: EventTarget | null): value is Element => value instanceof Element;

// 仅忽略真实文本输入类控件；普通 button 卡片仍应支持拖拽下拉刷新。
const shouldIgnoreTarget = (target: EventTarget | null): boolean =>
  isElement(target) && target.closest(INTERACTIVE_SELECTOR) !== null;

export const createIdleGestureSnapshot = (): GestureSnapshot => ({ active: false, startY: 0 });

const applyResistance = (delta: number, maxPullDistance: number): number => {
  if (delta <= 0) {
    return 0;
  }

  if (delta <= maxPullDistance) {
    return delta * 0.72;
  }

  return maxPullDistance * 0.72 + (delta - maxPullDistance) * 0.18;
};

export const resetPullRefreshGesture = ({
  gestureRef,
  releaseMousePointerCapture,
  clearActiveMousePointer,
  unlockScrollForGesture,
  finalizeDragPerfSession,
  syncGestureUi,
  reportPullRefreshDebug,
}: ResetPullRefreshGestureOptions): void => {
  gestureRef.current = createIdleGestureSnapshot();
  releaseMousePointerCapture();
  clearActiveMousePointer();
  unlockScrollForGesture();
  finalizeDragPerfSession('cancelled');
  syncGestureUi({
    pullDistance: 0,
    dragging: false,
    refreshStatus: 'idle',
    transitionDurationMs: PULL_REFRESH_RESET_TRANSITION_MS,
  });
  reportPullRefreshDebug('refresh gesture reset');
};

export const beginPullRefreshGesture = ({
  gestureRef,
  containerNode,
  clientY,
  target,
  source,
  disabled,
  hasRefreshHandler,
  refreshing,
  clearRefreshTimer,
  startDragPerfSession,
  reportPullRefreshDebug,
}: BeginPullRefreshGestureOptions): boolean => {
  const scrollTop = safeNum(containerNode?.scrollTop);
  if (!containerNode || disabled || !hasRefreshHandler || refreshing || shouldIgnoreTarget(target)) {
    return false;
  }

  if (scrollTop > NEAR_TOP_THRESHOLD) {
    return false;
  }

  if (scrollTop > 0) {
    containerNode.scrollTop = 0;
  }

  clearRefreshTimer();
  gestureRef.current = { active: true, startY: clientY };
  startDragPerfSession(source);
  reportPullRefreshDebug('refresh gesture begin', {
    source,
    startY: safeNum(clientY),
    scrollTop,
  });
  return true;
};

export const updatePullRefreshGesture = ({
  gestureRef,
  clientY,
  event,
  disabled,
  hasRefreshHandler,
  maxPullDistance,
  refreshThreshold,
  captureMousePointer,
  lockScrollForGesture,
  unlockScrollForGesture,
  syncGestureUi,
}: UpdatePullRefreshGestureOptions): void => {
  if (!gestureRef.current.active || disabled || !hasRefreshHandler) {
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

  if (event instanceof PointerEvent && event.pointerType === 'mouse') {
    captureMousePointer(event.pointerId);
  }

  lockScrollForGesture();
  syncGestureUi({
    pullDistance: nextDistance,
    dragging: true,
    refreshStatus: nextStatus,
    transitionDurationMs: 0,
  });
  event.preventDefault();
};

export const endPullRefreshGesture = ({
  gestureRef,
  releaseMousePointerCapture,
  unlockScrollForGesture,
  isDragging,
  finalizeDragPerfSession,
  syncGestureUi,
  getPullDistance,
  refreshThreshold,
  requestRefresh,
}: EndPullRefreshGestureOptions): void => {
  if (!gestureRef.current.active) {
    return;
  }

  gestureRef.current.active = false;
  releaseMousePointerCapture();
  unlockScrollForGesture();

  if (!isDragging()) {
    finalizeDragPerfSession('released-without-drag');
    syncGestureUi({
      pullDistance: 0,
      dragging: false,
      refreshStatus: 'idle',
      transitionDurationMs: PULL_REFRESH_RESET_TRANSITION_MS,
    });
    return;
  }

  if (getPullDistance() >= refreshThreshold) {
    finalizeDragPerfSession('refresh-triggered');
    void requestRefresh();
    return;
  }

  finalizeDragPerfSession('released-before-threshold');
  syncGestureUi({
    pullDistance: 0,
    dragging: false,
    refreshStatus: 'idle',
    transitionDurationMs: PULL_REFRESH_RESET_TRANSITION_MS,
  });
};
