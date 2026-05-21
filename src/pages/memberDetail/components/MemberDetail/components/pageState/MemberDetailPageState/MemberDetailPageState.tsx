import React from 'react';
import PageHeader from '@components/ui/layout/PageHeader';
import pageStyles from '../../../../../memberDetail.module.less';
import styles from './MemberDetailPageState.module.less';

interface MemberDetailPageStateProps {
  message: string;
  onBack: () => void;
  onRetry?: () => void;
}

const MemberDetailPageState: React.FC<MemberDetailPageStateProps> = ({
  message,
  onBack,
  onRetry,
}) => (
  <div className={styles.root}>
    <div className={pageStyles.pageContainer}>
      <PageHeader title="会员详情" onBack={onBack} />
      <div className={pageStyles.notFound}>
        <div>{message}</div>
        {onRetry ? (
          <button type="button" className={pageStyles.retryBtn} onClick={onRetry}>
            重新加载
          </button>
        ) : null}
      </div>
    </div>
  </div>
);

export default MemberDetailPageState;
