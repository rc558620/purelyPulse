/**
 * StatCard —— 通用统计小卡片
 *
 * 统一 SummaryCard（cost）和 StatMiniCard（purchase）两种用法：
 *
 * - `mode="amount"` （默认）：显示 ¥ 前缀 + fmtAmount 金额，接受 number 类型 `value`
 * - `mode="text"`          ：显示纯文字，接受 string 类型 `value`
 *
 * 颜色可通过 `variant` 枚举（'rose' | 'indigo' | 'orange'）或 `color` hex/rgb 字符串传入。
 * `color` 优先级高于 `variant`。
 */
import React, { type ReactNode } from 'react';
import { cx, fmtAmount } from '@utils/utils';
import styles from './StatCard.module.less';

// ─── 类型 ──────────────────────────────────────────────────────

export type StatCardVariant = 'default' | 'rose' | 'indigo' | 'orange';

const VARIANT_CLASS_MAP: Record<StatCardVariant, string | undefined> = {
  default: undefined,
  rose:    styles.variantRose,
  indigo:  styles.variantIndigo,
  orange:  styles.variantOrange,
};

// ─── Props ──────────────────────────────────────────────────────

interface StatCardAmountProps {
  mode?: 'amount';
  /** 金额数值（元） */
  value: number;
}

interface StatCardTextProps {
  mode: 'text';
  /** 纯文字值 */
  value: string;
}

type StatCardBaseProps = {
  /** 卡片左侧图标 */
  icon: ReactNode;
  /** 指标标签 */
  label: string;
  /** 颜色变体枚举 */
  variant?: StatCardVariant;
  /** 自定义颜色（优先于 variant），hex / rgb / hsl 均可 */
  color?: string;
  /** 卡片下方附加节点 */
  subInfo?: ReactNode;
};

export type StatCardProps = StatCardBaseProps & (StatCardAmountProps | StatCardTextProps);

// ─── 组件 ──────────────────────────────────────────────────────

const StatCard: React.FC<StatCardProps> = React.memo(({
  icon,
  label,
  value,
  mode = 'amount',
  variant = 'default',
  color,
  subInfo,
}) => (
  <div
    className={cx(styles.statCard, VARIANT_CLASS_MAP[variant])}
    style={color ? ({ '--card-color': color } as React.CSSProperties) : undefined}
  >
    <div className={styles.statIcon}>{icon}</div>
    <div className={styles.statContent}>
      <span className={styles.statLabel}>{label}</span>
      {mode === 'amount' ? (
        <span className={styles.statValue}>
          <span className={styles.statPrefix}>¥</span>
          {fmtAmount(value as number)}
        </span>
      ) : (
        <span className={styles.statValueText}>{value as string}</span>
      )}
      {subInfo != null && <div className={styles.statSubInfo}>{subInfo}</div>}
    </div>
  </div>
));

StatCard.displayName = 'StatCard';

export default StatCard;
