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
//   DatePicker
//     ├─ CalendarView     (日期格子 + 年月导航 + 时间面板)
//     │    └─ TimePickerPanel  → ScrollColumn × 2
//     └─ MonthPickerView  (月份网格)

import React, {
  useState,
  useEffect,
  useCallback,
  useRef,
  useMemo,
} from 'react';
import ReactDOM from 'react-dom';
import CalendarView    from './CalendarView';
import MonthPickerView from './MonthPickerView';
import {
  toDateString,
  parseDatetimeValue,
  buildDatetimeValue,
} from './utils';
import styles from './DatePicker.module.less';

// ─── 设备类型 hook ─────────────────────────────────────────────

/**
 * 检测是否为移动端，监听 resize 自动更新。
 * 可通过 displayMode 强制锁定，避免不必要的监听。
 */
const useIsMobile = (displayMode?: 'mobile' | 'pc'): boolean => {
  const getVal = useCallback(() => {
    if (displayMode === 'pc')     return false;
    if (displayMode === 'mobile') return true;
    if (typeof window === 'undefined') return true;
    return window.innerWidth < 768;
  }, [displayMode]);

  const [isMobile, setIsMobile] = useState(getVal);

  useEffect(() => {
    // 强制指定时无需监听 resize
    if (displayMode !== undefined) return;
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [displayMode, getVal]);

  return isMobile;
};

// ─── Props ────────────────────────────────────────────────────

export interface DatePickerProps {
  /**
   * 选择器模式：
   * - `date`     = 选日期（默认），值格式 `"YYYY-MM-DD"`
   * - `month`    = 选月份，值格式 `"YYYY-MM"`
   * - `datetime` = 日期+时间，值格式 `"YYYY-MM-DD HH:mm"`
   */
  picker?: 'date' | 'month' | 'datetime';
  /** 受控值，null 表示无选中 */
  value?: string | null;
  /** 非受控默认值 */
  defaultValue?: string;
  /** 值变更回调，null 表示已清除 */
  onChange?: (val: string | null) => void;
  /** 占位文本（不传则按 picker 自动设置） */
  placeholder?: string;
  /** 最大可选日期/月份（含），格式同 picker */
  maxDate?: string;
  /** 最小可选日期/月份（含），格式同 picker */
  minDate?: string;
  /** 强制指定显示模式（不传则自动检测设备宽度） */
  displayMode?: 'mobile' | 'pc';
  /** 是否允许清除，默认 true */
  allowClear?: boolean;
  /** 错误状态（输入框显示红色边框） */
  status?: 'error';
  /** 额外类名 */
  className?: string;
  /** 前缀图标（替换默认日历图标） */
  prefix?: React.ReactNode;
  /** 隐藏底部「今天」快捷按钮，默认 false */
  hideToday?: boolean;
  /** 在底部显示「确定」关闭按钮，默认 false */
  showConfirm?: boolean;
}

// ─── DatePicker 主组件 ────────────────────────────────────────

const DatePicker: React.FC<DatePickerProps> = ({
  picker        = 'date',
  value,
  defaultValue,
  onChange,
  placeholder,
  maxDate,
  minDate,
  displayMode,
  allowClear    = true,
  status,
  className,
  prefix,
  hideToday     = false,
  showConfirm   = false,
}) => {
  const isMonthMode    = picker === 'month';
  const isDatetimeMode = picker === 'datetime';

  const defaultPlaceholder = isMonthMode ? '请选择月份' : isDatetimeMode ? '请选择日期时间' : '请选择日期';
  const resolvedPlaceholder = placeholder ?? defaultPlaceholder;

  const isMobile    = useIsMobile(displayMode);
  const wrapperRef  = useRef<HTMLDivElement>(null);

  // ── 受控/非受控状态 ──
  const [internalValue, setInternalValue] = useState<string | null>(defaultValue ?? null);
  // 空字符串等同于 null（Form 未设置时会传入 ''），回退到 internalValue
  const currentValue = (value !== undefined && value !== '') ? (value ?? null) : internalValue;

  // ── 面板开关 ──
  const [visible,   setVisible]   = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  // ── datetime 临时状态（面板内预览，确认后才提交） ──
  const [tempDate, setTempDate] = useState('');
  const [tempTime, setTempTime] = useState('09:00');

  // 打开 datetime 面板时同步初始值
  useEffect(() => {
    if (visible && isDatetimeMode) {
      const { date, time } = parseDatetimeValue(currentValue);
      setTempDate(date || toDateString(new Date()));
      setTempTime(time || '09:00');
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
    if (!isMobile && visible) setIsClosing(true);
    else                       setVisible(false);
  }, [isMobile, visible]);

  const handleAnimationEnd = useCallback(() => {
    if (isClosing) { setVisible(false); setIsClosing(false); }
  }, [isClosing]);

  // ── datetime 确认提交 ──
  const handleDatetimeConfirm = useCallback(() => {
    if (tempDate) handleChange(buildDatetimeValue(tempDate, tempTime));
    handleClose();
  // handleClose 使用 isMobile/visible，这里 eslint 报的 dep 不影响逻辑
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tempDate, tempTime, handleClose]);

  // ── 「此刻」按钮 ──
  const handleNow = useCallback(() => {
    const now     = new Date();
    const dateStr = toDateString(now);
    const hh      = String(now.getHours()).padStart(2, '0');
    const mm      = String(now.getMinutes()).padStart(2, '0');
    handleChange(buildDatetimeValue(dateStr, `${hh}:${mm}`));
    handleClose();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [handleClose]);

  // ── Trigger 点击：切换开关 ──
  const handleOpen = useCallback(() => {
    if (visible || isClosing) {
      // 再次点击：datetime 模式提交，否则关闭
      if (isDatetimeMode && visible) handleDatetimeConfirm();
      else                           handleClose();
    } else {
      setIsClosing(false);
      setVisible(true);
    }
  }, [visible, isClosing, isDatetimeMode, handleDatetimeConfirm, handleClose]);

  // ── PC：点击外部关闭 ──
  useEffect(() => {
    if (isMobile || !visible || isClosing) return;
    const onClickOutside = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        if (isDatetimeMode) handleDatetimeConfirm();
        else                handleClose();
      }
    };
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, [isMobile, visible, isClosing, isDatetimeMode, handleDatetimeConfirm, handleClose]);

  // ── ESC 关闭 ──
  useEffect(() => {
    if (!visible) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') handleClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [visible, handleClose]);

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
      return `${date.replace(/-/g, '/')} ${time}`;
    }
    return currentValue.replace(/-/g, '/');
  }, [currentValue, isMonthMode, isDatetimeMode]);

  // ── CalendarView 回调统一处理 ──
  const handleCalendarClose = useCallback(() => {
    if (isDatetimeMode) handleDatetimeConfirm();
    else                handleClose();
  }, [isDatetimeMode, handleDatetimeConfirm, handleClose]);

  const handleClearClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    handleChange(null);
  }, [handleChange]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleOpen();
  }, [handleOpen]);

  // showConfirm date 模式下，面板打开无已选值时默认高亮「明年今日」
  const nextYearToday = useMemo(() => {
    const d = new Date();
    d.setFullYear(d.getFullYear() + 1);
    return toDateString(d);
  }, []);

  // ── 公用 CalendarView props ──
  const calViewProps = {
    maxDate,
    minDate,
    isDatetime:   isDatetimeMode,
    time:         tempTime,
    onTimeChange: setTempTime,
    onNow:        isDatetimeMode ? handleNow             : undefined,
    onConfirm:    isDatetimeMode ? handleDatetimeConfirm : undefined,
    hideToday,
    showConfirm,
    // 无已选值时默认预选「明年今日」；有值则用已有值（由 CalendarView 内部 initPending 处理）
    defaultPending: showConfirm && !isDatetimeMode && !currentValue ? nextYearToday : undefined,
  };

  // ── 日历 / 月份面板（PC 和 Mobile 共用，封装成函数避免重复） ──
  const renderCalPanel = (extraClose: () => void) =>
    isMonthMode ? (
      <MonthPickerView
        selected={currentValue}
        maxMonth={maxDate}
        minMonth={minDate}
        onSelect={handleChange}
        onClose={extraClose}
      />
    ) : (
      <CalendarView
        {...calViewProps}
        selected={isDatetimeMode ? tempDate || null : currentValue}
        onSelect={isDatetimeMode ? setTempDate : handleChange}
        onClose={isDatetimeMode ? () => {} : extraClose}
      />
    );

  return (
    <div ref={wrapperRef} className={className ? `${styles.wrapper} ${className}` : styles.wrapper}>

      {/* ── Trigger ── */}
      <div
        className={`${styles.trigger}${status === 'error' ? ` ${styles.triggerError}` : ''}${visible ? ` ${styles.triggerOpen}` : ''}`}
        onClick={handleOpen}
        role="button"
        tabIndex={0}
        onKeyDown={handleKeyDown}
        aria-label={displayText || resolvedPlaceholder}
        aria-expanded={visible}
        aria-haspopup="dialog"
      >
        {/* 前缀图标 */}
        {prefix ? (
          <div className={styles.triggerPrefix}>{prefix}</div>
        ) : (
          <svg className={styles.calIcon} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8"  y1="2" x2="8"  y2="6" />
            <line x1="3"  y1="10" x2="21" y2="10" />
          </svg>
        )}

        {/* 文本 */}
        <span className={displayText ? styles.triggerText : `${styles.triggerText} ${styles.triggerPlaceholder}`}>
          {displayText || resolvedPlaceholder}
        </span>

        {/* 清除 / 占位 */}
        {allowClear && currentValue ? (
          <button type="button" className={styles.clearBtn} onClick={handleClearClick} aria-label="清除日期">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
              <path d="M6 5.293L10.146 1.146a.5.5 0 01.708.708L6.707 6l4.147 4.146a.5.5 0 01-.708.708L6 6.707l-4.146 4.147a.5.5 0 01-.708-.708L5.293 6 1.146 1.854a.5.5 0 01.708-.708L6 5.293z" />
            </svg>
          </button>
        ) : (
          <span className={styles.arrowPlaceholder} aria-hidden="true" />
        )}
      </div>

      {/* ── 移动端：底部 BottomSheet（Portal） ── */}
      {isMobile && ReactDOM.createPortal(
        <>
          {visible && (
            <div
              className={styles.mask}
              onClick={isDatetimeMode ? handleDatetimeConfirm : handleClose}
              aria-hidden="true"
            />
          )}
          <div
            className={`${styles.bottomSheet}${visible ? ` ${styles.bottomSheetVisible}` : ''}${isDatetimeMode ? ` ${styles.bottomSheetDatetime}` : ''}`}
            role="dialog"
            aria-modal="true"
          >
            <div className={styles.sheetHeader}>
              <div className={styles.sheetHandle} aria-hidden="true" />
              <div className={styles.sheetTitleRow}>
                <button type="button" className={styles.sheetCancelBtn} onClick={handleClose}>取消</button>
                <span className={styles.sheetTitle}>
                  {isMonthMode ? '选择月份' : isDatetimeMode ? '选择日期时间' : '选择日期'}
                </span>
                {isDatetimeMode ? (
                  <button type="button" className={styles.sheetConfirmBtn} onClick={handleDatetimeConfirm}>确定</button>
                ) : (
                  <div className={styles.sheetHeaderRight} />
                )}
              </div>
            </div>
            {renderCalPanel(handleClose)}
          </div>
        </>,
        document.body,
      )}

      {/* ── PC 端：下拉 Dropdown ── */}
      {!isMobile && visible && (
        <div
          className={`${styles.dropdown}${isDatetimeMode ? ` ${styles.dropdownDatetime}` : ''}${isClosing ? ` ${styles.dropdownClosing}` : ''}`}
          onAnimationEnd={handleAnimationEnd}
          role="dialog"
          aria-modal="true"
        >
          {renderCalPanel(handleCalendarClose)}
        </div>
      )}
    </div>
  );
};

export default DatePicker;
