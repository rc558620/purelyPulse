// partnerBeans 统计概览区块
import React from 'react';
import { cx, safeNum } from '@utils/utils';
import type { PartnerBeansPageStats } from '../../partnerBeans.types';
import styles from './PartnerBeansStatsOverview.module.less';

interface PartnerBeansStatsOverviewProps {
  stats: PartnerBeansPageStats;
}

const PartnerBeansStatsOverviewComponent: React.FC<PartnerBeansStatsOverviewProps> = ({ stats }) => (
  <div className={styles.statsRow}>
    <div className={styles.statItem}>
      <span className={styles.statNum}>{safeNum(stats.totalRecords)}</span>
      <span className={styles.statLabel}>总记录</span>
    </div>
    <div className={styles.statDivider} aria-hidden="true" />
    <div className={styles.statItem}>
      <span className={cx(styles.statNum, styles.statNumAdmin)}>{safeNum(stats.adminAdjustCount)}</span>
      <span className={styles.statLabel}>管理员调整</span>
    </div>
    <div className={styles.statDivider} aria-hidden="true" />
    <div className={styles.statItem}>
      <span className={cx(styles.statNum, styles.statNumPromo)}>{safeNum(stats.promoRewardCount)}</span>
      <span className={styles.statLabel}>推广奖励</span>
    </div>
    <div className={styles.statDivider} aria-hidden="true" />
    <div className={styles.statItem}>
      <span className={cx(styles.statNum, styles.statNumWithdraw)}>{safeNum(stats.withdrawCount)}</span>
      <span className={styles.statLabel}>提现</span>
    </div>
  </div>
);

const PartnerBeansStatsOverview = React.memo(PartnerBeansStatsOverviewComponent);

export default PartnerBeansStatsOverview;
