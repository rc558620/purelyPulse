// 合伙人打款页顶部汇总条
import React from 'react';
import { cx, fmtAmount, safeNum } from '@utils/utils';
import styles from './PartnerPayoutSummaryBar.module.less';

interface PartnerPayoutSummaryBarProps {
  /** 待处理申请数 */
  pendingCount: number;
  /** 待打款金额，单位分 */
  pendingAmount: number;
  /** 已打款累计金额，单位分 */
  paidAmount: number;
}

const PartnerPayoutSummaryBar: React.FC<PartnerPayoutSummaryBarProps> = ({
  pendingCount,
  pendingAmount,
  paidAmount,
}) => (
  <div className={styles.summaryBar}>
    <div className={styles.summaryItem}>
      <div className={cx(styles.summaryVal, pendingCount > 0 && styles.summaryValPending)}>
        {safeNum(pendingCount)}
      </div>
      <div className={styles.summaryLabel}>待处理</div>
    </div>
    <div className={styles.summaryDivider} aria-hidden="true" />
    <div className={styles.summaryItem}>
      <div className={styles.summaryVal}>¥{fmtAmount(safeNum(pendingAmount) / 100)}</div>
      <div className={styles.summaryLabel}>待打款金额</div>
    </div>
    <div className={styles.summaryDivider} aria-hidden="true" />
    <div className={styles.summaryItem}>
      <div className={styles.summaryVal}>¥{fmtAmount(safeNum(paidAmount) / 100)}</div>
      <div className={styles.summaryLabel}>已打款累计</div>
    </div>
  </div>
);

export default PartnerPayoutSummaryBar;
