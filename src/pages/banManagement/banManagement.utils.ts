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

// formatFenAmount 已删除：前端不做分转元转换。金额展示值由后端直接返回 xxxDisplay 字段。
