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

/** easeInOutCubic 缓动，跨平台一致的平滑滚动体验 */
const easeInOutCubic = (t: number): number =>
  t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

/** 根据滚动距离动态计算动画时长，上限 600ms */
const computeDuration = (distance: number): number =>
  Math.min(600, Math.max(200, Math.sqrt(distance) * 12));

export const useBackToTopVisibility = ({
  containerRef,
  threshold,
}: UseBackToTopVisibilityOptions): UseBackToTopVisibilityResult => {
  const [backToTopVisible, setBackToTopVisible] = useState(false);
  const backToTopVisibleRef = useRef(false);
  const visibilityFrameRef = useRef<number | null>(null);
  const scrollAnimFrameRef = useRef<number | null>(null);

  const cancelScrollAnimation = useCallback((): void => {
    if (scrollAnimFrameRef.current !== null) {
      cancelAnimationFrame(scrollAnimFrameRef.current);
      scrollAnimFrameRef.current = null;
    }
  }, []);

  /**
   * 基于 requestAnimationFrame 的跨平台平滑滚动。
   * 替代原生 scrollTo({ behavior: 'smooth' })——
   * 后者在 Windows 浏览器的 overflow:auto div 容器上可能静默失效。
   */
  const animateScrollToTop = useCallback((node: HTMLElement): void => {
    cancelScrollAnimation();

    const startY = node.scrollTop;
    if (startY === 0) return;

    const duration = computeDuration(startY);
    const startTime = performance.now();

    const step = (now: number): void => {
      const elapsed = now - startTime;
      // clamp 到 [0,1]：防御 rAF 时间戳与 performance.now() 时钟基准不一致（如 jsdom）导致 progress 为负
      const progress = Math.min(Math.max(elapsed / duration, 0), 1);
      node.scrollTop = startY * (1 - easeInOutCubic(progress));

      if (progress < 1) {
        scrollAnimFrameRef.current = requestAnimationFrame(step);
      } else {
        node.scrollTop = 0;
        scrollAnimFrameRef.current = null;
      }
    };

    scrollAnimFrameRef.current = requestAnimationFrame(step);
  }, [cancelScrollAnimation]);

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

    if (behavior === 'auto') {
      cancelScrollAnimation();
      node.scrollTop = 0;
      setBackToTopVisibleSafely(false);
      return;
    }

    // smooth：使用 rAF 动画，确保 Windows / Mac / Linux 行为一致
    // 动画过程中 scroll 事件自然驱动按钮可见性，无需提前隐藏
    animateScrollToTop(node);
  }, [containerRef, setBackToTopVisibleSafely, cancelScrollAnimation, animateScrollToTop]);

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
      cancelScrollAnimation();
    };
  }, [containerRef, scheduleVisibilityUpdate, updateVisibility, cancelScrollAnimation]);

  return {
    backToTopVisible,
    scrollToTop,
  };
};
