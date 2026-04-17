/**
 * TrendBadge —— 涨跌趋势徽标（通用）
 *
 * 支持两种场景语义：
 *  - 利润类：涨 = 绿色（好），跌 = 红色（坏）  → invertColor={false}（默认）
 *  - 成本类：涨 = 红色（坏），跌 = 绿色（好）  → invertColor={true}
 *
 * 用法：
 * ```tsx
 * // 利润涨跌（正=好）
 * <TrendBadge value={12.5} suffix="较上期" />
 * <TrendBadge value={-3.2} suffix="较昨日" />
 *
 * // 成本涨跌（正=坏，颜色反转）
 * <TrendBadge value={8.3} suffix="较上月" invertColor />
 *
 * // null 时不渲染
 * <TrendBadge value={null} />
 * ```
 */
import React, { memo } from 'react';
import { cx, safeNum } from '@utils/utils';
import styles from './TrendBadge.module.less';

// 内联 SVG：避免外部图标依赖，保持组件自洽
const IconUp = (
  <svg
    aria-hidden="true" width="12" height="12"
    viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2.5"
    strokeLinecap="round" strokeLinejoin="round"
    style={{ flexShrink: 0 }}
  >
    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
    <polyline points="17 6 23 6 23 12" />
  </svg>
);

const IconDown = (
  <svg
    aria-hidden="true" width="12" height="12"
    viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2.5"
    strokeLinecap="round" strokeLinejoin="round"
    style={{ flexShrink: 0 }}
  >
    <polyline points="23 18 13.5 8.5 8.5 13.5 1 6" />
    <polyline points="17 18 23 18 23 12" />
  </svg>
);

export interface TrendBadgeProps {
  /**
   * 变化百分比数值；null 时组件不渲染。
   *
   * 也可用 `compareLastMonth` / `compareLastPeriod` 别名传入，
   * 三者互为等价，取第一个非 undefined 的值。
   */
  value?: number | null;
  /** 与上月对比（等价于 value） */
  compareLastMonth?: number | null;
  /** 与上期对比（等价于 value） */
  compareLastPeriod?: number | null;

  /** 数值后的说明文字，如 "较上期" / "较上月" / "较昨日" */
  suffix?: string;
  /**
   * 颜色反转：成本类场景下涨价为坏（红），降价为好（绿）。
   * @default false
   */
  invertColor?: boolean;
  className?: string;
}

const TrendBadge = memo<TrendBadgeProps>(({
  value,
  compareLastMonth,
  compareLastPeriod,
  suffix = '较上期',
  invertColor = false,
  className,
}) => {
  // 取第一个非 undefined 的值
  const rawValue = value !== undefined ? value
    : compareLastMonth !== undefined ? compareLastMonth
    : compareLastPeriod !== undefined ? compareLastPeriod
    : null;

  if (rawValue === null || rawValue === undefined) return null;

  const v    = safeNum(rawValue);
  const isUp = v > 0;
  const abs  = Math.abs(v).toFixed(1);

  // invertColor=true 时颜色反转（成本场景：涨=红/跌=绿）
  const isGood = invertColor ? !isUp : isUp;

  return (
    <span
      className={cx(
        styles.badge,
        isGood ? styles.up : styles.down,
        v === 0 && styles.neutral,
        className,
      )}
    >
      {isUp ? IconUp : IconDown}
      {isUp ? '+' : ''}{abs}%
      {suffix && <span style={{ marginLeft: '0.2rem' }}>{suffix}</span>}
    </span>
  );
});

TrendBadge.displayName = 'TrendBadge';

export default TrendBadge;
