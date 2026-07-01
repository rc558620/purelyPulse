// usePickerPopup — 弹出型选择器的开/关状态机
// 供 MonthPicker / DayPicker / TimePicker 等共用
//
// 职责：
//   - 管理 visible / isClosing 状态
//   - 移动端 & PC 端统一走 isClosing 退场动画，动画/过渡结束后才卸载
//   - 移动端 Trigger 只做打开，关闭由遮罩/取消按钮/ESC 负责
//   - PC 端 Trigger 可 toggle（再次点击关闭）
//   - PC 端点击外部关闭（clickOutside）
//   - ESC 键关闭
import { useState, useCallback, useEffect, useRef, type RefObject } from 'react';

export interface UsePickerPopupOptions {
  isMobile: boolean;
  /** 外部受控 visible（可选） */
  externalVisible?: boolean;
  /** 面板开关变化回调（可选） */
  onVisibleChange?: (visible: boolean) => void;
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

const usePickerPopup = ({ isMobile, externalVisible, onVisibleChange }: UsePickerPopupOptions): UsePickerPopupReturn => {
  const wrapperRef = useRef<HTMLDivElement | null>(null);

  const [visible,   setVisible]   = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  // ── 用 ref 追踪最新状态值，避免 useCallback 闭包陷阱 ──
  const visibleRef   = useRef(visible);
  const isClosingRef = useRef(isClosing);
  visibleRef.current   = visible;
  isClosingRef.current = isClosing;

  // Bug #3 fix: 外部受控 visible 同步
  useEffect(() => {
    if (externalVisible === undefined) return;
    if (externalVisible && !visibleRef.current) {
      setIsClosing(false);
      setVisible(true);
    } else if (!externalVisible && visibleRef.current && !isClosingRef.current) {
      setIsClosing(true);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [externalVisible]);

  // Bug #3 fix: visible 变化时通知外部
  useEffect(() => {
    onVisibleChange?.(visible);
  }, [visible, onVisibleChange]);

  // ── 关闭：走 isClosing 退场动画，动画/过渡结束后由 handleAnimationEnd / onTransitionEnd 卸载 ──
  // 不再依赖 visible 闭包，通过 ref 读取最新值
  const handleClose = useCallback(() => {
    const curVisible   = visibleRef.current;
    const curIsClosing = isClosingRef.current;
    if (!curVisible || curIsClosing) return;
    // 移动端 & PC 端统一：先触发退场动画，动画结束后才卸载
    setIsClosing(true);
  }, []);

  // BUG-7 fix: 移动端 Trigger 只做打开，不做 toggle
  // PC 端 Trigger 可 toggle（再次点击关闭）
  const handleOpen = useCallback(() => {
    const curVisible   = visibleRef.current;
    const curIsClosing = isClosingRef.current;

    if (curIsClosing) {
      // 中断关闭动画，立即重新打开
      setIsClosing(false);
      setVisible(true);
      return;
    }
    if (curVisible) {
      // 移动端已打开时忽略，PC 端可 toggle 关闭
      if (!isMobile) handleClose();
    } else {
      setIsClosing(false);
      setVisible(true);
    }
  }, [isMobile, handleClose]);

  const handleAnimationEnd = useCallback(() => {
    if (isClosingRef.current) {
      setVisible(false);
      setIsClosing(false);
    }
  }, []);

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
