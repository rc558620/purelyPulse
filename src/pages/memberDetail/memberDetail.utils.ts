import { safeNum } from '@utils/utils';

// 前端禁止金额转换。formatMemberAmount 已删除，会员金额展示值由后端直接返回 xxxDisplay 字段。

/** 格式化会员详情中的日期文案（yyyy.MM.dd）。 */
export function formatMemberDate(timestamp: number): string {
  const date = new Date(safeNum(timestamp));
  const pad = (value: number): string => String(value).padStart(2, '0');
  return `${date.getFullYear()}.${pad(date.getMonth() + 1)}.${pad(date.getDate())}`;
}

// formatMemberAmount 已删除：前端不做分转元转换。消费方应直接使用后端返回的 xxxDisplay 字段。

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
