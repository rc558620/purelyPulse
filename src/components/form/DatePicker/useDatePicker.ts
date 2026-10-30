// useDatePicker — DatePicker 的状态机与交互逻辑
//
// 从 index.tsx 抽离：只负责状态、回调与 PC 下拉定位计算，
// 渲染交给 DatePickerTrigger / DatePickerSheet / DatePickerDropdown。
//
// 组件层级：
//   DatePicker (index.tsx)
//     ├─ DatePickerTrigger              (输入框)
//     ├─ DatePickerSheet    (移动端)  ┐
//     │    └─ DatePickerPanelContent   │ 面板内容（共用）
//     └─ DatePickerDropdown (PC 端)  ┘
//          └─ DatePickerPanelContent
//                ├─ MonthPickerView
//                └─ CalendarView

import {
  useState,
  useEffect,
  useCallback,
  useRef,
  useMemo,
  type MouseEvent     as ReactMouseEvent,
  type KeyboardEvent  as ReactKeyboardEvent,
} from 'react';
import {
  toDateString,
  parseDatetimeValue,
  buildDatetimeValue,
  getNextYearToday,
  getCurrentTime,
} from './utils';
import { useIsMobile } from '@hooks/useIsMobile';
import type { DatePickerProps } from './types';

// ─── 常量 ────────────────────────────────────────────────────

/** 移动端断点 px */
export const MOBILE_BREAKPOINT = 768;
/** 移动端下滑关闭阈值 px */
export const SHEET_CLOSE_THRESHOLD = 100;
/** PC 下拉面板与触发器的间距 px */
export const DROPDOWN_GAP = 6;

// ─── 类型 ────────────────────────────────────────────────────

/** PC 下拉面板定位（fixed，相对视口） */
export interface DropdownPos {
  top?: number;
  bottom?: number;
  left: number;
}

// ─── Hook ────────────────────────────────────────────────────

const useDatePicker = (props: DatePickerProps) => {
  const {
    picker          = 'date',
    value,
    defaultValue,
    onChange,
    placeholder,
    maxDate,
    minDate,
    displayMode,
    allowClear      = true,
    disabled        = false,
    status,
    prefix,
    hideToday       = false,
    showConfirm     = false,
    disabledHours,
    disabledMinutes,
    popupPlacement  = 'bottom',
  } = props;

  const isMonthMode    = picker === 'month';
  const isDatetimeMode = picker === 'datetime';

  const resolvedPlaceholder =
    placeholder ?? (isMonthMode ? '请选择月份' : isDatetimeMode ? '请选择日期时间' : '请选择日期');

  // Bug9 修复：使用项目级 useIsMobile hook，支持 displayMode 强制锁定
  const isMobile = useIsMobile(MOBILE_BREAKPOINT);
  // displayMode 强制覆盖
  const effectiveIsMobile = displayMode === 'pc' ? false : displayMode === 'mobile' ? true : isMobile;

  const wrapperRef = useRef<HTMLDivElement>(null);
  // Portal 面板 ref，用于 onClickOutside 排除面板内部的点击（如“此刻”按钮）
  const panelRef   = useRef<HTMLDivElement>(null);

  // PC端下拉位置状态（Portal + fixed 定位，避免被父容器 overflow 裁切）
  // top / bottom 二选一：向上弹出时必须用 bottom 贴住触发器上边，
  // 否则 position:fixed 下同时给 top 会让面板从触发器顶部「向下」展开，反而盖住下方。
  const [dropdownPos, setDropdownPos] = useState<DropdownPos | null>(null);

  // ── 受控/非受控状态 ──
  const [internalValue, setInternalValue] = useState<string | null>(defaultValue ?? null);
  // 空字符串等同于 null（Form 未设置时会传入 ''），回退到 internalValue
  const currentValue = (value !== undefined && value !== '') ? (value ?? null) : internalValue;

  // ── 面板开关 ──
  const [visible,   setVisible]   = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  // ── datetime 临时状态（面板内预览，确认后才提交） ──
  // 默认时分 = 打开面板时的当前时分（不再固定 09:00）
  const [tempDate, setTempDate] = useState('');
  const [tempTime, setTempTime] = useState(getCurrentTime);

  // showConfirm date 模式下，面板打开无已选值时默认高亮「明年今日」
  // Bug10 修复：每次面板打开时刷新时间基准（在 handleOpen 中更新，避免 effect 内 setState）
  const [nextYearToday, setNextYearToday] = useState(getNextYearToday);

  // 打开 datetime 面板时同步初始值：无已选时分时回落到「当前时分」
  useEffect(() => {
    if (visible && isDatetimeMode) {
      const { date, time } = parseDatetimeValue(currentValue);
      setTempDate(date || toDateString(new Date()));
      setTempTime(time || getCurrentTime());
    }
  // currentValue 刻意不加入依赖：只在 visible 变为 true 时初始化一次
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, isDatetimeMode]);

  // ── 值更新 ──
  const handleChange = useCallback((val: string | null) => {
    if (value === undefined) setInternalValue(val);
    onChange?.(val);
  }, [value, onChange]);

  // ── 关闭动画（PC 端有退出动画） ──
  const handleClose = useCallback(() => {
    if (!effectiveIsMobile && visible) setIsClosing(true);
    else                                setVisible(false);
  }, [effectiveIsMobile, visible]);

  const handleAnimationEnd = useCallback(() => {
    if (isClosing) { setVisible(false); setIsClosing(false); }
  }, [isClosing]);

  // ── datetime 确认提交 ──
  // Bug12 修复：tempDate 为空时不提交，但仍关闭面板
  const handleDatetimeConfirm = useCallback(() => {
    if (tempDate) {
      handleChange(buildDatetimeValue(tempDate, tempTime));
    }
    handleClose();
  }, [tempDate, tempTime, handleChange, handleClose]);

  // ── 「此刻」按钮 ──
  // Bug8 修复：通过 temp 状态机制更新，而非直接调用 handleChange
  const handleNow = useCallback(() => {
    const dateStr = toDateString(new Date());
    const timeStr = getCurrentTime();
    setTempDate(dateStr);
    setTempTime(timeStr);
    // 同步提交值
    handleChange(buildDatetimeValue(dateStr, timeStr));
    handleClose();
  }, [handleChange, handleClose]);

  // ── Trigger 点击：切换开关 ──
  const handleOpen = useCallback(() => {
    if (disabled) return;
    if (visible || isClosing) {
      // 再次点击：datetime 模式提交，否则关闭
      if (isDatetimeMode && visible) handleDatetimeConfirm();
      else                           handleClose();
    } else {
      // Bug10 修复：每次打开时刷新「明年今日」基准，保证时间基准一致
      setNextYearToday(getNextYearToday());
      setIsClosing(false);
      setVisible(true);
    }
  }, [disabled, visible, isClosing, isDatetimeMode, handleDatetimeConfirm, handleClose]);

  // ── PC：点击外部关闭 ──
  useEffect(() => {
    if (effectiveIsMobile || !visible || isClosing) return;
    const onClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      // 排除 wrapper（触发器）和 panel（Portal 面板）内部的点击
      const insideWrapper = wrapperRef.current?.contains(target);
      const insidePanel   = panelRef.current?.contains(target);
      if (!insideWrapper && !insidePanel) {
        if (isDatetimeMode) handleDatetimeConfirm();
        else                handleClose();
      }
    };
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, [effectiveIsMobile, visible, isClosing, isDatetimeMode, handleDatetimeConfirm, handleClose]);

  // ── ESC 关闭 ──
  // Bug6 修复：datetime 模式下 ESC 也走确认提交，与点击外部行为一致
  useEffect(() => {
    if (!visible) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isDatetimeMode) handleDatetimeConfirm();
        else                handleClose();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [visible, isDatetimeMode, handleDatetimeConfirm, handleClose]);

  // ── PC端下拉位置计算（Portal + fixed 定位，避免被父容器 overflow 裁切）──
  useEffect(() => {
    if (effectiveIsMobile || !visible || isClosing) return;
    const el = wrapperRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    // 向上弹出：用 bottom 定位（fixed 下相对视口底边），让面板整体落在触发器上方；
    // 若只设 top，panel 会从触发器顶部向下展开，视觉上仍是「向下弹」。
    setDropdownPos(
      popupPlacement === 'top'
        ? { bottom: window.innerHeight - rect.top + DROPDOWN_GAP, left: rect.left }
        : { top: rect.bottom + DROPDOWN_GAP, left: rect.left },
    );
  }, [effectiveIsMobile, visible, isClosing, popupPlacement]);

  // ── 显示文本格式化 ──
  const displayText = useMemo(() => {
    if (!currentValue) return '';
    if (isMonthMode) {
      const [y, m] = currentValue.split('-');
      return `${y}年${parseInt(m, 10)}月`;
    }
    if (isDatetimeMode) {
      const { date, time } = parseDatetimeValue(currentValue);
      if (!date) return '';
      // 无时间尾缀的纯日期值只展示日期，避免尾随空格
      return time ? `${date.replace(/-/g, '/')} ${time}` : date.replace(/-/g, '/');
    }
    return currentValue.replace(/-/g, '/');
  }, [currentValue, isMonthMode, isDatetimeMode]);

  // ── CalendarView 回调统一处理 ──
  const handleCalendarClose = useCallback(() => {
    if (isDatetimeMode) handleDatetimeConfirm();
    else                handleClose();
  }, [isDatetimeMode, handleDatetimeConfirm, handleClose]);

  const handleClearClick = useCallback((e: ReactMouseEvent) => {
    e.stopPropagation();
    handleChange(null);
  }, [handleChange]);

  const handleKeyDown = useCallback((e: ReactKeyboardEvent) => {
    if (e.key === 'Enter') handleOpen();
  }, [handleOpen]);

  // ── datetime 模式：点击日期格子时立即提交值（与时间列滚动行为保持一致）──
  // 修复：datetime 模式下点击日期仅调用 setTempDate 不会更新输入框，
  // 用户期望点日期后输入框跟着变（和点时分框一样的即时反馈）。
  const handleDatetimeDateSelect = useCallback((dateStr: string) => {
    setTempDate(dateStr);
    handleChange(buildDatetimeValue(dateStr, tempTime));
  }, [handleChange, tempTime]);

  // ── datetime 模式：时间列滚动时立即提交值（与日期点击行为保持一致）──
  const handleDatetimeTimeChange = useCallback((t: string) => {
    setTempTime(t);
    handleChange(buildDatetimeValue(tempDate, t));
  }, [handleChange, tempDate]);

  // ── Trigger 渲染所需 props ──
  const triggerProps = {
    displayText,
    placeholder: resolvedPlaceholder,
    status,
    disabled,
    visible,
    allowClear,
    hasValue: !!currentValue,
    prefix,
    onClick:  handleOpen,
    onClear:  handleClearClick,
    onKeyDown: handleKeyDown,
  };

  // ── 面板内容渲染所需 props（移动端 & PC 端共用）──
  const panelProps = {
    isMonthMode,
    isDatetimeMode,
    currentValue,
    tempDate,
    tempTime,
    setTempTime,
    maxDate,
    minDate,
    hideToday,
    showConfirm,
    disabledHours,
    disabledMinutes,
    // 无已选值时默认预选「明年今日」；有值则用已有值（由 CalendarView 内部 initPending 处理）
    defaultPending: showConfirm && !isDatetimeMode && !currentValue ? nextYearToday : undefined,
    onChange:               handleChange,
    onDatetimeDateSelect:   handleDatetimeDateSelect,
    onDatetimeTimeChange:   handleDatetimeTimeChange,
    onNow:                  handleNow,
    onConfirm:              handleDatetimeConfirm,
  };

  // ── 移动端 BottomSheet 标题 ──
  const panelTitle = isMonthMode ? '选择月份' : isDatetimeMode ? '选择日期时间' : '选择日期';

  return {
    // 模式 / 设备
    isMonthMode,
    isDatetimeMode,
    effectiveIsMobile,
    // 状态
    visible,
    isClosing,
    currentValue,
    displayText,
    dropdownPos,
    // ref
    wrapperRef,
    panelRef,
    // 回调
    handleOpen,
    handleClose,
    handleKeyDown,
    handleClearClick,
    handleAnimationEnd,
    handleCalendarClose,
    handleDatetimeConfirm,
    // 分组 props
    triggerProps,
    panelProps,
    panelTitle,
  };
};

export default useDatePicker;
