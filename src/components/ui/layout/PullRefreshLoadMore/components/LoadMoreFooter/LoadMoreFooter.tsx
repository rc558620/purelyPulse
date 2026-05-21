// 底部加载更多操作区
import React, { memo, type RefObject } from 'react';
import { cx } from '@utils/utils';
import type { LoadMoreStatus } from '../../PullRefreshLoadMore.types';
import styles from '../../PullRefreshLoadMore.module.less';

interface LoadMoreFooterProps {
  /** 底部区域引用 */
  footerRef: RefObject<HTMLDivElement | null>;
  /** 当前加载状态 */
  status: LoadMoreStatus;
  /** 是否仍有更多数据 */
  hasMore: boolean;
  /** 展示文案 */
  label: string;
  /** 展示图标 */
  icon: string;
  /** 图标是否旋转 */
  spinning: boolean;
  /** 点击时触发加载更多 */
  onLoadMore: () => void;
}

const LoadMoreFooter: React.FC<LoadMoreFooterProps> = memo(({
  footerRef,
  status,
  hasMore,
  label,
  icon,
  spinning,
  onLoadMore,
}) => (
  <div ref={footerRef} className={styles.footer} role="status" aria-live="polite">
    <button
      type="button"
      className={cx(styles.footerButton, status === 'loading' && styles.footerButtonLoading)}
      disabled={status === 'loading' || !hasMore}
      onClick={onLoadMore}
    >
      <span className={cx(styles.statusIcon, spinning && styles.statusIconSpinning)} aria-hidden="true">
        {icon}
      </span>
      <span>{label}</span>
    </button>
  </div>
));

LoadMoreFooter.displayName = 'LoadMoreFooter';

export default LoadMoreFooter;
