// 合伙人打款页筛选栏
import React from 'react';
import { cx, isNonEmptyArray, safeNum } from '@utils/utils';
import type { PartnerPayoutTabKey } from '../../partnerPayout.types';
import styles from './PartnerPayoutFilterBar.module.less';

const PARTNER_PAYOUT_TAB_OPTIONS: Array<{ value: PartnerPayoutTabKey; label: string }> = [
  { value: 'all', label: '全部' },
  { value: 'pending', label: '待处理' },
  { value: 'paid', label: '已打款' },
  { value: 'rejected', label: '已拒绝' },
];

interface PartnerPayoutFilterBarProps {
  /** 当前激活的筛选标签 */
  activeTab: PartnerPayoutTabKey;
  /** 待处理记录数 */
  pendingCount: number;
  /** 当前是否禁用切换 */
  disabled: boolean;
  /** 切换筛选标签 */
  onTabChange: (tab: PartnerPayoutTabKey) => void;
}

const PartnerPayoutFilterBar: React.FC<PartnerPayoutFilterBarProps> = ({
  activeTab,
  pendingCount,
  disabled,
  onTabChange,
}) => (
  <div className={styles.filterWrap}>
    {isNonEmptyArray(PARTNER_PAYOUT_TAB_OPTIONS)
      ? PARTNER_PAYOUT_TAB_OPTIONS.map((tab) => (
        <button
          key={tab.value}
          type="button"
          className={cx(styles.filterBtn, activeTab === tab.value && styles.filterBtnActive)}
          onClick={() => onTabChange(tab.value)}
          aria-pressed={activeTab === tab.value}
          disabled={disabled}
        >
          {tab.label}
          {tab.value === 'pending' && pendingCount > 0 ? (
            <span className={styles.filterBadge}>{safeNum(pendingCount)}</span>
          ) : null}
        </button>
      ))
      : null}
  </div>
);

export default PartnerPayoutFilterBar;
