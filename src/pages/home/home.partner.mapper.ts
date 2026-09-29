// 首页合伙人板块映射：合伙人统计、待审数量与推广排行榜。
// 前端禁止金额转换和格式化，收入一律取后端 xxxDisplay 字段。
import { resolveRegionFieldName } from '@constants/regionData';
import { createEmptyPartnerStats } from './home.defaults';
import {
  getNestedArray,
  getNestedRecord,
  isPlainObject,
  pickDisplayField,
  pickNumberField,
  pickStringField,
} from './home.normalize';
import type { HomeOverviewData, HomePartnerRankItem, HomePartnerStats } from './home.types';

/** 推广榜最多展示条数。 */
const PARTNER_TOP_LIMIT = 5;

/** 待审合伙人：优先顶层概览字段，其次 review 容器，最后回到合伙人容器。 */
const resolvePendingApplicationCount = (
  response: unknown,
  partnerRoot: Record<string, unknown> | null,
  reviewRoot: Record<string, unknown> | null,
): number => {
  const topLevelPendingCount = isPlainObject(response)
    ? pickNumberField(response, ['pendingApplicationCount', 'pendingReviewCount', 'pendingCount'])
    : 0;

  if (topLevelPendingCount > 0) {
    return topLevelPendingCount;
  }

  if (reviewRoot) {
    return pickNumberField(reviewRoot, ['pendingApplicationCount', 'pendingCount', 'waitingCount', 'todoCount']);
  }

  return pickNumberField(partnerRoot, ['pendingApplicationCount', 'pendingReviewCount', 'pendingCount']);
};

export const mapPartnerStats = (response: unknown): Pick<HomeOverviewData, 'partnerStats' | 'pendingApplicationCount'> => {
  const partnerRoot = getNestedRecord(response, ['partnerStats', 'partnerOverview', 'partner', 'partnerSummary'])
    ?? (isPlainObject(response) ? response : null);
  const reviewRoot = getNestedRecord(response, ['partnerReview', 'reviewStats', 'review', 'reviewOverview']);

  const partnerStats: HomePartnerStats = partnerRoot ? {
    total: pickNumberField(partnerRoot, ['total', 'partnerTotal', 'partnerCount']),
    newThisMonth: pickNumberField(partnerRoot, ['newThisMonth', 'newCount', 'newPartnerCount']),
    activeRate: pickNumberField(partnerRoot, ['activeRate', 'activityRate', 'activePercent']),
    totalRevenueDisplay: pickDisplayField(partnerRoot, ['totalRevenueDisplay', 'totalIncomeDisplay', 'revenueDisplay']),
    totalOrders: pickNumberField(partnerRoot, ['totalOrders', 'orderCount', 'orders']),
    avgPerPartnerDisplay: pickDisplayField(partnerRoot, ['avgPerPartnerDisplay', 'avgIncomeDisplay', 'averageRevenueDisplay']),
  } : createEmptyPartnerStats();

  return {
    partnerStats,
    pendingApplicationCount: resolvePendingApplicationCount(response, partnerRoot, reviewRoot),
  };
};

/** 推广榜：兼容顶层列表与 ranking 容器内的列表，取前 PARTNER_TOP_LIMIT 条。 */
export const mapPartnerTop = (response: unknown): HomePartnerRankItem[] => {
  const rankingRoot = getNestedRecord(response, ['ranking', 'partnerRanking', 'promotionRanking', 'topPartners']);
  const rawItems = getNestedArray(response, ['partnerTop', 'topPartners'])
    .concat(getNestedArray(rankingRoot, ['list', 'items', 'rows', 'data', 'partners']));

  return rawItems
    .map((item): HomePartnerRankItem | null => {
      if (!isPlainObject(item)) {
        return null;
      }

      const id = pickStringField(item, ['id', 'partnerId', 'userId']) || pickStringField(item, ['name', 'partnerName', 'userName']);
      if (!id) {
        return null;
      }

      const name = pickStringField(item, ['name', 'partnerName', 'userName']) || '未命名合伙人';
      return {
        id,
        name,
        city: resolveRegionFieldName(pickStringField(item, ['city', 'regionName', 'storeCity'])) || '--',
        orders: pickNumberField(item, ['orders', 'orderCount', 'totalOrders']),
        revenueDisplay: pickDisplayField(item, ['revenueDisplay', 'totalRevenueDisplay', 'incomeDisplay']),
      };
    })
    .filter((item): item is HomePartnerRankItem => item !== null)
    .slice(0, PARTNER_TOP_LIMIT);
};
