// 管理回到顶部按钮的可见性与滚动行为
import { useCallback, useEffect, useRef, useState, type RefObject } from 'react';
import { safeNum } from '@utils/utils';

interface UseBackToTopVisibilityOptions {
  /** 滚动容器引用 */
  containerRef: RefObject<HTMLDivElement | null>;
  /** 回顶按钮显示阈值 */
  threshold: number;
}

interface UseBackToTopVisibilityResult {
  /** 回顶按钮是否可见 */
  backToTopVisible: boolean;
  /** 滚动到顶部，可指定滚动行为 */
  scrollToTop: (behavior?: ScrollBehavior) => void;
}

export const useBackToTopVisibility = ({
  containerRef,
  threshold,
}: UseBackToTopVisibilityOptions): UseBackToTopVisibilityResult => {
  const [backToTopVisible, setBackToTopVisible] = useState(false);
  const backToTopVisibleRef = useRef(false);
  const visibilityFrameRef = useRef<number | null>(null);

  const setBackToTopVisibleSafely = useCallback((nextVisible: boolean): void => {
    backToTopVisibleRef.current = nextVisible;
    setBackToTopVisible((prev) => (prev === nextVisible ? prev : nextVisible));
  }, []);

  const updateVisibility = useCallback((): void => {
    const node = containerRef.current;
    if (!node) {
      return;
    }

    const nextVisible = safeNum(node.scrollTop) >= safeNum(threshold);
    if (backToTopVisibleRef.current === nextVisible) {
      return;
    }

    setBackToTopVisibleSafely(nextVisible);
  }, [containerRef, setBackToTopVisibleSafely, threshold]);

  const scheduleVisibilityUpdate = useCallback((): void => {
    if (visibilityFrameRef.current !== null) {
      return;
    }

    visibilityFrameRef.current = window.requestAnimationFrame(() => {
      visibilityFrameRef.current = null;
      updateVisibility();
    });
  }, [updateVisibility]);

  const scrollToTop = useCallback((behavior: ScrollBehavior = 'smooth'): void => {
    const node = containerRef.current;
    if (!node) {
      return;
    }

    node.scrollTo({ top: 0, behavior });
    setBackToTopVisibleSafely(false);
  }, [containerRef, setBackToTopVisibleSafely]);

  useEffect(() => {
    const node = containerRef.current;
    if (!node) {
      return undefined;
    }

    const handleScroll = (): void => {
      scheduleVisibilityUpdate();
    };

    node.addEventListener('scroll', handleScroll, { passive: true });
    updateVisibility();

    return () => {
      node.removeEventListener('scroll', handleScroll);
      if (visibilityFrameRef.current !== null) {
        window.cancelAnimationFrame(visibilityFrameRef.current);
        visibilityFrameRef.current = null;
      }
    };
  }, [containerRef, scheduleVisibilityUpdate, updateVisibility]);

  return {
    backToTopVisible,
    scrollToTop,
  };
};
