// 合伙人打款页状态区块
import React from 'react';
import { EmptyState, InertiaSpinner } from '@components/ui/feedback';
import { safeStr } from '@utils/utils';
import { IconPartnerPayoutEmpty } from '../PartnerPayoutIcons/PartnerPayoutIcons';
import type { PartnerPayoutTabKey } from '../../partnerPayout.types';
import styles from './PartnerPayoutPageState.module.less';

interface PartnerPayoutPageStateProps {
  /** 页面状态类型 */
  variant: 'loading' | 'error' | 'empty';
  /** 当前激活的标签 */
  activeTab: PartnerPayoutTabKey;
  /** 总记录数 */
  totalCount?: number;
  /** 错误文案 */
  errorMessage?: string;
  /** 重试回调 */
  onRetry: () => void;
}

const getEmptyTitle = (activeTab: PartnerPayoutTabKey): string => {
  switch (activeTab) {
    case 'pending':
      return '暂无待处理记录';
    case 'paid':
      return '暂无已打款记录';
    case 'rejected':
      return '暂无已拒绝记录';
    default:
      return '暂无打款申请';
  }
};

const PartnerPayoutPageState: React.FC<PartnerPayoutPageStateProps> = ({
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
        <span>正在加载打款申请...</span>
      </div>
    );
  }

  if (variant === 'error') {
    return (
      <div className={styles.stateBlock} role="alert">
        <span>{safeStr(errorMessage, '获取合伙人打款列表失败')}</span>
        <button type="button" className={styles.retryBtn} onClick={onRetry}>
          重新加载
        </button>
      </div>
    );
  }

  return (
    <EmptyState
      icon={<IconPartnerPayoutEmpty />}
      title={getEmptyTitle(activeTab)}
      desc={totalCount > 0 ? '尝试切换筛选查看其他状态记录' : '当前还没有新的合伙人打款申请'}
      actionText="重新加载"
      onAction={onRetry}
    />
  );
};

export default PartnerPayoutPageState;
