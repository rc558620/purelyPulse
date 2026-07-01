// 管理加载更多状态仓与调试计数 refs
import { useRef, type MutableRefObject } from 'react';
import { safeNum } from '@utils/utils';
import type { LoadMoreStatus } from '../PullRefreshLoadMore.types';
import { useRefBackedState } from './useRefBackedState.helper';

export interface LoadMoreDebugStats {
  autoTriggerCount: number;
  manualTriggerCount: number;
  successCount: number;
  errorCount: number;
}

export interface UseLoadMoreStatusStateResult {
  loadMoreStatus: LoadMoreStatus;
  footerVisibleRef: MutableRefObject<boolean>;
  loadMoreStatusRef: MutableRefObject<LoadMoreStatus>;
  loadMoreDebugStatsRef: MutableRefObject<LoadMoreDebugStats>;
  setLoadMoreStatusSafely: (status: LoadMoreStatus) => void;
}

const createInitialLoadMoreDebugStats = (): LoadMoreDebugStats => ({
  autoTriggerCount: safeNum(0),
  manualTriggerCount: safeNum(0),
  successCount: safeNum(0),
  errorCount: safeNum(0),
});

export const useLoadMoreStatusState = (): UseLoadMoreStatusStateResult => {
  const footerVisibleRef = useRef(false);
  const loadMoreDebugStatsRef = useRef<LoadMoreDebugStats>(createInitialLoadMoreDebugStats());
  const {
    value: loadMoreStatus,
    valueRef: loadMoreStatusRef,
    setValueSafely: setLoadMoreStatusSafely,
  } = useRefBackedState<LoadMoreStatus>('idle');

  return {
    loadMoreStatus,
    footerVisibleRef,
    loadMoreStatusRef,
    loadMoreDebugStatsRef,
    setLoadMoreStatusSafely,
  };
};
