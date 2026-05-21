// 下拉刷新状态提示条
import React, { memo } from 'react';
import { cx } from '@utils/utils';
import type { RefreshStatus } from '../../PullRefreshLoadMore.types';
import styles from '../../PullRefreshLoadMore.module.less';

interface RefreshIndicatorProps {
  /** 是否显示提示条 */
  visible: boolean;
  /** 是否固定显示提示条 */
  pinned: boolean;
  /** 当前刷新状态 */
  status: RefreshStatus;
  /** 提示文案 */
  label: string;
  /** 提示图标 */
  icon: string;
  /** 图标是否旋转 */
  spinning: boolean;
}

const RefreshIndicator: React.FC<RefreshIndicatorProps> = memo(({
  visible,
  pinned,
  status,
  label,
  icon,
  spinning,
}) => {
  if (!visible) {
    return null;
  }

  return (
    <div
      className={cx(styles.refreshRail, visible && styles.refreshRailVisible, pinned && styles.refreshRailPinned)}
      aria-hidden={status === 'idle'}
    >
      <div className={styles.refreshBubble} data-status={status} role="status" aria-live="polite">
        <span className={cx(styles.statusIcon, spinning && styles.statusIconSpinning)} aria-hidden="true">
          {icon}
        </span>
        <span>{label}</span>
      </div>
    </div>
  );
});

RefreshIndicator.displayName = 'RefreshIndicator';

export default RefreshIndicator;
