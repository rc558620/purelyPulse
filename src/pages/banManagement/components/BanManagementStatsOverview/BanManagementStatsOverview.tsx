// 封禁管理统计概览：展示顶部会员状态汇总。
import React from 'react';
import { cx, safeNum } from '@utils/utils';
import type { BanManagementCounts } from '../../banManagement.types';
import styles from './BanManagementStatsOverview.module.less';

interface BanManagementStatsOverviewProps {
  counts: BanManagementCounts;
}

const BanManagementStatsOverviewComponent: React.FC<BanManagementStatsOverviewProps> = ({ counts }) => {
  return (
    <div className={styles.statsRow}>
      <div className={styles.statItem}>
        <span className={styles.statNum}>{safeNum(counts.all)}</span>
        <span className={styles.statLabel}>全部用户</span>
      </div>
      <div className={styles.statDivider} aria-hidden="true" />
      <div className={styles.statItem}>
        <span className={cx(styles.statNum, styles.statNumActive)}>{safeNum(counts.active)}</span>
        <span className={styles.statLabel}>正常</span>
      </div>
      <div className={styles.statDivider} aria-hidden="true" />
      <div className={styles.statItem}>
        <span className={cx(styles.statNum, styles.statNumInactive)}>{safeNum(counts.inactive)}</span>
        <span className={styles.statLabel}>未活跃</span>
      </div>
      <div className={styles.statDivider} aria-hidden="true" />
      <div className={styles.statItem}>
        <span className={cx(styles.statNum, styles.statNumBanned)}>{safeNum(counts.banned)}</span>
        <span className={styles.statLabel}>已封禁</span>
      </div>
    </div>
  );
};

export const BanManagementStatsOverview = React.memo(BanManagementStatsOverviewComponent);

BanManagementStatsOverview.displayName = 'BanManagementStatsOverview';
