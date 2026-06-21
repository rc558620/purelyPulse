import { safeNum } from '@utils/utils';
import type { MemberLevel } from './memberList.types';

/** 格式化会员金额（分转元，保留整数展示）。 */
export function formatMemberAmount(fen: number): string {
  if (safeNum(fen) === 0) return '0';
  return (safeNum(fen) / 100).toFixed(0);
}

/** 格式化会员最近活跃的相对时间文案。 */
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

/** 格式化会员到期时间，返回展示文案（免费/永久无到期时间返回空，有到期日期返回"到期 MM-DD"或"MM-DD 到期"等）。 */
export function formatMemberExpiry(
  membershipExpiry: number | null | undefined,
  level: MemberLevel,
): string {
  // 免费会员返回空字符串
  if (level === 'free') {
    return '';
  }
  
  // 永久会员：如果服务器返回了到期时间则显示，否则返回空（真正的永久）
  if (level === 'lifetime') {
    if (membershipExpiry == null || membershipExpiry <= 0) {
      return '';
    }
    const date = new Date(membershipExpiry);
    if (Number.isNaN(date.getTime())) {
      return '';
    }
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${date.getFullYear()}-${month}-${day} 到期`;
  }
  
  if (membershipExpiry == null) {
    return '';
  }
  const date = new Date(membershipExpiry);
  if (Number.isNaN(date.getTime())) {
    return '';
  }
  const now = Date.now();
  const diffMs = membershipExpiry - now;
  const dayMs = 86_400_000;

  if (diffMs < 0) {
    return '已到期';
  }
  if (diffMs < 30 * dayMs) {
    const days = Math.ceil(diffMs / dayMs);
    return `${days} 天后到期`;
  }
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day} 到期`;
}
