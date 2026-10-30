// src/components/form/DayPicker/index.tsx
//
// 组装层：Trigger 输入框 + 移动端弹层 + PC 端下拉
// 状态由 usePickerPopup / useDeviceType 分别管理；
// 面板内部年/月/日状态由各子组件自己通过 useDayPickerState 管理。
//
// 文件结构：
//   index.tsx                ← 本文件（组装层）
//   useDayPickerState.ts     ← 面板内选中状态（selYear / selMonth / selDay / 确定 / 今天）
//   DayPickerMobilePanel     ← 移动端底部 BottomSheet
//   DayPickerPcDropdown      ← PC 端下拉面板
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import ReactDOM from 'react-dom';
import classNames from 'classnames';

import useDeviceType  from '@components/form/_shared/useDeviceType';
import usePickerPopup from '@components/form/_shared/usePickerPopup';
import { CalendarIcon, CloseIcon } from '@components/form/_shared/icons';
import { pad2 }       from '@components/form/_shared/pickerUtils';
import DayPickerMobilePanel from './DayPickerMobilePanel';
import DayPickerPcDropdown  from './DayPickerPcDropdown';
import styles from './DayPicker.module.less';

// PC 端下拉最小宽度（对应 .dropdown 的 min-width: 34rem）+ 视口边距
const DROPDOWN_MIN_WIDTH = 340;
const VIEWPORT_PADDING = 8;

// ─── Props ────────────────────────────────────────────────────

export interface DayPickerProps {
  year:     number;
  month:    number;
  day:      number;
  onChange: (year: number, month: number, day: number) => void;
  /** 清除回调：传入时 Trigger 右侧显示 × 按钮 */
  onClear?: () => void;
  displayMode?: 'mobile' | 'pc';
  /** 向前追溯年数（默认 4） */
  pastYears?: number;
  /** 向后预留年数（默认 1） */
  futureYears?: number;
  className?: string;
  /** PC 端弹出位置：'top' | 'bottom'，默认 'bottom' */
  popupPlacement?: 'top' | 'bottom';
}

// ─── DayPicker 主组件 ─────────────────────────────────────────

const DayPicker: React.FC<DayPickerProps> = ({
  year,
  month,
  day,
  onChange,
  onClear,
  displayMode,
  pastYears,
  futureYears,
  className,
  popupPlacement = 'bottom',
}) => {
  // ── 设备类型（复用 _shared，displayMode prop 可强制覆盖） ──
  const isMobile = useDeviceType(displayMode);

  // ── 面板开/关状态（复用 _shared，含 ESC + 点击外部关闭） ──
  // PC 端面板走 Portal（不在 wrapperRef 内），需把 portalRef 一起登记为「内部区域」
  const portalRef = useRef<HTMLDivElement | null>(null);
  const extraInsideRefs = useMemo(() => [portalRef], []);
  const {
    visible,
    isClosing,
    wrapperRef,
    handleOpen,
    handleClose,
    handleAnimationEnd,
    handleKeyDown,
  } = usePickerPopup({ isMobile, extraInsideRefs });

  // PC端下拉位置状态（Portal + fixed 定位，避免被父容器 overflow 裁切）
  const [dropdownPos, setDropdownPos] = useState<{ top: number; left: number } | null>(null);

  useEffect(() => {
    if (isMobile || !visible || isClosing) return;
    const el = wrapperRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    // 面板自身通过 .dropdownBottom / .dropdownTop 的 ±6px 做偏移，这里只给锚点，
    // 避免偏移被重复累加。
    const maxLeft = window.innerWidth - DROPDOWN_MIN_WIDTH - VIEWPORT_PADDING;
    setDropdownPos({
      top: popupPlacement === 'top' ? rect.top : rect.bottom,
      left: Math.max(VIEWPORT_PADDING, Math.min(rect.left, maxLeft)),
    });
  }, [isMobile, visible, isClosing, popupPlacement]);

  const displayText = `${year}/${pad2(month)}/${pad2(day)}`;

  const handleClearClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onClear?.();
  }, [onClear]);

  // ─── 渲染 ──────────────────────────────────────────────────

  return (
    <div ref={wrapperRef} className={classNames(styles.wrapper, className)}>

      {/* ── Trigger ── */}
      <div
        className={classNames(styles.trigger, visible && styles.triggerOpen)}
        onClick={handleOpen}
        role="button"
        tabIndex={0}
        onKeyDown={handleKeyDown}
        aria-label={displayText}
        aria-expanded={visible}
        aria-haspopup="dialog"
      >
        <CalendarIcon className={styles.calIcon} />
        <span className={styles.triggerText}>{displayText}</span>
        {onClear ? (
          <button
            type="button"
            className={styles.clearBtn}
            onClick={handleClearClick}
            aria-label="清除日期"
          >
            <CloseIcon size={16} />
          </button>
        ) : (
          <span className={styles.arrowPlaceholder} aria-hidden="true" />
        )}
      </div>

      {/* ── 移动端：底部 BottomSheet（Portal，常驻 DOM，CSS 动画控制滑入/滑出）── */}
      {isMobile && (
        <DayPickerMobilePanel
          visible={visible}
          isClosing={isClosing}
          year={year}
          month={month}
          day={day}
          pastYears={pastYears}
          futureYears={futureYears}
          onConfirm={onChange}
          onClose={handleClose}
          onTransitionEnd={handleAnimationEnd}
        />
      )}

      {/* ── PC 端：下拉 Dropdown（Portal + fixed 定位，避免被父容器 overflow 裁切）── */}
      {!isMobile && visible && ReactDOM.createPortal(
        <div
          ref={portalRef}
          className={styles.dropdownPortal}
          style={{ top: dropdownPos?.top ?? 0, left: dropdownPos?.left ?? 0 }}
        >
          <DayPickerPcDropdown
            year={year}
            month={month}
            day={day}
            pastYears={pastYears}
            futureYears={futureYears}
            isClosing={isClosing}
            onConfirm={onChange}
            onClose={handleClose}
            onAnimationEnd={handleAnimationEnd}
            popupPlacement={popupPlacement}
          />
        </div>,
        document.body,
      )}
    </div>
  );
};

export default DayPicker;
