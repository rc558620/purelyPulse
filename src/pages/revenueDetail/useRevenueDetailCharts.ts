// 充值收入明细页图表配置：统一生成折线图与饼图的 ECharts option。
import { useMemo } from 'react';
import { getRevenueTypeMeta } from './revenueDetail.shared';
import { REVENUE_DETAIL_CHART_HEIGHTS } from './revenueDetail.constants';
import type {
  RevenueDetailTrend,
  RevenuePeriod,
  RevenueTypeItem,
} from './revenueDetail.types';
import { isNonEmptyArray, safeNum } from '@utils/utils';

interface UseRevenueDetailChartsParams {
  revenuePeriod: RevenuePeriod;
  trend: RevenueDetailTrend;
  revenueTypes: RevenueTypeItem[];
}

interface UseRevenueDetailChartsReturn {
  pieOption: echarts.EChartsOption;
  pieChartHeight: number;
  revenueChartOption: echarts.EChartsOption;
  revenueChartHeight: number;
}

export const useRevenueDetailCharts = ({
  revenuePeriod,
  trend,
  revenueTypes,
}: UseRevenueDetailChartsParams): UseRevenueDetailChartsReturn => {
  const pieOption = useMemo<echarts.EChartsOption>(() => {
    const safeRevenueTypes = isNonEmptyArray(revenueTypes) ? revenueTypes : [];

    return ({
    tooltip: {
      trigger: 'item',
      formatter: '{b}: {c}%',
      backgroundColor: 'rgba(15,23,42,0.92)',
      borderColor: 'rgba(249,115,22,0.3)',
      borderWidth: 1,
      textStyle: { color: '#f8fafc', fontSize: 12 },
    },
    legend: { show: false },
    series: [{
      type: 'pie',
      radius: ['50%', '78%'],
      center: ['50%', '50%'],
      data: safeRevenueTypes.map((item) => {
        const meta = getRevenueTypeMeta(item.label);
        return {
          name: item.label,
          value: safeNum(item.value),
          itemStyle: {
            color: meta.color,
            shadowColor: `${meta.color}40`,
            shadowBlur: 10,
          },
        };
      }),
      label: { show: false },
      labelLine: { show: false },
      emphasis: {
        itemStyle: { shadowBlur: 20, shadowOffsetX: 0, shadowColor: 'rgba(0,0,0,0.2)' },
        scale: true,
        scaleSize: 6,
      },
    }],
    });
  }, [revenueTypes]);

  const revenueChartOption = useMemo<echarts.EChartsOption>(() => {
    const safeTrendDates = trend.dates.length > 0 ? trend.dates : ['暂无数据'];
    const safeTrendValuesDisplay = trend.valuesDisplay.length > 0 ? trend.valuesDisplay : ['0'];

    return ({
    grid: { top: 20, bottom: 36, left: 56, right: 20 },
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(15,23,42,0.92)',
      borderColor: 'rgba(249,115,22,0.3)',
      borderWidth: 1,
      textStyle: { color: '#f8fafc', fontSize: 12 },
      formatter: (params: unknown) => {
        const point = (params as { axisValue: string; value: string }[])[0];
        return `<span style="color:#94a3b8;font-size:11px">${point.axisValue}</span><br/><span style="color:#f97316;font-weight:700;font-size:14px">¥${point.value}</span>`;
      },
    },
    xAxis: {
      type: 'category',
      data: safeTrendDates,
      axisLine: { lineStyle: { color: 'rgba(226,232,240,0.5)' } },
      axisTick: { show: false },
      axisLabel: {
        color: '#94a3b8',
        fontSize: 10,
        interval: revenuePeriod === 'month' ? 4 : revenuePeriod === 'season' ? 1 : 0,
      },
      boundaryGap: false,
    },
    yAxis: {
      type: 'value',
      axisLine: { show: false },
      axisTick: { show: false },
      splitLine: { lineStyle: { color: 'rgba(226,232,240,0.4)', type: 'dashed' } },
      axisLabel: {
        color: '#94a3b8',
        fontSize: 10,
        formatter: (value: number) => value >= 10000 ? `${(value / 10000).toFixed(1)}w` : String(value),
      },
    },
    series: [{
      type: 'line',
      data: safeTrendValuesDisplay,
      smooth: 0.4,
      symbol: 'circle',
      symbolSize: 6,
      showSymbol: false,
      lineStyle: { color: '#f97316', width: 3, shadowColor: 'rgba(249,115,22,0.35)', shadowBlur: 8 },
      itemStyle: {
        color: '#f97316',
        borderColor: '#fff',
        borderWidth: 2,
        shadowColor: 'rgba(249,115,22,0.5)',
        shadowBlur: 6,
      },
      emphasis: { scale: true, focus: 'self' },
      areaStyle: {
        color: {
          type: 'linear',
          x: 0,
          y: 0,
          x2: 0,
          y2: 1,
          colorStops: [
            { offset: 0, color: 'rgba(249,115,22,0.22)' },
            { offset: 0.6, color: 'rgba(249,115,22,0.06)' },
            { offset: 1, color: 'rgba(249,115,22,0)' },
          ],
        },
      },
    }],
    });
  }, [revenuePeriod, trend.dates, trend.valuesDisplay]);

  return {
    pieOption,
    pieChartHeight: REVENUE_DETAIL_CHART_HEIGHTS.typePie,
    revenueChartOption,
    revenueChartHeight: REVENUE_DETAIL_CHART_HEIGHTS.trend,
  };
};
