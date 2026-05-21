// 推广详情图表 hooks：统一封装趋势图 option 与固定高度。
import { useMemo } from 'react';
import * as echarts from 'echarts';
import { fmtAmount } from '@utils/utils';
import type { PromotionPeriodRecord } from './promotionDetail.types';
import { PROMOTION_DETAIL_CHART_HEIGHTS } from './promotionDetail.constants';

interface UsePromotionTrendChartReturn {
  trendChartOption: echarts.EChartsOption;
  trendChartHeight: number;
}

export const usePromotionTrendChart = (
  records: PromotionPeriodRecord[],
): UsePromotionTrendChartReturn => {
  const trendChartOption = useMemo<echarts.EChartsOption>(() => ({
    backgroundColor: 'transparent',
    grid: { left: '4%', right: '4%', top: '14%', bottom: '12%', containLabel: true },
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(255,255,255,0.96)',
      borderColor: '#e2e8f0',
      borderWidth: 1,
      textStyle: { color: '#1e293b', fontSize: 12 },
      formatter: (params: echarts.TooltipComponentFormatterCallbackParams) => {
        if (!Array.isArray(params) || params.length === 0) {
          return '';
        }

        const [ordersParam, revenueParam] = params as Array<{ value: number; name: string }>;
        return `<div style="font-weight:700;margin-bottom:4px;color:#64748b">${ordersParam?.name ?? ''}</div>
                <div style="display:flex;gap:16px">
                  <span>推广单：<b style="color:#84cc16">${ordersParam?.value ?? 0} 单</b></span>
                  <span>金额：<b style="color:#10b981">¥${fmtAmount(revenueParam?.value ?? 0)}</b></span>
                </div>`;
      },
    },
    legend: {
      top: 4,
      right: 8,
      icon: 'roundRect',
      itemWidth: 10,
      itemHeight: 6,
      textStyle: { fontSize: 11, color: '#64748b' },
      data: ['推广单数', '推广金额'],
    },
    xAxis: {
      type: 'category',
      data: records.map((record) => record.label),
      axisLine: { lineStyle: { color: '#e2e8f0' } },
      axisTick: { show: false },
      axisLabel: { fontSize: 10, color: '#94a3b8', interval: 0, rotate: records.length > 10 ? 30 : 0 },
    },
    yAxis: [
      {
        type: 'value',
        name: '单数',
        nameTextStyle: { fontSize: 10, color: '#94a3b8' },
        axisLabel: { fontSize: 10, color: '#94a3b8' },
        splitLine: { lineStyle: { color: '#f1f5f9', type: 'dashed' } },
        axisLine: { show: false },
        axisTick: { show: false },
      },
      {
        type: 'value',
        name: '金额',
        nameTextStyle: { fontSize: 10, color: '#94a3b8' },
        axisLabel: {
          fontSize: 10,
          color: '#94a3b8',
          formatter: (value: number) => (value >= 1000 ? `${(value / 1000).toFixed(0)}k` : String(value)),
        },
        splitLine: { show: false },
        axisLine: { show: false },
        axisTick: { show: false },
      },
    ],
    series: [
      {
        name: '推广单数',
        type: 'bar',
        yAxisIndex: 0,
        data: records.map((record) => record.orders),
        barMaxWidth: 28,
        itemStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: '#84cc16' },
            { offset: 1, color: '#a3e635' },
          ]),
          borderRadius: [4, 4, 0, 0],
        },
      },
      {
        name: '推广金额',
        type: 'line',
        yAxisIndex: 1,
        data: records.map((record) => record.revenue),
        smooth: true,
        symbol: 'circle',
        symbolSize: 5,
        lineStyle: { color: '#10b981', width: 2 },
        itemStyle: { color: '#10b981', borderWidth: 2, borderColor: '#fff' },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(16,185,129,0.18)' },
            { offset: 1, color: 'rgba(16,185,129,0.02)' },
          ]),
        },
      },
    ],
  }), [records]);

  return {
    trendChartOption,
    trendChartHeight: PROMOTION_DETAIL_CHART_HEIGHTS.trend,
  };
};
