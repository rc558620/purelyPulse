// 图片查看器：浮层副作用（Esc 关闭 + 方向键切换 + 打开期间锁定页面滚动）
import { useEffect } from 'react';

export interface UseImageViewerLayerEffectsOptions {
  visible: boolean;
  onClose: () => void;
  /** 方向键左：上一张 */
  onPrev: () => void;
  /** 方向键右：下一张 */
  onNext: () => void;
  /** 是否启用方向键切换（仅多于一张时开启，避免无谓的全局监听） */
  keyboardNavigationEnabled: boolean;
}

/**
 * 仅在可见期间生效：
 * - Esc 键关闭；
 * - 左右方向键切换图片（切换本身带动画，由滑动态负责防叠帧）；
 * - 锁定 body 滚动，卸载时还原锁定前的原始 overflow 值，避免覆盖页面自身的滚动设置。
 */
export const useImageViewerLayerEffects = ({
  visible,
  onClose,
  onPrev,
  onNext,
  keyboardNavigationEnabled,
}: UseImageViewerLayerEffectsOptions): void => {
  useEffect(() => {
    if (!visible) return;

    const handleKeyDown = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') {
        onClose();
        return;
      }

      if (!keyboardNavigationEnabled) return;

      if (event.key === 'ArrowLeft') {
        event.preventDefault();
        onPrev();
        return;
      }
      if (event.key === 'ArrowRight') {
        event.preventDefault();
        onNext();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return (): void => window.removeEventListener('keydown', handleKeyDown);
  }, [visible, keyboardNavigationEnabled, onClose, onNext, onPrev]);

  useEffect(() => {
    if (!visible) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return (): void => {
      document.body.style.overflow = originalOverflow;
    };
  }, [visible]);
};
