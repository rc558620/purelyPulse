/**
 * HeroStatCard —— 通用英雄统计卡片
 *
 * 渐变背景大卡：图标标签 + 金额大字 + 趋势徽标 + 副文本行
 * 用于各业务模块的"本月汇总"展示区。
 */
import React, { type ReactNode } from 'react';
import { fmtAmount } from '@utils/utils';
import TrendBadge from '@components/ui/data-display/TrendBadge/TrendBadge';
import styles from './HeroStatCard.module.less';

export interface HeroStatCardProps {
  /** 卡片标签左侧图标 */
  icon: ReactNode;
  /** 标签文字，如"本月总支出"、"本月进货总额" */
  label: string;
  /** 金额数值（元） */
  amount: number;
  /** 与上月对比百分比，null 表示无数据 */
  compareLastMonth: number | null;
  /** 副文本，如"共 N 条记录"或"共 N 笔" */
  subText: string;
}

const HeroStatCard: React.FC<HeroStatCardProps> = React.memo(({
  icon,
  label,
  amount,
  compareLastMonth,
  subText,
}) => (
  <div className={styles.heroCard}>
    <div className={styles.heroCardBg} aria-hidden="true" />
    <div className={styles.heroCardContent}>
      <div className={styles.heroLabel}>
        {icon}
        {label}
      </div>
      <div className={styles.heroAmount}>
        <span className={styles.heroPrefix}>¥</span>
        <span className={styles.heroValue}>{fmtAmount(amount)}</span>
      </div>
      <div className={styles.heroSubRow}>
        <TrendBadge compareLastMonth={compareLastMonth} />
        {compareLastMonth === null && (
          <span className={styles.heroSubText}>暂无上月对比数据</span>
        )}
        <span className={styles.heroSubText}>{subText}</span>
      </div>
    </div>
  </div>
));

HeroStatCard.displayName = 'HeroStatCard';

export default HeroStatCard;
