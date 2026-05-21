// 承载滚动内容与底部扩展区的视口容器
import React, { memo, type RefObject } from 'react';
import { cx } from '@utils/utils';
import styles from '../../PullRefreshLoadMore.module.less';

interface PullRefreshViewportProps {
  /** 滚动容器引用 */
  containerRef: RefObject<HTMLDivElement | null>;
  /** 内容容器引用 */
  contentRef: RefObject<HTMLDivElement | null>;
  /** 内容区额外类名 */
  contentClassName?: string;
  /** 当前是否处于拖拽态 */
  dragging: boolean;
  /** 主内容 */
  children: React.ReactNode;
  /** 底部扩展内容 */
  footerContent?: React.ReactNode;
}

const PullRefreshViewport: React.FC<PullRefreshViewportProps> = memo(({
  containerRef,
  contentRef,
  contentClassName,
  dragging,
  children,
  footerContent,
}) => (
  <div
    ref={containerRef}
    className={cx(styles.scrollArea, dragging && styles.scrollAreaDragging)}
    data-testid="pull-refresh-scroll"
  >
    <div ref={contentRef} className={cx(styles.content, contentClassName)}>
      {children}
      {footerContent}
    </div>
  </div>
));

PullRefreshViewport.displayName = 'PullRefreshViewport';

export default PullRefreshViewport;
