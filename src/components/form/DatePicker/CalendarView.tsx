// CalendarView — 日历视图
// 支持普通日期选择（date）和日期+时间（datetime）两种模式
// 内部有两个子视图：日视图（pickerMode='day'）和年月快速导航视图（pickerMode='yearMonth'）
import React, {
  memo,
  useMemo,
  useState,
  useCallback,
} from 'react';
import TimePickerPanel from './TimePickerPanel';
import YearMonthPicker from './YearMonthPicker';
import CalendarNav from './CalendarNav';
import CalendarGrid from './CalendarGrid';
import CalendarFooter from './CalendarFooter';
import {
  toLocalDate,
  toDateString,
  isDateDisabled,
  buildCalCells,
} from './utils';
import styles from './DatePicker.module.less';

export interface CalendarViewProps {
  /** 当前选中日期 "YYYY-MM-DD"，null 未选中 */
  selected: string | null;
  /** showConfirm 模式下，面板打开时默认预选高亮的日期 */
  defaultPending?: string | null;
  /** 最大可选日期 "YYYY-MM-DD"（含） */
  maxDate?: string;
  /** 最小可选日期 "YYYY-MM-DD"（含） */
  minDate?: string;
  /** 选中日期回调 */
  onSelect: (val: string) => void;
  /** 关闭面板回调 */
  onClose: () => void;
  // ── datetime 模式扩展 ──
  /** 是否为 datetime 模式（同时显示时间列） */
  isDatetime?: boolean;
  /** 当前时间 "HH:mm"（datetime 模式用） */
  time?: string;
  /** 时间变更回调 */
  onTimeChange?: (t: string) => void;
  /** 「此刻」按钮回调（datetime 模式） */
  onNow?: () => void;
  /** 「确认」按钮回调（datetime 模式） */
  onConfirm?: () => void;
  /** 返回需要禁用的小时列表（0-23），同 antd disabledTime */
  disabledHours?: () => number[];
  /** 返回需要禁用的分钟列表（0-59），接收当前小时作为参数 */
  disabledMinutes?: (hour: number) => number[];
  // ── 底部按钮控制 ──
  /** 是否隐藏「今天」快捷按钮，默认 false */
  hideToday?: boolean;
  /** 是否显示「确定」关闭按钮，默认 false */
  showConfirm?: boolean;
}

const CalendarView: React.FC<CalendarViewProps> = memo(({
  selected,
  defaultPending = null,
  maxDate,
  minDate,
  onSelect,
  onClose,
  isDatetime = false,
  time = '09:00',
  onTimeChange,
  onNow,
  onConfirm,
  hideToday = false,
  showConfirm = false,
  disabledHours,
  disabledMinutes,
}) => {
  const today    = useMemo(() => new Date(), []);
  const todayStr = useMemo(() => toDateString(today), [today]);

  // showConfirm 模式下的临时预选值（点格子暂存，点「确定」才提交）
  // 初始值：优先 defaultPending，其次已选值，都没有则 null
  const initPending = showConfirm && !isDatetime ? (defaultPending ?? selected ?? null) : null;
  const [pendingDate, setPendingDate] = useState<string | null>(initPending);

  // 初始化视图年月（优先用预选/已选日期，否则用今天）
  const initBase  = initPending || selected || null;
  const initYear  = initBase ? toLocalDate(initBase).getFullYear()  : today.getFullYear();
  const initMonth = initBase ? toLocalDate(initBase).getMonth()     : today.getMonth();

  const [viewYear,   setViewYear]   = useState(initYear);
  const [viewMonth,  setViewMonth]  = useState(initMonth);
  const [pickerMode, setPickerMode] = useState<'day' | 'yearMonth'>('day');

  // ── 月份导航 ──
  const handlePrevMonth = useCallback(() => {
    if (viewMonth === 0) { setViewYear(y => y - 1); setViewMonth(11); }
    else                   setViewMonth(m => m - 1);
  }, [viewMonth]);

  const handleNextMonth = useCallback(() => {
    if (viewMonth === 11) { setViewYear(y => y + 1); setViewMonth(0); }
    else                    setViewMonth(m => m + 1);
  }, [viewMonth]);

  // ── 日期禁用判断（稳定引用） ──
  const checkDisabled = useCallback(
    (dateStr: string) => isDateDisabled(dateStr, maxDate, minDate),
    [maxDate, minDate],
  );

  // ── 日期格子 ──
  const cells = useMemo(
    () => buildCalCells(viewYear, viewMonth),
    [viewYear, viewMonth],
  );

  const handleDayClick = useCallback((day: number) => {
    const m       = String(viewMonth + 1).padStart(2, '0');
    const d       = String(day).padStart(2, '0');
    const dateStr = `${viewYear}-${m}-${d}`;
    if (!checkDisabled(dateStr)) {
      if (!isDatetime && showConfirm) {
        // showConfirm 模式：仅预选高亮，等待「确定」按钮提交
        setPendingDate(dateStr);
      } else {
        onSelect(dateStr);
        if (!isDatetime) onClose();
      }
    }
  }, [viewYear, viewMonth, checkDisabled, onSelect, isDatetime, showConfirm, onClose]);

  const handleTodayClick = useCallback(() => {
    if (checkDisabled(todayStr)) return;
    if (!isDatetime && showConfirm) {
      setPendingDate(todayStr);
    } else {
      onSelect(todayStr);
      if (!isDatetime) onClose();
    }
  }, [todayStr, checkDisabled, onSelect, isDatetime, showConfirm, onClose]);

  // 「确定」按钮：提交预选值并关闭
  const handleConfirmClose = useCallback(() => {
    if (pendingDate !== null) onSelect(pendingDate);
    onClose();
  }, [pendingDate, onSelect, onClose]);

  // ── 年月快速选择 ──
  const handleYearMonthBack = useCallback(() => setPickerMode('day'), []);
  const handleYearChange    = useCallback((y: number) => setViewYear(y), []);
  const handleMonthSelect   = useCallback((m: number) => {
    setViewMonth(m);
    setPickerMode('day');
  }, []);

  // ── 年月选择视图 ──
  if (pickerMode === 'yearMonth') {
    return (
      <YearMonthPicker
        viewYear={viewYear}
        viewMonth={viewMonth}
        onYearChange={handleYearChange}
        onMonthSelect={handleMonthSelect}
        onBack={handleYearMonthBack}
      />
    );
  }

  // ── 是否显示底部操作区 ──
  const showFooter = isDatetime || !hideToday || showConfirm;

  // ── 日历主体 ──
  const calBody = (
    <>
      <CalendarNav
        viewYear={viewYear}
        viewMonth={viewMonth}
        onPrevMonth={handlePrevMonth}
        onNextMonth={handleNextMonth}
        onOpenYearMonth={() => setPickerMode('yearMonth')}
      />
      <CalendarGrid
        cells={cells}
        selected={showConfirm && !isDatetime ? (pendingDate ?? selected) : selected}
        todayStr={todayStr}
        onDayClick={handleDayClick}
        checkDisabled={checkDisabled}
      />
      {showFooter && (
        <CalendarFooter
          isDatetime={isDatetime}
          hideToday={hideToday}
          showConfirm={showConfirm}
          todayDisabled={checkDisabled(todayStr)}
          onTodayClick={handleTodayClick}
          onConfirmClose={showConfirm && !isDatetime ? handleConfirmClose : onClose}
          onNow={onNow}
          onConfirm={onConfirm}
        />
      )}
    </>
  );

  // datetime 模式：日历左 + 时间列右，并排布局
  if (isDatetime) {
    return (
      <div className={styles.datetimePanel}>
        <div className={styles.calendarInner}>{calBody}</div>
        <div className={styles.datetimeDivider} />
        <TimePickerPanel
          time={time}
          onChange={onTimeChange ?? (() => {})}
          disabledHours={disabledHours}
          disabledMinutes={disabledMinutes}
        />
      </div>
    );
  }

  return <div className={styles.calendarInner}>{calBody}</div>;
});

CalendarView.displayName = 'CalendarView';

export default CalendarView;
