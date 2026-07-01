// 管理下拉刷新手势期间的滚动锁切换
import { useCallback, useEffect, useRef, type RefObject } from 'react';
import { usePullRefreshDebugReporter } from './usePullRefreshDebugReporter';

interface UseGestureScrollLockOptions {
  /** 滚动容器引用 */
  containerRef: RefObject<HTMLDivElement | null>;
  /** 调试标签 */
  debugLabel?: string;
}

interface UseGestureScrollLockResult {
  /** 锁住滚动容器，交由手势层接管 */
  lockScrollForGesture: () => void;
  /** 恢复滚动容器的原始滚动能力 */
  unlockScrollForGesture: () => void;
}

export const useGestureScrollLock = ({
  containerRef,
  debugLabel,
}: UseGestureScrollLockOptions): UseGestureScrollLockResult => {
  const gestureScrollLockedRef = useRef(false);
  const { reportPullRefreshDebug } = usePullRefreshDebugReporter({ debugLabel });

  const lockScrollForGesture = useCallback((): void => {
    const node = containerRef.current;
    if (!node || gestureScrollLockedRef.current) {
      return;
    }

    gestureScrollLockedRef.current = true;
    node.style.overflowY = 'hidden';
    node.style.overscrollBehaviorY = 'none';
    node.style.setProperty('-webkit-overflow-scrolling', 'auto');
    reportPullRefreshDebug('refresh gesture lock-scroll');
  }, [containerRef, reportPullRefreshDebug]);

  const unlockScrollForGesture = useCallback((): void => {
    const node = containerRef.current;
    if (!node || !gestureScrollLockedRef.current) {
      return;
    }

    gestureScrollLockedRef.current = false;
    node.style.overflowY = '';
    node.style.overscrollBehaviorY = '';
    node.style.removeProperty('-webkit-overflow-scrolling');
    reportPullRefreshDebug('refresh gesture unlock-scroll');
  }, [containerRef, reportPullRefreshDebug]);

  useEffect(() => () => {
    unlockScrollForGesture();
  }, [unlockScrollForGesture]);

  return {
    lockScrollForGesture,
    unlockScrollForGesture,
  };
};
