// 图片查看器：当前图片索引状态与切换边界
import { useCallback, useState } from 'react';
import { safeNum } from '@utils/utils';

export interface UseImageViewerIndexOptions {
  /** 图片总数 */
  total: number;
  /** 打开时定位到第几张 */
  initialIndex: number;
  /** 是否可见：由不可见转可见时重置索引，保证每次打开都从入口那张开始 */
  visible: boolean;
}

export interface UseImageViewerIndexResult {
  /** 当前索引（已确保在 [0, total-1] 内） */
  index: number;
  canPrev: boolean;
  canNext: boolean;
  /**
   * 定位到指定索引（越界自动收敛到 [0, total-1]）。
   * 切换动画结束后由滑动态提交，保证动画期间画面连续。
   */
  goTo: (nextIndex: number) => void;
}

export const useImageViewerIndex = ({
  total,
  initialIndex,
  visible,
}: UseImageViewerIndexOptions): UseImageViewerIndexResult => {
  const [rawIndex, setRawIndex] = useState(0);

  const safeTotal = Math.max(0, safeNum(total));
  const index = Math.min(Math.max(0, rawIndex), Math.max(0, safeTotal - 1));

  // 渲染期重置（React 官方 "adjusting state when a prop changes" 模式）：
  // 不可见转可见、或打开入口图变化时，索引回到入口那张；
  // 替代 effect 中的同步 setState，避免级联渲染。
  // 比较经 safeNum 兜底后的值，防止 NaN 每轮渲染都不相等导致无限重置。
  const nextInitial = Math.max(0, safeNum(initialIndex));
  const [prevAnchor, setPrevAnchor] = useState({ visible, initialIndex: nextInitial });
  if (visible !== prevAnchor.visible || nextInitial !== prevAnchor.initialIndex) {
    setPrevAnchor({ visible, initialIndex: nextInitial });
    if (visible) {
      setRawIndex(nextInitial);
    }
  }

  const goTo = useCallback((nextIndex: number): void => {
    const maxIndex = Math.max(0, safeTotal - 1);
    setRawIndex(Math.min(Math.max(0, safeNum(nextIndex)), maxIndex));
  }, [safeTotal]);

  return {
    index,
    canPrev: safeTotal > 1 && index > 0,
    canNext: safeTotal > 1 && index < safeTotal - 1,
    goTo,
  };
};
