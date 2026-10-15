// 群发短信页面统计概览区块
import React from 'react';
import { cx, safeNum } from '@utils/utils';
import { formatFen } from '../../smsBroadcast.utils';
import type { SmsBroadcastStats } from '../../smsBroadcast.types';
import styles from './SmsBroadcastStatsOverview.module.less';

interface SmsBroadcastStatsOverviewProps {
  stats: SmsBroadcastStats;
}

const SmsBroadcastStatsOverviewComponent: React.FC<SmsBroadcastStatsOverviewProps> = ({ stats }) => (
  <div className={styles.statsRow}>
    <div className={styles.statItem}>
      <span className={styles.statNum}>{safeNum(stats.storeCount).toLocaleString('zh-CN')}</span>
      <span className={styles.statLabel}>门店数</span>
    </div>
    <div className={styles.statDivider} aria-hidden="true" />
    <div className={styles.statItem}>
      <span className={cx(styles.statNum, styles.statNumQuota)}>
        {formatFen(safeNum(stats.totalBalanceFen))}
      </span>
      <span className={styles.statLabel}>余额合计</span>
    </div>
    <div className={styles.statDivider} aria-hidden="true" />
    <div className={styles.statItem}>
      <span className={cx(styles.statNum, styles.statNumWarning)}>{safeNum(stats.warningCount)}</span>
      <span className={styles.statLabel}>余额预警</span>
    </div>
    <div className={styles.statDivider} aria-hidden="true" />
    <div className={styles.statItem}>
      <span className={cx(styles.statNum, styles.statNumExhausted)}>{safeNum(stats.exhaustedCount)}</span>
      <span className={styles.statLabel}>已耗尽</span>
    </div>
  </div>
);

const SmsBroadcastStatsOverview = React.memo(SmsBroadcastStatsOverviewComponent);

export default SmsBroadcastStatsOverview;
