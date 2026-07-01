// 管理下拉刷新的 UI 状态 (dragging / refreshStatus) 及计算衍生值
import { useCallback, useRef } from 'react';
import { safeNum } from '@utils/utils';
import type { RefreshStatus } from '../PullRefreshLoadMore.types';
import { useRefBackedState } from './useRefBackedState.helper';

export interface RefreshGestureUiState {
  pullDistance: number;
  dragging: boolean;
  refreshStatus: RefreshStatus;
  transitionDurationMs: number;
}

interface UseRefreshGestureUiStateResult {
  /** 当前是否正在拖拽 */
  dragging: boolean;
  /** 当前刷新状态 */
  refreshStatus: RefreshStatus;
  /** 刷新提示是否显示 */
  refreshIndicatorVisible: boolean;
  /** 刷新提示是否固定 */
  refreshIndicatorPinned: boolean;
  /** 同步 UI 状态 (dragging / refreshStatus) */
  syncRefreshUiState: (nextState: RefreshGestureUiState) => void;
  /** 当前是否处于刷新中 */
  isRefreshing: () => boolean;
  /** 当前是否处于拖拽中 */
  isDragging: () => boolean;
  /** 获取当前下拉位移 */
  getPullDistance: () => number;
  /** 获取当前刷新状态 (ref 实时值) */
  getRefreshStatus: () => RefreshStatus;
}

export const useRefreshGestureUiState = (): UseRefreshGestureUiStateResult => {
  const pullDistanceRef = useRef(0);
  const {
    value: dragging,
    setValueSafely: setDraggingSafely,
    getValue: getDragging,
  } = useRefBackedState(false);
  const {
    value: refreshStatus,
    valueRef: refreshStatusRef,
    setValueSafely: setRefreshStatusSafely,
    getValue: getRefreshStatus,
  } = useRefBackedState<RefreshStatus>('idle');

  const syncRefreshUiState = useCallback((nextState: RefreshGestureUiState): void => {
    pullDistanceRef.current = safeNum(nextState.pullDistance);
    setDraggingSafely(nextState.dragging);
    setRefreshStatusSafely(nextState.refreshStatus);
  }, [setDraggingSafely, setRefreshStatusSafely]);

  const isRefreshing = useCallback((): boolean => refreshStatusRef.current === 'refreshing', [refreshStatusRef]);
  const isDragging = useCallback((): boolean => getDragging(), [getDragging]);
  const getPullDistance = useCallback((): number => safeNum(pullDistanceRef.current), []);

  return {
    dragging,
    refreshStatus,
    refreshIndicatorVisible: dragging || refreshStatus !== 'idle',
    refreshIndicatorPinned: refreshStatus === 'refreshing',
    syncRefreshUiState,
    isRefreshing,
    isDragging,
    getPullDistance,
    getRefreshStatus,
  };
};
