import React, { Suspense, lazy, memo, useMemo } from 'react';
import type { EChartsOption } from 'echarts';
import ChartSkeleton from './ChartSkeleton';

const Echarts = lazy(() => import('@components/business/Echarts/Echarts'));

export interface ChartRendererProps {
  /** ECharts option 配置对象 */
  option: EChartsOption;
  /** 透传给 Echarts 的事件监听映射 */
  onEvents?: Record<string, (params: unknown) => void>;
  /** 图表高度（px），优先级高于 style.height */
  height?: number;
  /** 透传给 Echarts / Skeleton 的样式类 */
  className?: string;
  /** 透传给 Echarts / Skeleton 的内联样式（height prop 会覆盖 style.height） */
  style?: React.CSSProperties;
}

/** 浅比较两个 Record，用于 memo 自定义比较器 */
const isShallowEqualRecord = (
  prev?: Record<string, unknown>,
  next?: Record<string, unknown>,
): boolean => {
  if (prev === next) return true;
  if (!prev || !next) return !prev && !next;

  const prevKeys = Object.keys(prev);
  const nextKeys = Object.keys(next);
  if (prevKeys.length !== nextKeys.length) return false;

  for (const key of prevKeys) {
    if (prev[key] !== next[key]) return false;
  }
  return true;
};

/** 封装 ECharts 懒加载 + 骨架过渡，让调用方无需关心 Suspense */
const ChartRenderer: React.FC<ChartRendererProps> = ({
  option,
  onEvents,
  height,
  className,
  style,
}): React.JSX.Element => {
  const chartStyle = useMemo<React.CSSProperties | undefined>(() => {
    if (height == null) return style;
    return { ...style, height };
  }, [height, style]);

  return (
    <Suspense fallback={<ChartSkeleton className={className} style={chartStyle} />}>
      <Echarts
        option={option}
        onEvents={onEvents}
        className={className}
        style={chartStyle}
      />
    </Suspense>
  );
};

export default memo(ChartRenderer, (prevProps, nextProps) => {
  if (prevProps.option !== nextProps.option) return false;
  if (prevProps.height !== nextProps.height) return false;
  if (prevProps.className !== nextProps.className) return false;
  if (!isShallowEqualRecord(
    prevProps.style as Record<string, unknown> | undefined,
    nextProps.style as Record<string, unknown> | undefined,
  )) return false;
  if (!isShallowEqualRecord(
    prevProps.onEvents as Record<string, unknown> | undefined,
    nextProps.onEvents as Record<string, unknown> | undefined,
  )) return false;
  return true;
});
