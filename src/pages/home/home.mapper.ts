// 首页总览映射入口：串起在线 / 合伙人 / 营收三个板块，产出页面使用的完整前端模型。
import { REVENUE_PERIODS, createEmptyHomeOverview, createEmptyRevenueByPeriod } from './home.defaults';
import { mapOnlineSection } from './home.online.mapper';
import { mapPartnerStats, mapPartnerTop } from './home.partner.mapper';
import { mapRevenuePeriod, mapRevenueTypes, resolveRevenueRoot } from './home.revenue.mapper';
import type { HomeOverviewData, HomeRevenuePeriodData, RevenuePeriod } from './home.types';

/**
 * 把后端响应映射成首页总览。
 *
 * `requestedPeriod` 为本次请求的周期：后端若走「Summary + Trend」扁平结构，
 * 只把数据落到该周期，其余周期保持空态。
 */
export const mapHomeOverview = (
  response: unknown,
  requestedPeriod: RevenuePeriod,
): HomeOverviewData => {
  const emptyOverview = createEmptyHomeOverview();
  const revenueRoot = resolveRevenueRoot(response);

  const revenueByPeriod = REVENUE_PERIODS.reduce<Record<RevenuePeriod, HomeRevenuePeriodData>>((accumulator, period) => {
    accumulator[period] = mapRevenuePeriod(revenueRoot, period, requestedPeriod);
    return accumulator;
  }, createEmptyRevenueByPeriod());

  return {
    ...emptyOverview,
    ...mapOnlineSection(response),
    ...mapPartnerStats(response),
    revenueByPeriod,
    revenueTypes: mapRevenueTypes(response),
    partnerTop: mapPartnerTop(response),
  };
};
