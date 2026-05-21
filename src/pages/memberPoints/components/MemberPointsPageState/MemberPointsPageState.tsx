// memberPoints 页面状态展示组件
import React from 'react';
import { IconMemberPointsLoading, IconMemberPointsQuestion } from '../MemberPointsIcons/MemberPointsIcons';
import styles from './MemberPointsPageState.module.less';

interface MemberPointsPageStateProps {
  message: string;
  variant: 'loading' | 'error';
  onRetry?: () => void;
}

const MemberPointsPageState: React.FC<MemberPointsPageStateProps> = React.memo(({
  message,
  variant,
  onRetry,
}) => {
  const icon = variant === 'loading'
    ? <IconMemberPointsLoading className={styles.icon} />
    : <IconMemberPointsQuestion className={styles.icon} />;

  return (
    <div className={styles.pageState} role={variant === 'error' ? 'alert' : 'status'}>
      {icon}
      <span>{message}</span>
      {variant === 'error' && onRetry ? (
        <button type="button" className={styles.retryButton} onClick={onRetry}>
          重新加载
        </button>
      ) : null}
    </div>
  );
});

export default MemberPointsPageState;
