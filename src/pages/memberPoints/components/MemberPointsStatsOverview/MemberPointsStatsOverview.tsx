// memberPoints 统计概览区块
import React from 'react';
import { cx, safeNum } from '@utils/utils';
import type { MemberPointsStats } from '../../memberPoints.types';
import styles from './MemberPointsStatsOverview.module.less';

interface MemberPointsStatsOverviewProps {
  stats: MemberPointsStats;
}

const MemberPointsStatsOverview: React.FC<MemberPointsStatsOverviewProps> = React.memo(({ stats }) => (
  <div className={styles.statsRow}>
    <div className={styles.statItem}>
      <span className={styles.statNum}>{safeNum(stats.totalRecords)}</span>
      <span className={styles.statLabel}>总记录数</span>
    </div>
    <div className={styles.statDivider} aria-hidden="true" />
    <div className={styles.statItem}>
      <span className={cx(styles.statNum, styles.statNumAccent)}>{safeNum(stats.adminAdjustCount)}</span>
      <span className={styles.statLabel}>管理员调整</span>
    </div>
    <div className={styles.statDivider} aria-hidden="true" />
    <div className={styles.statItem}>
      <span className={cx(styles.statNum, styles.statNumToday)}>{safeNum(stats.todayChangeCount)}</span>
      <span className={styles.statLabel}>今日变动</span>
    </div>
  </div>
));

export default MemberPointsStatsOverview;
