// smsBroadcast 门店短信钱包变动记录统计概览：总记录 / 平台调整 / 充值 / 消耗 / 退费
import React from 'react';
import { cx, safeNum } from '@utils/utils';
import type { SmsWalletLogStats } from '../../smsBroadcast.types';
import styles from './SmsBroadcastLogStatsOverview.module.less';

interface SmsBroadcastLogStatsOverviewProps {
  /** 后端按当前 Tab 的完整流水聚合的统计（不随分页变化） */
  stats: SmsWalletLogStats;
}

const SmsBroadcastLogStatsOverviewComponent: React.FC<SmsBroadcastLogStatsOverviewProps> = ({ stats }) => (
  <div className={styles.statsRow}>
    <div className={styles.statItem}>
      <span className={styles.statNum}>{safeNum(stats.totalRecords)}</span>
      <span className={styles.statLabel}>总记录</span>
    </div>
    <div className={styles.statDivider} aria-hidden="true" />
    <div className={styles.statItem}>
      <span className={cx(styles.statNum, styles.statNumAdmin)}>{safeNum(stats.adminAdjustCount)}</span>
      <span className={styles.statLabel}>平台调整</span>
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
    <div className={styles.statDivider} aria-hidden="true" />
    <div className={styles.statItem}>
      <span className={cx(styles.statNum, styles.statNumRefund)}>{safeNum(stats.refundCount)}</span>
      <span className={styles.statLabel}>退费</span>
    </div>
  </div>
);

const SmsBroadcastLogStatsOverview = React.memo(SmsBroadcastLogStatsOverviewComponent);

export default SmsBroadcastLogStatsOverview;
