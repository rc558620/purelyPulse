import { safeNum } from '@utils/utils';

/** 格式化会员详情中的日期文案（yyyy.MM.dd）。 */
export function formatMemberDate(timestamp: number): string {
  const date = new Date(safeNum(timestamp));
  const pad = (value: number): string => String(value).padStart(2, '0');
  return `${date.getFullYear()}.${pad(date.getMonth() + 1)}.${pad(date.getDate())}`;
}

/** 格式化金额（分转元，保留整数展示）。 */
export function formatMemberAmount(fen: number): string {
  if (safeNum(fen) === 0) return '0';
  return (safeNum(fen) / 100).toFixed(0);
}

/** 格式化最近活跃的相对时间文案。 */
export function formatMemberRelativeTime(timestamp: number): string {
  const diff = Date.now() - safeNum(timestamp);
  const dayMs = 86_400_000;
  if (diff < dayMs) return '今天';
  if (diff < 2 * dayMs) return '昨天';
  if (diff < 7 * dayMs) return `${Math.floor(diff / dayMs)} 天前`;
  if (diff < 30 * dayMs) return `${Math.floor(diff / (7 * dayMs))} 周前`;
  if (diff < 365 * dayMs) return `${Math.floor(diff / (30 * dayMs))} 个月前`;
  return `${Math.floor(diff / (365 * dayMs))} 年前`;
}
