// 安全格式化数字（防 null/undefined/NaN）
export const safeNum = (value: number | undefined | null, fallback = 0): number =>
  typeof value === 'number' && !isNaN(value) ? value : fallback;

// 安全字符串显示（防 null/undefined）
export const safeStr = (str: string | undefined | null, fallback = ''): string =>
  typeof str === 'string' ? str : fallback;

export function cx(...p: Array<string | false | undefined>) {
  return p.filter(Boolean).join(' ');
}

export function dirOf(n: number): 'up' | 'down' | 'flat' {
  if (n > 0) return 'up';
  if (n < 0) return 'down';
  return 'flat';
}

/** 数组安全判定 */
export const isNonEmptyArray = <T>(arr: T[] | undefined | null): arr is T[] =>
  Array.isArray(arr) && arr.length > 0;

/** 金额格式化：中文本地化，最多保留 2 位小数（¥3,200 / ¥12.5） */
export const fmtAmount = (n: number): string =>
  n.toLocaleString('zh-CN', { minimumFractionDigits: 0, maximumFractionDigits: 2 });

/** 千分位格式化（不改变小数精度） */
export const formatNumber = (num: number | string | null | undefined): string => {
  const n = typeof num === 'number' ? `${num}` : safeStr(num, '0');
  const [int, dec] = n.split('.');
  const intFmt = int.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return dec ? `${intFmt}.${dec}` : intFmt;
};

/** 生成随机且稳定的回退 key（避免 Math.random） */
export const fallbackKey = (prefix = 'fallback-key'): string =>
  `${prefix}-${crypto.getRandomValues(new Uint32Array(1))[0]}`;

/**
 * 将 6 位 hex 颜色 + 不透明度转为 rgba 字符串。
 * 例：hexToRgba('#3b82f6', 0.12) → 'rgba(59,130,246,0.12)'
 */
export const hexToRgba = (hex: string, alpha: number): string => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
};
