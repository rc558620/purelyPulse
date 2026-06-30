// 合伙人打款页顶部汇总条
// 金额展示值由后端直接返回，前端不再做分转元和格式化。
import React from 'react';
import { cx, safeNum } from '@utils/utils';
import styles from './PartnerPayoutSummaryBar.module.less';

interface PartnerPayoutSummaryBarProps {
  /** 待处理申请数 */
  pendingCount: number;
  /** 待打款金额展示值（后端直接返回，前端不再分转元） */
  pendingAmountDisplay: string;
  /** 已打款累计金额展示值（后端直接返回，前端不再分转元） */
  paidAmountDisplay: string;
}

const PartnerPayoutSummaryBar: React.FC<PartnerPayoutSummaryBarProps> = ({
  pendingCount,
  pendingAmountDisplay,
  paidAmountDisplay,
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
      <div className={styles.summaryVal}>¥{pendingAmountDisplay || '0'}</div>
      <div className={styles.summaryLabel}>待打款金额</div>
    </div>
    <div className={styles.summaryDivider} aria-hidden="true" />
    <div className={styles.summaryItem}>
      <div className={styles.summaryVal}>¥{paidAmountDisplay || '0'}</div>
      <div className={styles.summaryLabel}>已打款累计</div>
    </div>
  </div>
);

export default PartnerPayoutSummaryBar;
