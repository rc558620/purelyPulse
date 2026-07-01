// 管理鼠标拖拽过程中的 pointer capture 生命周期
import { useCallback, useEffect, useRef, type RefObject } from 'react';
import { safeNum } from '@utils/utils';

interface UseGesturePointerCaptureOptions {
  /** 滚动容器引用 */
  containerRef: RefObject<HTMLDivElement | null>;
}

interface UseGesturePointerCaptureResult {
  /** 记录当前激活的鼠标指针 id */
  setActiveMousePointerId: (pointerId: number | null) => void;
  /** 判断当前事件是否来自激活中的鼠标指针 */
  matchesActiveMousePointer: (pointerId: number) => boolean;
  /** 对当前鼠标指针执行 capture */
  captureMousePointer: (pointerId: number) => void;
  /** 释放当前鼠标指针的 capture */
  releaseMousePointerCapture: () => void;
  /** 清空当前激活的鼠标指针 */
  clearActiveMousePointer: () => void;
}

export const useGesturePointerCapture = ({
  containerRef,
}: UseGesturePointerCaptureOptions): UseGesturePointerCaptureResult => {
  const mousePointerIdRef = useRef<number | null>(null);
  const mousePointerCapturedRef = useRef(false);

  const setActiveMousePointerId = useCallback((pointerId: number | null): void => {
    mousePointerIdRef.current = pointerId === null ? null : safeNum(pointerId);
  }, []);

  const matchesActiveMousePointer = useCallback((pointerId: number): boolean => {
    const nextPointerId = safeNum(pointerId);
    return mousePointerIdRef.current !== null && mousePointerIdRef.current === nextPointerId;
  }, []);

  const captureMousePointer = useCallback((pointerId: number): void => {
    const node = containerRef.current;
    if (!node || mousePointerCapturedRef.current || typeof node.setPointerCapture !== 'function') {
      return;
    }

    node.setPointerCapture(safeNum(pointerId));
    mousePointerCapturedRef.current = true;
  }, [containerRef]);

  const releaseMousePointerCapture = useCallback((): void => {
    const node = containerRef.current;
    const pointerId = mousePointerIdRef.current;
    if (!node || pointerId === null || !mousePointerCapturedRef.current || typeof node.releasePointerCapture !== 'function') {
      mousePointerCapturedRef.current = false;
      return;
    }

    node.releasePointerCapture(pointerId);
    mousePointerCapturedRef.current = false;
  }, [containerRef]);

  const clearActiveMousePointer = useCallback((): void => {
    mousePointerIdRef.current = null;
  }, []);

  useEffect(() => () => {
    releaseMousePointerCapture();
    clearActiveMousePointer();
  }, [clearActiveMousePointer, releaseMousePointerCapture]);

  return {
    setActiveMousePointerId,
    matchesActiveMousePointer,
    captureMousePointer,
    releaseMousePointerCapture,
    clearActiveMousePointer,
  };
};
