// DatePicker — 自定义日期选择器
//
// 模式：
//   picker="date"     → 选日期，值格式 "YYYY-MM-DD"（默认）
//   picker="month"    → 选月份，值格式 "YYYY-MM"
//   picker="datetime" → 日期+时间，值格式 "YYYY-MM-DD HH:mm"
//
// 响应式：
//   移动端（< 768px）：底部 BottomSheet，Portal 挂到 body
//   PC 端（≥ 768px） ：下拉 Dropdown，点外部 / ESC 关闭
//
// 子组件层级：
//   DatePicker（本文件，仅做组合）
//     ├─ DatePickerTrigger              输入框
//     ├─ DatePickerSheet     (移动端)  ┐
//     │    └─ DatePickerPanelContent    │
//     └─ DatePickerDropdown  (PC 端)  ┘
//          └─ DatePickerPanelContent
//                ├─ MonthPickerView
//                └─ CalendarView → TimePickerPanel → ScrollColumn × 2
//
// 状态与交互逻辑集中在 useDatePicker，Props 类型见 ./types

import React from 'react';
import useDatePicker        from './useDatePicker';
import DatePickerTrigger    from './DatePickerTrigger';
import DatePickerSheet      from './DatePickerSheet';
import DatePickerDropdown   from './DatePickerDropdown';
import DatePickerPanelContent from './DatePickerPanelContent';
import type { DatePickerProps } from './types';
import styles from './DatePicker.module.less';

// ─── Props（类型定义见 ./types）──────────────────────────────

export type { DatePickerProps };

// datetime 模式工具：供外部取「当前时分」作为默认值（如客存存入弹窗的到期时间）
export { getCurrentTime } from './utils';

// ─── DatePicker 主组件 ────────────────────────────────────────

const DatePicker: React.FC<DatePickerProps> = (props) => {
  const { className, popupPlacement = 'bottom' } = props;

  const {
    isDatetimeMode,
    effectiveIsMobile,
    visible,
    isClosing,
    dropdownPos,
    wrapperRef,
    panelRef,
    handleClose,
    handleAnimationEnd,
    handleCalendarClose,
    handleDatetimeConfirm,
    triggerProps,
    panelProps,
    panelTitle,
  } = useDatePicker(props);

  return (
    <div ref={wrapperRef} className={className ? `${styles.wrapper} ${className}` : styles.wrapper}>

      {/* ── Trigger ── */}
      <DatePickerTrigger {...triggerProps} />

      {/* ── 移动端：底部 BottomSheet（Portal） ── */}
      {/* Bug5 修复：仅在 visible 时渲染，避免空挂 DOM */}
      {effectiveIsMobile && visible && (
        <DatePickerSheet
          title={panelTitle}
          isDatetime={isDatetimeMode}
          onClose={handleClose}
          onConfirm={handleDatetimeConfirm}
        >
          <DatePickerPanelContent {...panelProps} onClose={handleClose} />
        </DatePickerSheet>
      )}

      {/* ── PC 端：下拉 Dropdown（Portal + fixed 定位，避免被父容器 overflow 裁切）── */}
      {!effectiveIsMobile && visible && (
        <DatePickerDropdown
          isDatetime={isDatetimeMode}
          placement={popupPlacement}
          isClosing={isClosing}
          pos={dropdownPos}
          panelRef={panelRef}
          onAnimationEnd={handleAnimationEnd}
        >
          <DatePickerPanelContent {...panelProps} onClose={handleCalendarClose} />
        </DatePickerDropdown>
      )}
    </div>
  );
};

export default DatePicker;
