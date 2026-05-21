// partnerBeans 页面状态展示组件
import React from 'react';
import { IconPartnerBeansLoading, IconPartnerBeansQuestion } from '../PartnerBeansIcons/PartnerBeansIcons';
import styles from './PartnerBeansPageState.module.less';

interface PartnerBeansPageStateProps {
  message: string;
  variant: 'loading' | 'error' | 'empty';
  onRetry?: () => void;
}

const PartnerBeansPageState: React.FC<PartnerBeansPageStateProps> = ({
  message,
  variant,
  onRetry,
}) => {
  const icon = variant === 'loading'
    ? <IconPartnerBeansLoading className={styles.icon} />
    : <IconPartnerBeansQuestion className={styles.icon} />;

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
};

export default PartnerBeansPageState;
