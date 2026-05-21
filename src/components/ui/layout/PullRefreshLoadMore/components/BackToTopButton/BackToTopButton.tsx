// 回到顶部悬浮按钮
import React, { memo } from 'react';
import styles from '../../PullRefreshLoadMore.module.less';
import { IconBackToTopArrow } from '../PullRefreshLoadMoreIcons/PullRefreshLoadMoreIcons';

interface BackToTopButtonProps {
  /** 是否显示按钮 */
  visible: boolean;
  /** 按钮无障碍文案 */
  label: string;
  /** 点击后回到顶部 */
  onClick: () => void;
}

const BackToTopButton: React.FC<BackToTopButtonProps> = memo(({ visible, label, onClick }) => {
  if (!visible) {
    return null;
  }

  return (
    <button type="button" className={styles.backToTopBtn} onClick={onClick} aria-label={label} title={label}>
      <IconBackToTopArrow className={styles.backToTopIcon} />
    </button>
  );
});

BackToTopButton.displayName = 'BackToTopButton';

export default BackToTopButton;
