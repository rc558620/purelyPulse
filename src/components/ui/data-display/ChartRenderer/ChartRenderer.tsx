import React, { Suspense, lazy, memo, useMemo } from 'react';
import type { EChartsOption } from 'echarts';
import ChartSkeleton from './ChartSkeleton';

const Echarts = lazy(() => import('@components/business/Echarts/Echarts'));

export interface ChartRendererProps {
  /** ECharts option 配置对象 */
  option: EChartsOption;
  /** 透传给 Echarts 的事件监听映射 */
  onEvents?: Record<string, (params: unknown) => void>;
  /** 图表高度（px） */
  height?: number;
  /** 透传给 Echarts / Skeleton 的样式类 */
  className?: string;
  /** 透传给 Echarts / Skeleton 的内联样式 */
  style?: React.CSSProperties;
}

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

export default memo(ChartRenderer);
