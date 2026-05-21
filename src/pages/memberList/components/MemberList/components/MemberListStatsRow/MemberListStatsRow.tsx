// 会员统计概览行：展示总会员数、活跃数、合伙人数、封禁数。
import React, { memo } from 'react';
import { cx, safeNum } from '@utils/utils';
import type { MemberListStats } from '../../../../memberList.types';
import styles from '../../../../memberList.module.less';

interface MemberListStatsRowProps {
  /** 统计数据 */
  stats: MemberListStats;
}

const MemberListStatsRow: React.FC<MemberListStatsRowProps> = ({ stats }) => (
  <div className={styles.statsRow}>
    <div className={styles.statItem}>
      <span className={styles.statNum}>{safeNum(stats.totalCount)}</span>
      <span className={styles.statLabel}>总会员</span>
    </div>
    <div className={styles.statDivider} aria-hidden="true" />
    <div className={styles.statItem}>
      <span className={cx(styles.statNum, styles.statNumGreen)}>{safeNum(stats.activeCount)}</span>
      <span className={styles.statLabel}>活跃</span>
    </div>
    <div className={styles.statDivider} aria-hidden="true" />
    <div className={styles.statItem}>
      <span className={cx(styles.statNum, styles.statNumAmber)}>{safeNum(stats.partnerCount)}</span>
      <span className={styles.statLabel}>合伙人</span>
    </div>
    <div className={styles.statDivider} aria-hidden="true" />
    <div className={styles.statItem}>
      <span className={cx(styles.statNum, styles.statNumRed)}>{safeNum(stats.bannedCount)}</span>
      <span className={styles.statLabel}>封禁</span>
    </div>
  </div>
);

export default memo(MemberListStatsRow);
