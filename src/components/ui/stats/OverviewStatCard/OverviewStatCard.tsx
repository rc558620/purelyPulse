// 通用概览统计卡片：图标 + 数值 + 标签，支持色彩语义变体和激活筛选态。
// 适用于：库存盘点概览、进货统计概览、成本概览等场景。
import React, { memo } from 'react';
import { cx, safeNum } from '@utils/utils';
import styles from './OverviewStatCard.module.less';

export interface OverviewStatCardProps {
  /** 卡片标签文本 */
  label: string;
  /** 统计数值（自动经 safeNum 处理） */
  value: number;
  /** 卡片图标节点 */
  icon: React.ReactNode;
  /**
   * 色彩语义变体：
   * - 'default'（默认）：主色
   * - 'success'：绿色（库存正常）
   * - 'warning'：橙色（预警）
   * - 'danger'：红色（缺货/危险）
   */
  variant?: 'default' | 'success' | 'warning' | 'danger';
  /** 是否处于激活（筛选选中）态 */
  active?: boolean;
  /** 点击回调（用于切换筛选） */
  onClick?: () => void;
}

const OverviewStatCard: React.FC<OverviewStatCardProps> = memo(({
  label,
  value,
  icon,
  variant = 'default',
  active,
  onClick,
}) => (
  <button
    type="button"
    className={cx(
      styles.statCard,
      variant === 'default' && !active && styles.statCardDefault,
      variant === 'warning' && styles.statCardWarning,
      variant === 'danger'  && styles.statCardDanger,
      variant === 'success' && styles.statCardSuccess,
      active && styles.statCardActive,
    )}
    onClick={onClick}
    aria-pressed={active}
  >
    <div className={styles.statIcon}>{icon}</div>
    <span className={styles.statValue}>{safeNum(value)}</span>
    <span className={styles.statLabel}>{label}</span>
  </button>
));

OverviewStatCard.displayName = 'OverviewStatCard';

export default OverviewStatCard;
