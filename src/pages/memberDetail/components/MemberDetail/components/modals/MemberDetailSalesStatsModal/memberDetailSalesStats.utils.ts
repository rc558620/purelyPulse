// 营业详情弹窗工具函数：ECharts 配置生成。
// 前端禁止金额转换。formatAmountFen/fenToYuan 已删除，金额展示值由后端直接返回 xxxDisplay 字段。
import { safeNum } from '@utils/utils';

/** 图表数据视角类型（销售额 or 利润）。 */
export type ChartMetric = 'sales' | 'profit';

/** 格式化增幅百分比显示。 */
export const formatGrowth = (pct: number | null): string => {
  if (pct === null) return '--';
  const sign = pct >= 0 ? '+' : '';
  return `${sign}${safeNum(pct).toFixed(1)}%`;
};

/** 根据指标类型生成柱状图渐变色配置。 */
const getBarGradient = (metric: ChartMetric): object => {
  if (metric === 'sales') {
    return {
      type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
      colorStops: [
        { offset: 0,   color: 'rgba(132, 204, 22, 0.95)' },
        { offset: 0.6, color: 'rgba(132, 204, 22, 0.65)' },
        { offset: 1,   color: 'rgba(132, 204, 22, 0.25)' },
      ],
    };
  }
  return {
    type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
    colorStops: [
      { offset: 0,   color: 'rgba(59, 130, 246, 0.95)' },
      { offset: 0.6, color: 'rgba(59, 130, 246, 0.65)' },
      { offset: 1,   color: 'rgba(59, 130, 246, 0.25)' },
    ],
  };
};

/** 根据标签数组、数值数组与指标类型生成完整 ECharts 柱状图配置。 */
export const buildChartOption = (
  labels: string[],
  values: string[],
  metric: ChartMetric,
): object => ({
  animation: true,
  animationDuration: 420,
  animationEasing: 'cubicOut',
  grid: { left: 12, right: 12, top: 16, bottom: 30, containLabel: true },
  tooltip: {
    trigger: 'axis',
    backgroundColor: 'rgba(15, 23, 42, 0.88)',
    borderColor: 'transparent',
    borderRadius: 10,
    padding: [8, 14],
    textStyle: { color: '#fff', fontSize: 12 },
    formatter: (params: unknown): string => {
      const items = params as Array<{ name: string; value: string }>;
      if (!items[0]) return '';
      const metricLabel = metric === 'sales' ? '销售额' : '利润';
      return `<span style="font-size:11px;opacity:0.65">${items[0].name}</span><br/>
              <b style="font-size:13px">${metricLabel} ¥${items[0].value}</b>`;
    },
  },
  xAxis: {
    type: 'category',
    data: labels,
    axisLine:  { lineStyle: { color: '#e2e8f0' } },
    axisTick:  { show: false },
    axisLabel: {
      color: '#94a3b8',
      fontSize: 10,
      interval: 'auto',
      rotate: labels.length > 12 ? 30 : 0,
    },
  },
  yAxis: {
    type: 'category',
    data: values,
    axisLine: { show: false },
    axisTick: { show: false },
    splitLine: { lineStyle: { color: '#f1f5f9', type: 'dashed' } },
    axisLabel: { show: false },
  },
  series: [{
    type: 'bar',
    data: values,
    barMaxWidth: 36,
    barMinWidth: 6,
    itemStyle: {
      color: getBarGradient(metric),
      borderRadius: [5, 5, 0, 0],
    },
    emphasis: {
      itemStyle: {
        color: metric === 'sales'
          ? 'rgba(132, 204, 22, 1)'
          : 'rgba(59, 130, 246, 1)',
        shadowBlur: 12,
        shadowColor: metric === 'sales'
          ? 'rgba(132, 204, 22, 0.35)'
          : 'rgba(59, 130, 246, 0.35)',
      },
    },
  }],
});
