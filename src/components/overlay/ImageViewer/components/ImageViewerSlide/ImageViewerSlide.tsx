// 图片查看器：单张图片展示单元（图片本体 + 尺寸与点击策略，滑动动画类由父级注入）
import React from 'react';
import { cx } from '@utils/utils';
import styles from './ImageViewerSlide.module.less';

export interface ImageViewerSlideProps {
  /** 图片地址 */
  src: string;
  /** 无障碍描述，如「第 2 张」 */
  alt: string;
  /** 父级注入的滑动动画类；静止态不传 */
  className?: string;
  /** 父级注入的行内位移（收尾过渡的起 / 止两帧由 React 持有） */
  style?: React.CSSProperties;
  /** 宿主节点 ref：拖拽跟手位移由父级指令式写入，收尾过渡结束监听也挂在它上面 */
  hostRef?: React.Ref<HTMLDivElement>;
}

const ImageViewerSlide: React.FC<ImageViewerSlideProps> = ({
  src,
  alt,
  className,
  style,
  hostRef,
}) => {
  // 点击图片本身不关闭浮层（点遮罩空白处才关闭），在此截断冒泡
  const handleImageClick = (event: React.MouseEvent<HTMLImageElement>): void => {
    event.stopPropagation();
  };

  return (
    <div ref={hostRef} className={cx(styles.slide, className)} style={style}>
      <img
        className={styles.image}
        src={src}
        alt={alt}
        draggable={false}
        onClick={handleImageClick}
      />
    </div>
  );
};

export default ImageViewerSlide;
