// 管理下拉刷新内容容器的 CSS 变量同步
import { useCallback, useEffect, type RefObject } from 'react';
import { safeNum } from '@utils/utils';

export const PULL_REFRESH_RESET_TRANSITION_MS = 220;

interface UseRefreshGestureContentApplierOptions {
  contentRef: RefObject<HTMLDivElement | null>;
}

interface UseRefreshGestureContentApplierResult {
  /** 应用下拉位移和过渡时长到 DOM */
  applyContentOffset: (pullDistance: number, transitionDurationMs: number) => void;
}

export const useRefreshGestureContentApplier = ({
  contentRef,
}: UseRefreshGestureContentApplierOptions): UseRefreshGestureContentApplierResult => {
  const applyContentOffset = useCallback((pullDistance: number, transitionDurationMs: number): void => {
    const node = contentRef.current;
    if (!node) {
      return;
    }

    node.style.setProperty('--pull-refresh-offset', `${safeNum(pullDistance)}px`);
    node.style.setProperty('--pull-refresh-transition-duration', `${safeNum(transitionDurationMs)}ms`);
  }, [contentRef]);

  // 初始化及卸载时重置
  useEffect(() => {
    applyContentOffset(0, PULL_REFRESH_RESET_TRANSITION_MS);
  }, [applyContentOffset]);

  useEffect(() => {
    return () => {
      applyContentOffset(0, 0);
    };
  }, [applyContentOffset]);

  return {
    applyContentOffset,
  };
};
