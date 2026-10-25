// 首页图表 hooks：统一封装在线人数柱状图与充值收入图表的 option / height。
// 金额展示值由后端直接返回字符串，前端不再做分转元和格式化。
import { useMemo } from 'react';
import { isNonEmptyArray, safeNum } from '@utils/utils';
import type { HomeRevenuePeriodData, RevenuePeriod } from './home.types';
import {
  HOME_CHART_HEIGHTS,
  HOME_ONLINE_BAR_COLORS,
  HOME_ONLINE_BAR_LABELS,
} from './home.constants';

interface UseHomeOnlineBarChartParams {
  /** 商家端（purelyProfit）在线人数 */
  profitCount: number;
  /** 个人端（purelyClub）在线人数 */
  clubCount: number;
  /** 在线总人数：后端下发的权威合计值，前端不做求和 */
  totalCount: number;
}

interface UseHomeOnlineBarChartReturn {
  onlineBarOption: echarts.EChartsOption;
  onlineBarHeight: number;
}

interface UseHomeRevenueChartReturn {
  revenueChartOption: echarts.EChartsOption;
  revenueChartHeight: number;
}

/**
 * 在线人数对比柱状图：三根柱子依次是商家端、个人端与在线总人数。
 * 三个数值全部来自接口，前端只负责渲染，不做任何汇总计算。
 */
export const useHomeOnlineBarChart = ({
  profitCount,
  clubCount,
  totalCount,
}: UseHomeOnlineBarChartParams): UseHomeOnlineBarChartReturn => {
  const onlineBarOption = useMemo<echarts.EChartsOption>(() => ({
    grid: { top: 28, bottom: 4, left: 4, right: 4, containLabel: true },
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      backgroundColor: 'rgba(255,255,255,0.96)',
      borderColor: '#e2e8f0',
      borderWidth: 1,
      textStyle: { color: '#1e293b', fontSize: 12 },
      formatter: (params: unknown) => {
        const firstPoint = (params as { name: string; value: number }[])[0];
        return `${firstPoint.name}：${firstPoint.value} 人`;
      },
    },
    xAxis: {
      type: 'category',
      data: [...HOME_ONLINE_BAR_LABELS],
      axisLine: { lineStyle: { color: '#e2e8f0' } },
      axisTick: { show: false },
      axisLabel: { color: '#64748b', fontSize: 10, interval: 0 },
    },
    yAxis: {
      type: 'value',
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: { show: false },
      splitLine: { lineStyle: { color: '#f1f5f9' } },
    },
    series: [{
      type: 'bar',
      data: [profitCount, clubCount, totalCount].map((value, index) => ({
        value,
        itemStyle: {
          color: HOME_ONLINE_BAR_COLORS[index],
          borderRadius: [6, 6, 0, 0],
        },
      })),
      barWidth: '46%',
      label: {
        show: true,
        position: 'top',
        color: '#1e293b',
        fontSize: 11,
        fontWeight: 'bold',
        formatter: (params: unknown) => String(safeNum((params as { value: number | null }).value)),
      },
    }],
  }), [profitCount, clubCount, totalCount]);

  return {
    onlineBarOption,
    onlineBarHeight: HOME_CHART_HEIGHTS.onlineBreakdown,
  };
};

export const useHomeRevenueChart = (
  revenuePeriod: RevenuePeriod,
  revenueSummary: HomeRevenuePeriodData,
): UseHomeRevenueChartReturn => {
  const revenueDates = isNonEmptyArray(revenueSummary.dates) ? revenueSummary.dates : ['暂无数据'];
  // 坐标用原始数值（保证高低关系真实），展示一律走后端下发的展示字符串
  const revenueValues = isNonEmptyArray(revenueSummary.values) ? revenueSummary.values : [0];
  const revenueValueDisplays = revenueSummary.valuesDisplay;

  const revenueChartOption = useMemo<echarts.EChartsOption>(() => ({
    grid: { top: 16, bottom: 40, left: 52, right: 16 },
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(255,255,255,0.96)',
      borderColor: '#e2e8f0',
      borderWidth: 1,
      textStyle: { color: '#1e293b', fontSize: 12 },
      formatter: (params: unknown) => {
        const firstPoint = (params as { axisValue: string; dataIndex: number }[])[0];
        const displayValue = revenueValueDisplays[firstPoint?.dataIndex ?? -1] ?? '0';
        return `${firstPoint.axisValue}：¥${displayValue}`;
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
    // Y 轴必须是数值轴：此前用类目轴 + 字符串 series 会把「值」当成「类目序号」，
    // 导致第 i 个点恒落在坐标 (i, i)，折线与实际金额无关。刻度仍隐藏，金额展示只出现在 tooltip。
    yAxis: {
      type: 'value',
      axisLine: { show: false },
      axisTick: { show: false },
      splitLine: { lineStyle: { color: '#f1f5f9' } },
      axisLabel: { show: false },
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
  }), [revenueDates, revenuePeriod, revenueValueDisplays, revenueValues]);

  return {
    revenueChartOption,
    revenueChartHeight: HOME_CHART_HEIGHTS.revenueTrend,
  };
};
