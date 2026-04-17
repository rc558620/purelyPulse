// usePickerPopup — 弹出型选择器的开/关状态机
// 供 MonthPicker / DayPicker / TimePicker 等共用
//
// 职责：
//   - 管理 visible / isClosing 状态
//   - PC 端支持带动画的关闭（isClosing → animationEnd → unmount）
//   - 移动端直接 setVisible(false)，无需等动画
//   - PC 端点击外部关闭（clickOutside）
//   - ESC 键关闭
import { useState, useCallback, useEffect, useRef, type RefObject } from 'react';

export interface UsePickerPopupOptions {
  isMobile: boolean;
}

export interface UsePickerPopupReturn {
  visible:            boolean;
  isClosing:          boolean;
  wrapperRef:         RefObject<HTMLDivElement | null>;
  handleOpen:         () => void;
  handleClose:        () => void;
  handleAnimationEnd: () => void;
  handleKeyDown:      (e: React.KeyboardEvent) => void;
}

const usePickerPopup = ({ isMobile }: UsePickerPopupOptions): UsePickerPopupReturn => {
  const wrapperRef = useRef<HTMLDivElement | null>(null);

  const [visible,   setVisible]   = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  const handleClose = useCallback(() => {
    if (!isMobile && visible) {
      // PC 端：先触发关闭动画，动画结束后才 unmount
      setIsClosing(true);
    } else {
      setVisible(false);
    }
  }, [isMobile, visible]);

  const handleOpen = useCallback(() => {
    if (visible || isClosing) {
      handleClose();
    } else {
      setIsClosing(false);
      setVisible(true);
    }
  }, [visible, isClosing, handleClose]);

  const handleAnimationEnd = useCallback(() => {
    if (isClosing) {
      setVisible(false);
      setIsClosing(false);
    }
  }, [isClosing]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleOpen();
  }, [handleOpen]);

  // PC 端：点击组件外部时关闭
  useEffect(() => {
    if (isMobile || !visible || isClosing) return;
    const handler = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        handleClose();
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [isMobile, visible, isClosing, handleClose]);

  // ESC 键关闭
  useEffect(() => {
    if (!visible) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [visible, handleClose]);

  return {
    visible,
    isClosing,
    wrapperRef,
    handleOpen,
    handleClose,
    handleAnimationEnd,
    handleKeyDown,
  };
};

export default usePickerPopup;
