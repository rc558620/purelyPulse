// 首页营收板块映射：周期趋势、汇总指标与充值类型分布。
// 前端禁止金额转换和格式化，趋势值 / 总额 / 日均一律取后端 xxxDisplay 字段。
import { createEmptyRevenuePeriod, createEmptyRevenueTypes } from './home.defaults';
import {
  formatDateLabel,
  getNestedArray,
  getNestedRecord,
  isPlainObject,
  pickDisplayArray,
  pickDisplayField,
  pickNumberField,
  pickStringArray,
  pickStringField,
} from './home.normalize';
import type { HomeRevenuePeriodData, HomeRevenueTypeItem, RevenuePeriod } from './home.types';

/** 后端周期 key 别名：不同后端版本对「季度」等周期命名不一致，这里统一兜底。 */
const REVENUE_PERIOD_ALIASES: Record<RevenuePeriod, string[]> = {
  today: ['today'],
  week: ['week'],
  month: ['month', 'default'],
  season: ['season', 'quarter'],
};

/** 营收根节点：响应可能是裸概览，也可能把营收塞在 revenue / overview 等容器里。 */
export const resolveRevenueRoot = (response: unknown): Record<string, unknown> | null => {
  if (!isPlainObject(response)) {
    return null;
  }

  if (
    isPlainObject(response.revenueTrend)
    || isPlainObject(response.revenueSummary)
    || Array.isArray(response.revenueTypeBreakdown)
    || Array.isArray(response.revenueTypes)
  ) {
    return response;
  }

  return getNestedRecord(response, ['revenue', 'revenueOverview', 'income', 'recharge'])
    ?? getNestedRecord(response, ['overview'])
    ?? response;
};

/** 趋势日期：优先后端下发的日期字符串数组，缺失时按时间戳归一成「月/日」。 */
const resolveTrendDates = (root: Record<string, unknown> | null): string[] => {
  const rawDates = pickStringArray(root, ['dates', 'labels', 'xAxis', 'categories']);
  if (rawDates.length > 0) {
    return rawDates;
  }

  return getNestedArray(root, ['dates', 'labels', 'xAxis', 'categories'])
    .map((item) => formatDateLabel(item))
    .filter(Boolean);
};

/** 周期指标：total / avg 取展示值，growth 为数字比率。 */
const resolvePeriodMetrics = (root: Record<string, unknown> | null) => ({
  totalDisplay: pickDisplayField(root, ['totalDisplay', 'totalAmountDisplay', 'sumAmountDisplay']),
  avgDisplay: pickDisplayField(root, ['avgDisplay', 'avgAmountDisplay', 'averageAmountDisplay']),
  growth: pickNumberField(root, ['growth', 'growthRate', 'compareRate', 'increaseRate']),
});

const buildRevenuePeriod = (source: Record<string, unknown> | null): HomeRevenuePeriodData => ({
  dates: resolveTrendDates(source),
  values: pickDisplayArray(source, ['valuesDisplay', 'amountsDisplay', 'dataDisplay']),
  ...resolvePeriodMetrics(source),
});

/**
 * 映射单个周期：优先取「按周期分桶」的结构，其次回落到「Summary + Trend」的扁平结构。
 * 非当前请求周期且分桶缺失时直接返回空态，避免把一份数据重复画到四个 tab 上。
 */
export const mapRevenuePeriod = (
  revenueRoot: Record<string, unknown> | null,
  period: RevenuePeriod,
  requestedPeriod: RevenuePeriod,
): HomeRevenuePeriodData => {
  if (!revenueRoot) {
    return createEmptyRevenuePeriod();
  }

  const periodRecord = getNestedRecord(revenueRoot, [period, `${period}Data`, `${period}Overview`])
    ?? getNestedRecord(getNestedRecord(revenueRoot, ['periods', 'series', 'trendByPeriod']), [period]);

  if (periodRecord) {
    return buildRevenuePeriod(periodRecord);
  }

  const summaryRoot = getNestedRecord(revenueRoot, ['revenueSummary', 'summary']);
  const trendRoot = getNestedRecord(revenueRoot, ['revenueTrend', 'trend']);
  if (!summaryRoot && !trendRoot) {
    return createEmptyRevenuePeriod();
  }

  const responsePeriod = pickStringField(summaryRoot, ['period', 'revenuePeriod']).toLowerCase();
  const isRequestedPeriod = REVENUE_PERIOD_ALIASES[period].some((candidate) => candidate === responsePeriod);
  if (!isRequestedPeriod && requestedPeriod !== period) {
    return createEmptyRevenuePeriod();
  }

  return {
    dates: resolveTrendDates(trendRoot),
    values: pickDisplayArray(trendRoot, ['valuesDisplay', 'amountsDisplay', 'dataDisplay']),
    ...resolvePeriodMetrics(summaryRoot),
  };
};

/** 充值类型分布：缺 label 的脏项直接丢弃，全部无效时回落到默认分类。 */
export const mapRevenueTypes = (response: unknown): HomeRevenueTypeItem[] => {
  const rawTypeItems = getNestedArray(response, ['revenueTypes', 'revenueTypeDistribution', 'typeDistribution', 'rechargeTypes', 'revenueTypeBreakdown']);
  if (rawTypeItems.length === 0) {
    return createEmptyRevenueTypes();
  }

  const mappedItems = rawTypeItems
    .map((item): HomeRevenueTypeItem | null => {
      if (!isPlainObject(item)) {
        return null;
      }

      const label = pickStringField(item, ['label', 'name', 'typeName', 'category']);
      if (!label) {
        return null;
      }

      return {
        label,
        value: pickNumberField(item, ['value', 'percent', 'ratio', 'rate']),
      };
    })
    .filter((item): item is HomeRevenueTypeItem => item !== null);

  return mappedItems.length > 0 ? mappedItems : createEmptyRevenueTypes();
};
