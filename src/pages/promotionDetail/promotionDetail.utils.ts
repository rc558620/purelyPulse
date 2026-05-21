// 推广详情页面工具：统一处理数字展示与进度条宽度计算。
import type * as React from 'react';
import { safeNum } from '@utils/utils';

export const formatPromotionDetailCount = (value: number): string => safeNum(value).toLocaleString('zh-CN');

export const getPromotionDetailProgressStyle = (value: number, total: number): React.CSSProperties => {
  const normalizedValue = safeNum(value);
  const normalizedTotal = safeNum(total);
  const percent = normalizedTotal > 0 ? (normalizedValue / normalizedTotal) * 100 : 0;

  return {
    width: `${Math.max(0, Math.min(100, percent))}%`,
  };
};
