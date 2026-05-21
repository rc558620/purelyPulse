// 刷新失败后的重试按钮
import React from 'react';
import styles from '../../PullRefreshLoadMore.module.less';

interface RefreshRetryButtonProps {
  /** 是否显示重试按钮 */
  visible: boolean;
  /** 点击后重新触发刷新 */
  onRetry: () => void;
}

const RefreshRetryButton: React.FC<RefreshRetryButtonProps> = ({ visible, onRetry }) => {
  if (!visible) {
    return null;
  }

  return (
    <button type="button" className={styles.retryRefreshBtn} onClick={onRetry}>
      立即重试刷新
    </button>
  );
};

export default RefreshRetryButton;
