// 管理下拉刷新位移、状态机与刷新反馈（装配层）
import type { RefObject } from 'react';
import { safeNum } from '@utils/utils';
import type { RefreshStatus } from '../PullRefreshLoadMore.types';
import { useRefreshGestureUiState, type RefreshGestureUiState } from './useRefreshGestureUiState.helper';
import { useRefreshGestureContentApplier, PULL_REFRESH_RESET_TRANSITION_MS } from './useRefreshGestureContentApplier.helper';
import { useRefreshGestureLifecycle } from './useRefreshGestureLifecycle.helper';

interface UseRefreshGestureStateOptions {
  /** 内容容器引用 */
  contentRef: RefObject<HTMLDivElement | null>;
  /** 下拉刷新回调 */
  onRefresh?: () => Promise<unknown> | unknown;
  /** 是否禁用 */
  disabled: boolean;
  /** 刷新保持距离 */
  refreshHoldDistance: number;
  /** 成功提示停留时长 */
  successDuration: number;
  /** 失败提示停留时长 */
  errorDuration: number;
  /** 调试标签 */
  debugLabel?: string;
}

interface UseRefreshGestureStateResult {
  /** 当前是否正在拖拽 */
  dragging: boolean;
  /** 当前刷新状态 */
  refreshStatus: RefreshStatus;
  /** 刷新提示是否显示 */
  refreshIndicatorVisible: boolean;
  /** 刷新提示是否固定 */
  refreshIndicatorPinned: boolean;
  /** 同步位移与刷新状态到 UI */
  syncGestureUi: (nextState: RefreshGestureUiState) => void;
  /** 清理刷新反馈定时器 */
  clearRefreshTimer: () => void;
  /** 当前是否处于刷新中 */
  isRefreshing: () => boolean;
  /** 当前是否处于拖拽中 */
  isDragging: () => boolean;
  /** 获取当前下拉位移 */
  getPullDistance: () => number;
  /** 主动触发刷新 */
  requestRefresh: () => Promise<void>;
}

export { PULL_REFRESH_RESET_TRANSITION_MS };

export const useRefreshGestureState = ({
  contentRef,
  onRefresh,
  disabled,
  refreshHoldDistance,
  successDuration,
  errorDuration,
  debugLabel,
}: UseRefreshGestureStateOptions): UseRefreshGestureStateResult => {
  // 层 1：UI 状态管理
  const {
    dragging,
    refreshStatus,
    refreshIndicatorVisible,
    refreshIndicatorPinned,
    syncRefreshUiState,
    isRefreshing,
    isDragging,
    getPullDistance,
    getRefreshStatus,
  } = useRefreshGestureUiState();

  // 层 2：DOM 应用
  const { applyContentOffset } = useRefreshGestureContentApplier({ contentRef });

  // 装配：同步 UI + 应用 DOM（归一化参数确保数字合法）
  const syncGestureUi = (nextState: RefreshGestureUiState): void => {
    syncRefreshUiState(nextState);
    applyContentOffset(safeNum(nextState.pullDistance), safeNum(nextState.transitionDurationMs));
  };

  // 层 3：刷新生命周期
  const {
    requestRefresh,
    clearRefreshTimer,
  } = useRefreshGestureLifecycle({
    onRefresh,
    disabled,
    refreshHoldDistance,
    successDuration,
    errorDuration,
    debugLabel,
    getRefreshStatus,
    syncGestureUi,
  });

  return {
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
  };
};
