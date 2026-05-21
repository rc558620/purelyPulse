// 合伙人申请审核筛选栏：统一管理状态筛选切换与待审核数量提示。
import React, { memo } from 'react';
import { cx, isNonEmptyArray, safeNum } from '@utils/utils';
import type { ReviewFilterTab } from '../../partnerReview.types';
import styles from './PartnerReviewFilterBar.module.less';

const PARTNER_REVIEW_TAB_OPTIONS: Array<{ value: ReviewFilterTab; label: string }> = [
  { value: 'all', label: '全部' },
  { value: 'pending', label: '待审核' },
  { value: 'approved', label: '已通过' },
  { value: 'rejected', label: '已拒绝' },
];

interface PartnerReviewFilterBarProps {
  /** 当前激活的筛选项 */
  activeTab: ReviewFilterTab;
  /** 待审核数量 */
  pendingCount: number;
  /** 当前是否禁用切换 */
  disabled: boolean;
  /** 切换筛选项 */
  onTabChange: (tab: ReviewFilterTab) => void;
}

const PartnerReviewFilterBar: React.FC<PartnerReviewFilterBarProps> = memo(({
  activeTab,
  pendingCount,
  disabled,
  onTabChange,
}) => (
  <div className={styles.filterWrap}>
    {isNonEmptyArray(PARTNER_REVIEW_TAB_OPTIONS)
      ? PARTNER_REVIEW_TAB_OPTIONS.map((tab) => (
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
));

PartnerReviewFilterBar.displayName = 'PartnerReviewFilterBar';

export default PartnerReviewFilterBar;
