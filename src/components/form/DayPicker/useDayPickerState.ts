// useDayPickerState — DayPicker 面板内部的年/月/日选中状态
//
// 职责：
//   - 接收外部受控的 year / month / day 作为初始值
//   - 派生可选天数列表，并在年月变化时自动 clamp 日期
//   - 「确定」：先关闭面板，再提交值（避免重渲染打断退场动画）
//   - 「今天」：直接提交 new Date() 并关闭
//   - 外部 props 变化时同步到内部 state（常驻 DOM 场景必须）
import { useState, useCallback, useMemo, useEffect } from 'react';
import { buildYears, MONTHS } from '@components/form/_shared/pickerUtils';

// ─── 工具 ─────────────────────────────────────────────────────

/** 获取某年某月的天数（month 为 1-based） */
const getDaysInMonth = (year: number, month: number): number =>
  new Date(year, month, 0).getDate();

// ─── Hook ─────────────────────────────────────────────────────

export interface UseDayPickerStateOptions {
  year:         number;
  month:        number;
  day:          number;
  pastYears?:   number;
  futureYears?: number;
  onConfirm:    (year: number, month: number, day: number) => void;
  onClose:      () => void;
}

export interface UseDayPickerStateReturn {
  selYear:       number;
  selMonth:      number;
  selDay:        number;
  rawDay:        number;
  years:         number[];
  months:        number[];
  days:          number[];
  setSelYear:    (y: number) => void;
  setSelMonth:   (m: number) => void;
  setRawDay:     (d: number) => void;
  handleConfirm: () => void;
  handleToday:   () => void;
}

const useDayPickerState = ({
  year,
  month,
  day,
  pastYears   = 4,
  futureYears = 1,
  onConfirm,
  onClose,
}: UseDayPickerStateOptions): UseDayPickerStateReturn => {
  const [selYear,  setSelYear]  = useState(year);
  const [selMonth, setSelMonth] = useState(month);
  const [rawDay,   setRawDay]   = useState(day);

  // Bug #3 fix: 外部 props 变化时同步到内部 state（常驻 DOM 场景必须）
  useEffect(() => { setSelYear(year);  }, [year]);
  useEffect(() => { setSelMonth(month); }, [month]);
  useEffect(() => { setRawDay(day);     }, [day]);

  // 年份列表（props 稳定时缓存）
  const years = useMemo(
    () => buildYears(pastYears, futureYears),
    [pastYears, futureYears],
  );

  // 动态计算当前年月的天数列表
  const days = useMemo(
    () => Array.from({ length: getDaysInMonth(selYear, selMonth) }, (_, i) => i + 1),
    [selYear, selMonth],
  );

  // Bug #5 fix: 月份切换后自动 clamp rawDay
  // 当 days 列表变化时，如果 rawDay 超出新的天数范围，自动修正
  const maxDay = days.length;
  if (rawDay > maxDay) {
    setRawDay(maxDay);
  }

  // 在渲染阶段派生 clamp 后的 selDay
  const selDay = Math.min(rawDay, days.length);

  // Bug #4 fix: 先关闭面板，再提交值
  // 先调 onClose 让面板开始退场动画，再调 onConfirm 更新外部状态
  // 这样面板的退场动画不会被 onConfirm 导致的重渲染打断
  const handleConfirm = useCallback(() => {
    onClose();
    onConfirm(selYear, selMonth, selDay);
  }, [selYear, selMonth, selDay, onConfirm, onClose]);

  // 「今天」快捷：直接提交当前日期并关闭
  const handleToday = useCallback(() => {
    const now = new Date();
    onClose();
    onConfirm(now.getFullYear(), now.getMonth() + 1, now.getDate());
  }, [onConfirm, onClose]);

  return {
    selYear,
    selMonth,
    selDay,
    rawDay,
    years,
    months: MONTHS as number[],
    days,
    setSelYear,
    setSelMonth,
    setRawDay,
    handleConfirm,
    handleToday,
  };
};

export default useDayPickerState;
