// DatePicker — 工具函数 & 常量
// 所有纯函数、常量、类型在此集中管理，避免散落在组件文件中

// ─── 常量 ────────────────────────────────────────────────────

export const WEEK_LABELS  = ['日', '一', '二', '三', '四', '五', '六'] as const;
export const MONTH_NAMES  = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'] as const;
export const HOURS        = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
export const MINUTES      = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0'));

/** 每项高度 px，与 Less 中 @item-h 保持同步 */
export const ITEM_H   = 36;
/** 可见行数（奇数，中间行为选中项） */
export const VISIBLE  = 5;

// ─── 日期转换 ─────────────────────────────────────────────────

/** 把 "YYYY-MM-DD" 解析为本地零点 Date，避免 UTC 偏移问题 */
export const toLocalDate = (val: string | Date): Date => {
  if (val instanceof Date) return val;
  const [y, m, d] = val.split('-').map(Number);
  return new Date(y, m - 1, d);
};

/** Date → "YYYY-MM-DD" */
export const toDateString = (d: Date): string => {
  const y  = d.getFullYear();
  const m  = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${dd}`;
};

/** 获取某月总天数 */
export const getDaysInMonth = (year: number, month: number): number =>
  new Date(year, month + 1, 0).getDate();

/** 获取某月第一天是周几（0 = Sunday） */
export const getFirstDayOfWeek = (year: number, month: number): number =>
  new Date(year, month, 1).getDay();

// ─── 时间解析 ─────────────────────────────────────────────────

/** 解析 "HH:mm" 为 { hour, minute }，边界 clamp */
export const parseTime = (time: string): { hour: number; minute: number } => {
  const parts = time.split(':');
  return {
    hour:   Math.min(23, Math.max(0, parseInt(parts[0] ?? '9',  10))),
    minute: Math.min(59, Math.max(0, parseInt(parts[1] ?? '0', 10))),
  };
};

// ─── datetime 模式 ─────────────────────────────────────────────

/** 从 "YYYY-MM-DD HH:mm" 解析出 { date, time } */
export const parseDatetimeValue = (val: string | null | undefined): { date: string; time: string } => {
  if (!val) return { date: '', time: '09:00' };
  const spaceIdx = val.indexOf(' ');
  if (spaceIdx === -1) return { date: val, time: '09:00' };
  return { date: val.slice(0, spaceIdx), time: val.slice(spaceIdx + 1) };
};

/** 组合日期和时间为 "YYYY-MM-DD HH:mm" */
export const buildDatetimeValue = (date: string, time: string): string => {
  if (!date) return '';
  return `${date} ${time}`;
};

// ─── 日期禁用判断 ──────────────────────────────────────────────

/**
 * 判断某日期字符串是否被禁用
 * 使用字符串比较（"YYYY-MM-DD" 词典序等价于时间序）
 */
export const isDateDisabled = (dateStr: string, maxDate?: string, minDate?: string): boolean => {
  if (maxDate && dateStr > maxDate) return true;
  if (minDate && dateStr < minDate) return true;
  return false;
};

/**
 * 判断某年月字符串 "YYYY-MM" 是否被禁用
 */
export const isMonthDisabled = (ym: string, maxMonth?: string, minMonth?: string): boolean => {
  if (maxMonth && ym > maxMonth) return true;
  if (minMonth && ym < minMonth) return true;
  return false;
};

// ─── 日历单元格生成 ───────────────────────────────────────────

export interface CalCell {
  day: number | null;
  dateStr: string | null;
}

/** 生成某月的 42 格日历单元格数组（6 行 × 7 列） */
export const buildCalCells = (year: number, month: number): CalCell[] => {
  const daysInMonth    = getDaysInMonth(year, month);
  const firstDayOfWeek = getFirstDayOfWeek(year, month);
  const result: CalCell[] = [];

  for (let i = 0; i < firstDayOfWeek; i++) {
    result.push({ day: null, dateStr: null });
  }
  for (let d = 1; d <= daysInMonth; d++) {
    const m  = String(month + 1).padStart(2, '0');
    const ds = String(d).padStart(2, '0');
    result.push({ day: d, dateStr: `${year}-${m}-${ds}` });
  }
  while (result.length < 42) {
    result.push({ day: null, dateStr: null });
  }
  return result;
};

// ─── 年份列表生成 ──────────────────────────────────────────────

/** 生成年份列表：当前年前 10 年 ~ 后 2 年 */
export const buildYearList = (currentYear: number): number[] => {
  const list: number[] = [];
  for (let y = currentYear - 10; y <= currentYear + 2; y++) list.push(y);
  return list;
};
