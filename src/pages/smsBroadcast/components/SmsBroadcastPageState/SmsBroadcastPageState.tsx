// 群发短信页面状态展示组件（加载 / 失败 / 空态）
import React from 'react';
import {
  IconSmsBroadcastLoading,
  IconSmsBroadcastQuestion,
} from '../SmsBroadcastIcons/SmsBroadcastIcons';
import styles from './SmsBroadcastPageState.module.less';

interface SmsBroadcastPageStateProps {
  message: string;
  variant: 'loading' | 'error' | 'empty';
  onRetry?: () => void;
}

const SmsBroadcastPageState: React.FC<SmsBroadcastPageStateProps> = ({
  message,
  variant,
  onRetry,
}) => {
  const icon = variant === 'loading'
    ? <IconSmsBroadcastLoading className={styles.icon} />
    : <IconSmsBroadcastQuestion className={styles.icon} />;

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

export default SmsBroadcastPageState;
