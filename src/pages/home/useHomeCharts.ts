// 首页图表 hooks：统一封装在线趋势与充值收入图表的 option / height。
import { useMemo } from 'react';
import { fmtAmount, isNonEmptyArray } from '@utils/utils';
import type { HomeRevenuePeriodData, RevenuePeriod } from './home.types';
import { HOME_CHART_HEIGHTS } from './home.constants';

interface UseHomeSparklineChartReturn {
  sparklineOption: echarts.EChartsOption;
  sparklineHeight: number;
}

interface UseHomeRevenueChartReturn {
  revenueChartOption: echarts.EChartsOption;
  revenueChartHeight: number;
}

export const useHomeSparklineChart = (onlineTrend: number[]): UseHomeSparklineChartReturn => {
  const sparklineOption = useMemo<echarts.EChartsOption>(() => ({
    grid: { top: 0, bottom: 0, left: 0, right: 0 },
    xAxis: { type: 'category', show: false, data: onlineTrend.map((_, index) => index) },
    yAxis: { type: 'value', show: false },
    series: [{
      type: 'line',
      data: onlineTrend,
      smooth: true,
      symbol: 'none',
      lineStyle: { color: '#84cc16', width: 2.5 },
      areaStyle: {
        color: {
          type: 'linear',
          x: 0,
          y: 0,
          x2: 0,
          y2: 1,
          colorStops: [
            { offset: 0, color: 'rgba(132,204,22,0.4)' },
            { offset: 1, color: 'rgba(132,204,22,0.02)' },
          ],
        },
      },
    }],
  }), [onlineTrend]);

  return {
    sparklineOption,
    sparklineHeight: HOME_CHART_HEIGHTS.sparkline,
  };
};

export const useHomeRevenueChart = (
  revenuePeriod: RevenuePeriod,
  revenueSummary: HomeRevenuePeriodData,
): UseHomeRevenueChartReturn => {
  const revenueDates = isNonEmptyArray(revenueSummary.dates) ? revenueSummary.dates : ['暂无数据'];
  const revenueValues = isNonEmptyArray(revenueSummary.values) ? revenueSummary.values : [0];

  const revenueChartOption = useMemo<echarts.EChartsOption>(() => ({
    grid: { top: 16, bottom: 40, left: 52, right: 16 },
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(255,255,255,0.96)',
      borderColor: '#e2e8f0',
      borderWidth: 1,
      textStyle: { color: '#1e293b', fontSize: 12 },
      formatter: (params: unknown) => {
        const firstPoint = (params as { axisValue: string; value: number }[])[0];
        return `${firstPoint.axisValue}：¥${fmtAmount(firstPoint.value)}`;
      },
    },
    xAxis: {
      type: 'category',
      data: revenueDates,
      axisLine: { lineStyle: { color: '#e2e8f0' } },
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
      splitLine: { lineStyle: { color: '#f1f5f9' } },
      axisLabel: {
        color: '#94a3b8',
        fontSize: 10,
        formatter: (value: number) => (value >= 10000 ? `${(value / 10000).toFixed(1)}w` : String(value)),
      },
    },
    series: [{
      type: 'line',
      data: revenueValues,
      smooth: true,
      symbol: 'circle',
      symbolSize: 5,
      showSymbol: false,
      lineStyle: { color: '#84cc16', width: 2.5 },
      itemStyle: { color: '#84cc16' },
      areaStyle: {
        color: {
          type: 'linear',
          x: 0,
          y: 0,
          x2: 0,
          y2: 1,
          colorStops: [
            { offset: 0, color: 'rgba(132,204,22,0.28)' },
            { offset: 1, color: 'rgba(132,204,22,0.02)' },
          ],
        },
      },
    }],
  }), [revenueDates, revenuePeriod, revenueValues]);

  return {
    revenueChartOption,
    revenueChartHeight: HOME_CHART_HEIGHTS.revenueTrend,
  };
};
