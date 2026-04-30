import type React from 'react';
import { cx } from '@utils/utils';
import styles from './ChartSkeleton.module.less';

export interface ChartSkeletonProps {
  className?: string;
  style?: React.CSSProperties;
}

/** 图表加载骨架屏：Echarts lazy-load 期间的占位容器 */
const ChartSkeleton: React.FC<ChartSkeletonProps> = ({ className, style }): React.JSX.Element => (
  <div className={cx(styles.chartSkeleton, className)} style={style} aria-hidden="true" />
);

export default ChartSkeleton;
