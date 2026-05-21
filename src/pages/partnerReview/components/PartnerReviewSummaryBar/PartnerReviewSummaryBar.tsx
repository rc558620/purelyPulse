// 合伙人申请审核汇总条：展示总申请与不同审核状态数量。
import React, { memo } from 'react';
import { cx, safeNum } from '@utils/utils';
import styles from './PartnerReviewSummaryBar.module.less';

interface PartnerReviewSummaryBarProps {
  /** 申请总数 */
  totalCount: number;
  /** 待审核数量 */
  pendingCount: number;
  /** 已通过数量 */
  approvedCount: number;
  /** 已拒绝数量 */
  rejectedCount: number;
}

const PartnerReviewSummaryBar: React.FC<PartnerReviewSummaryBarProps> = memo(({
  totalCount,
  pendingCount,
  approvedCount,
  rejectedCount,
}) => (
  <div className={styles.summaryBar}>
    <div className={styles.summaryItem}>
      <span className={styles.summaryValue}>{safeNum(totalCount)}</span>
      <span className={styles.summaryLabel}>总申请</span>
    </div>
    <div className={styles.summaryDivider} aria-hidden="true" />
    <div className={styles.summaryItem}>
      <span className={cx(styles.summaryValue, styles.summaryValuePending)}>{safeNum(pendingCount)}</span>
      <span className={styles.summaryLabel}>待审核</span>
    </div>
    <div className={styles.summaryDivider} aria-hidden="true" />
    <div className={styles.summaryItem}>
      <span className={cx(styles.summaryValue, styles.summaryValueApproved)}>{safeNum(approvedCount)}</span>
      <span className={styles.summaryLabel}>已通过</span>
    </div>
    <div className={styles.summaryDivider} aria-hidden="true" />
    <div className={styles.summaryItem}>
      <span className={cx(styles.summaryValue, styles.summaryValueRejected)}>{safeNum(rejectedCount)}</span>
      <span className={styles.summaryLabel}>已拒绝</span>
    </div>
  </div>
));

PartnerReviewSummaryBar.displayName = 'PartnerReviewSummaryBar';

export default PartnerReviewSummaryBar;
