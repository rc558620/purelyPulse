// 新客额度页面统计概览区块
import React from 'react';
import { cx, safeNum } from '@utils/utils';
import type { NewCustomerQuotaStats } from '../../newCustomerQuota.types';
import styles from './NewCustomerQuotaStatsOverview.module.less';

interface NewCustomerQuotaStatsOverviewProps {
  stats: NewCustomerQuotaStats;
}

const NewCustomerQuotaStatsOverviewComponent: React.FC<NewCustomerQuotaStatsOverviewProps> = ({ stats }) => (
  <div className={styles.statsRow}>
    <div className={styles.statItem}>
      <span className={styles.statNum}>{safeNum(stats.storeCount).toLocaleString('zh-CN')}</span>
      <span className={styles.statLabel}>门店数</span>
    </div>
    <div className={styles.statDivider} aria-hidden="true" />
    <div className={styles.statItem}>
      <span className={cx(styles.statNum, styles.statNumQuota)}>
        {safeNum(stats.totalRemaining).toLocaleString('zh-CN')}
      </span>
      <span className={styles.statLabel}>额度合计</span>
    </div>
    <div className={styles.statDivider} aria-hidden="true" />
    <div className={styles.statItem}>
      <span className={cx(styles.statNum, styles.statNumWarning)}>{safeNum(stats.warningCount)}</span>
      <span className={styles.statLabel}>额度预警</span>
    </div>
    <div className={styles.statDivider} aria-hidden="true" />
    <div className={styles.statItem}>
      <span className={cx(styles.statNum, styles.statNumExhausted)}>{safeNum(stats.exhaustedCount)}</span>
      <span className={styles.statLabel}>已耗尽</span>
    </div>
  </div>
);

const NewCustomerQuotaStatsOverview = React.memo(NewCustomerQuotaStatsOverviewComponent);

export default NewCustomerQuotaStatsOverview;
