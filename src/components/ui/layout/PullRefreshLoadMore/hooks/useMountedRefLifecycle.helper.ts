// 管理 mountedRef 与卸载清理，共享 effect 编排骨架
import { useEffect, useRef, type MutableRefObject } from 'react';

interface UseMountedRefLifecycleOptions {
  /** 组件卸载时需要执行的清理逻辑 */
  onUnmount: () => void;
}

export interface UseMountedRefLifecycleResult {
  /** 标记组件当前是否仍处于挂载状态 */
  mountedRef: MutableRefObject<boolean>;
}

export const useMountedRefLifecycle = ({
  onUnmount,
}: UseMountedRefLifecycleOptions): UseMountedRefLifecycleResult => {
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      onUnmount();
    };
  }, [onUnmount]);

  return {
    mountedRef,
  };
};
