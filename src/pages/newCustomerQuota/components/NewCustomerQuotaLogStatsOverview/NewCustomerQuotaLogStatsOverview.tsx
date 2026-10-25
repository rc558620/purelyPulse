// newCustomerQuota 门店额度变动记录统计概览：总记录 / 管理员调整 / 充值 / 消耗
import React from 'react';
import { cx, safeNum } from '@utils/utils';
import type { NewCustomerQuotaLogStats } from '../../newCustomerQuota.types';
import styles from './NewCustomerQuotaLogStatsOverview.module.less';

interface NewCustomerQuotaLogStatsOverviewProps {
  /** 后端按门店全量流水聚合的统计（不随 Tab 与分页变化） */
  stats: NewCustomerQuotaLogStats;
}

const NewCustomerQuotaLogStatsOverviewComponent: React.FC<NewCustomerQuotaLogStatsOverviewProps> = ({ stats }) => (
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
      <span className={cx(styles.statNum, styles.statNumRecharge)}>{safeNum(stats.rechargeCount)}</span>
      <span className={styles.statLabel}>充值</span>
    </div>
    <div className={styles.statDivider} aria-hidden="true" />
    <div className={styles.statItem}>
      <span className={cx(styles.statNum, styles.statNumConsume)}>{safeNum(stats.consumeCount)}</span>
      <span className={styles.statLabel}>消耗</span>
    </div>
  </div>
);

const NewCustomerQuotaLogStatsOverview = React.memo(NewCustomerQuotaLogStatsOverviewComponent);

export default NewCustomerQuotaLogStatsOverview;
