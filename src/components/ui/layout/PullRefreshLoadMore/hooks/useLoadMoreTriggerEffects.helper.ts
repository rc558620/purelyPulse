// 管理加载更多链路中的副作用编排：ref 同步、无更多数据重置与滚动监听
import { useEffect, type MutableRefObject, type RefObject } from 'react';
import type { LoadMoreStatus } from '../PullRefreshLoadMore.types';

interface UseLoadMoreTriggerEffectsOptions {
  /** 滚动容器引用 */
  containerRef: RefObject<HTMLDivElement | null>;
  /** 是否仍有更多数据 */
  hasMore: boolean;
  /** footer 可见状态 ref */
  footerVisibleRef: MutableRefObject<boolean>;
  /** 当前加载状态 ref */
  loadMoreStatusRef: MutableRefObject<LoadMoreStatus>;
  /** tryAutoLoadMore 存根 ref */
  tryAutoLoadMoreRef: MutableRefObject<() => void>;
  /** 自动加载检测函数 */
  tryAutoLoadMore: () => void;
  /** 取消已调度的自动加载 */
  cancelScheduledAutoLoad: () => void;
  /** 调度一次自动加载检测 */
  scheduleTryAutoLoadMore: () => void;
  /** 安全更新加载状态 */
  setLoadMoreStatusSafely: (status: LoadMoreStatus) => void;
}

export const useLoadMoreTriggerEffects = ({
  containerRef,
  hasMore,
  footerVisibleRef,
  loadMoreStatusRef,
  tryAutoLoadMoreRef,
  tryAutoLoadMore,
  cancelScheduledAutoLoad,
  scheduleTryAutoLoadMore,
  setLoadMoreStatusSafely,
}: UseLoadMoreTriggerEffectsOptions): void => {
  useEffect(() => {
    tryAutoLoadMoreRef.current = tryAutoLoadMore;
  }, [tryAutoLoadMore, tryAutoLoadMoreRef]);

  useEffect(() => {
    if (!hasMore && loadMoreStatusRef.current !== 'loading') {
      footerVisibleRef.current = false;
      const rafId = window.requestAnimationFrame(() => {
        setLoadMoreStatusSafely('idle');
      });

      return () => {
        window.cancelAnimationFrame(rafId);
      };
    }

    return undefined;
  }, [footerVisibleRef, hasMore, loadMoreStatusRef, setLoadMoreStatusSafely]);

  useEffect(() => {
    const node = containerRef.current;
    if (!node) {
      return undefined;
    }

    const handleScroll = (): void => {
      scheduleTryAutoLoadMore();
    };

    node.addEventListener('scroll', handleScroll, { passive: true });
    scheduleTryAutoLoadMore();

    return () => {
      node.removeEventListener('scroll', handleScroll);
      cancelScheduledAutoLoad();
    };
  }, [cancelScheduledAutoLoad, containerRef, scheduleTryAutoLoadMore]);
};
