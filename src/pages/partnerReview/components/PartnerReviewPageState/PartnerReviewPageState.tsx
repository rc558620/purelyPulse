// 合伙人申请审核状态区块：统一处理加载、报错与空列表展示。
import React, { memo } from 'react';
import { EmptyState, InertiaSpinner } from '@components/ui/feedback';
import { safeStr } from '@utils/utils';
import { IconPartnerReviewEmpty } from '../PartnerReviewIcons/PartnerReviewIcons';
import type { ReviewFilterTab } from '../../partnerReview.types';
import styles from './PartnerReviewPageState.module.less';

interface PartnerReviewPageStateProps {
  /** 页面状态类型 */
  variant: 'loading' | 'error' | 'empty';
  /** 当前激活的筛选标签 */
  activeTab: ReviewFilterTab;
  /** 总记录数 */
  totalCount?: number;
  /** 错误文案 */
  errorMessage?: string;
  /** 重试回调 */
  onRetry: () => void;
}

const getEmptyTitle = (activeTab: ReviewFilterTab): string => {
  switch (activeTab) {
    case 'pending':
      return '暂无待审核申请';
    case 'approved':
      return '暂无已通过申请';
    case 'rejected':
      return '暂无已拒绝申请';
    default:
      return '暂无合伙人申请';
  }
};

const PartnerReviewPageState: React.FC<PartnerReviewPageStateProps> = memo(({
  variant,
  activeTab,
  totalCount = 0,
  errorMessage,
  onRetry,
}) => {
  if (variant === 'loading') {
    return (
      <div className={styles.loadingState} role="status">
        <InertiaSpinner spinning size="lg" variant="brand" />
        <span>正在加载合伙人申请...</span>
      </div>
    );
  }

  if (variant === 'error') {
    return (
      <div className={styles.errorState} role="alert">
        <span>{safeStr(errorMessage, '获取合伙人申请列表失败')}</span>
        <button type="button" className={styles.retryBtn} onClick={onRetry}>
          重新加载
        </button>
      </div>
    );
  }

  return (
    <div className={styles.emptyWrap}>
      <EmptyState
        icon={<IconPartnerReviewEmpty />}
        title={getEmptyTitle(activeTab)}
        desc={totalCount > 0 ? '尝试切换筛选查看其他状态申请' : '当前还没有新的合伙人申请'}
        actionText="重新加载"
        onAction={onRetry}
      />
    </div>
  );
});

PartnerReviewPageState.displayName = 'PartnerReviewPageState';

export default PartnerReviewPageState;
