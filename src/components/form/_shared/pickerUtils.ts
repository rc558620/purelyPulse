// pickerUtils — 选择器公共工具
// 供 MonthPicker / DayPicker 共用
// 注意：pad2 等工具函数也在此处，避免与组件文件混合导致 react-refresh 告警

/**
 * 构建可选年份列表
 * @param pastYears  向前追溯年数（默认 4，即含当年共 5 年）
 * @param futureYears 向后预留年数（默认 1）
 */
export const buildYears = (pastYears = 4, futureYears = 1): number[] => {
  const cur = new Date().getFullYear();
  const arr: number[] = [];
  for (let y = cur - pastYears; y <= cur + futureYears; y++) arr.push(y);
  return arr;
};

/** 1-12 月份列表 */
export const MONTHS = Array.from({ length: 12 }, (_, i) => i + 1);

/** 0-23 小时列表 */
export const HOURS = Array.from({ length: 24 }, (_, i) => i);

/** 0-59 分钟列表 */
export const MINUTES = Array.from({ length: 60 }, (_, i) => i);

/** 数字补零（1 → '01'） */
export const pad2 = (n: number): string => String(n).padStart(2, '0');
