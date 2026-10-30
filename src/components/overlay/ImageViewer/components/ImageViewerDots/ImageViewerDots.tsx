// 图片查看器：底部圆点指示器
import React, { memo } from 'react';
import { cx, safeNum } from '@utils/utils';
import styles from './ImageViewerDots.module.less';

export interface ImageViewerDotsProps {
  /** 圆点总数，等于图片数量 */
  total: number;
  /** 当前展示的图片索引（由 hook 保证在 [0, total-1] 内） */
  activeIndex: number;
}

const ImageViewerDots: React.FC<ImageViewerDotsProps> = memo(({ total, activeIndex }) => (
  <div className={styles.dots} aria-hidden="true">
    {Array.from({ length: Math.max(0, safeNum(total)) }, (_, dotIndex) => (
      <span
        key={`image-viewer-dot-${dotIndex}`}
        className={cx(styles.dot, dotIndex === safeNum(activeIndex) && styles.dotActive)}
      />
    ))}
  </div>
));

ImageViewerDots.displayName = 'ImageViewerDots';

export default ImageViewerDots;
