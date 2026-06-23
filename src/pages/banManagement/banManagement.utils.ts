// 封禁管理页：集中处理展示层格式化逻辑。
import { safeNum } from '@utils/utils';

/** 格式化相对时间。 */
export const formatRelativeTime = (timestamp: number): string => {
  const diff = Date.now() - safeNum(timestamp);

  // Bug #6: 处理未来时间戳（服务器时钟偏移），显示为"刚刚"而非负数
  if (diff < 0) {
    return '刚刚';
  }

  const minutes = Math.floor(diff / 60_000);
  const hours = Math.floor(diff / 3_600_000);
  const days = Math.floor(diff / 86_400_000);

  if (minutes < 1) {
    return '刚刚';
  }

  if (hours < 1) {
    return `${minutes} 分钟前`;
  }

  if (days < 1) {
    return `${hours} 小时前`;
  }

  if (days < 30) {
    return `${days} 天前`;
  }

  return new Date(safeNum(timestamp)).toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
};

/** 分转元并保留整数展示。 */
export const formatFenAmount = (fen: number): string => {
  const value = safeNum(fen);

  if (value === 0) {
    return '0';
  }

  // Bug #7: 处理负数金额（退款场景）和极小绝对值（如 -1 分 → "0"）
  const yuan = value / 100;
  // toFixed(0) 对 -0.01 会返回 "-0"，需特殊处理
  const rounded = Math.round(yuan);

  return String(rounded);
};
