/**
 * TrendBadge —— 涨跌趋势徽标（通用）
 *
 * 支持两种场景语义：
 *  - 利润类：涨 = 绿色（好），跌 = 红色（坏）  → invertColor={false}（默认）
 *  - 成本类：涨 = 红色（坏），跌 = 绿色（好）  → invertColor={true}
 *  - 持平（value=0）：灰色，无箭头
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
 * // 持平：灰色胶囊 + 0.0%
 * <TrendBadge value={0} />
 *
 * // null 时不渲染
 * <TrendBadge value={null} />
 * ```
 */
import { memo } from 'react';
import { cx, safeNum } from '@utils/utils';
import { IconTrendUp, IconTrendDown } from '@components/ui/_shared/icons';
import styles from './TrendBadge.module.less';

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

/** 三态趋势：上涨 / 持平 / 下跌 */
type TrendDirection = 'up' | 'neutral' | 'down';

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

  const v = safeNum(rawValue);

  // Bug4 防御：NaN 经过 safeNum 回退为 0，但语义上应视为无数据
  if (typeof rawValue === 'number' && isNaN(rawValue)) return null;

  // 三态分支：涨 / 持平 / 跌
  const direction: TrendDirection = v > 0 ? 'up' : v < 0 ? 'down' : 'neutral';
  const isUp = direction === 'up';
  const abs  = Math.abs(v).toFixed(1);

  // 样式 class：三态互斥，不会叠加
  const directionClass = (() => {
    if (direction === 'neutral') return styles.neutral;
    // invertColor=true 时颜色反转（成本场景：涨=红/跌=绿）
    const isGood = invertColor ? !isUp : isUp;
    return isGood ? styles.up : styles.down;
  })();

  return (
    <span
      className={cx(
        styles.badge,
        directionClass,
        className,
      )}
    >
      {direction === 'up'   && <IconTrendUp />}
      {direction === 'down' && <IconTrendDown />}
      {isUp ? '+' : ''}{abs}%
      {suffix && <span className={styles.suffix}>{suffix}</span>}
    </span>
  );
});

TrendBadge.displayName = 'TrendBadge';

export default TrendBadge;
