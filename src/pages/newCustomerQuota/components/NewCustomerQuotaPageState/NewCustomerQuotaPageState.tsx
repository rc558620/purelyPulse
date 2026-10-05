// 新客额度页面状态展示组件（加载 / 失败 / 空态）
import React from 'react';
import {
  IconNewCustomerQuotaLoading,
  IconNewCustomerQuotaQuestion,
} from '../NewCustomerQuotaIcons/NewCustomerQuotaIcons';
import styles from './NewCustomerQuotaPageState.module.less';

interface NewCustomerQuotaPageStateProps {
  message: string;
  variant: 'loading' | 'error' | 'empty';
  onRetry?: () => void;
}

const NewCustomerQuotaPageState: React.FC<NewCustomerQuotaPageStateProps> = ({
  message,
  variant,
  onRetry,
}) => {
  const icon = variant === 'loading'
    ? <IconNewCustomerQuotaLoading className={styles.icon} />
    : <IconNewCustomerQuotaQuestion className={styles.icon} />;

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

export default NewCustomerQuotaPageState;
