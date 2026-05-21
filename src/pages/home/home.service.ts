// 首页总览服务层：封装首页接口请求、字段映射与默认值兜底。
import { createKeyedInFlightRequest, http, resolveEnvPath } from '@utils/http';
import { safeNum } from '@utils/utils';
import type {
  HomeOverviewData,
  HomePartnerRankItem,
  HomePartnerStats,
  HomeRevenuePeriodData,
  HomeRevenueTypeItem,
  RevenuePeriod,
} from './home.types';

const HOME_OVERVIEW_API_PATH = resolveEnvPath(import.meta.env.VITE_HOME_OVERVIEW_API_PATH, '/pulse/dashboard/home');
const REVENUE_PERIODS: RevenuePeriod[] = ['today', 'week', 'month', 'season'];
const REVENUE_TYPE_DEFAULTS = ['月卡会员', '季度会员', '年卡会员', '其他充值'] as const;

const isPlainObject = (value: unknown): value is Record<string, unknown> => (
  typeof value === 'object' && value !== null && !Array.isArray(value)
);

const getNestedRecord = (value: unknown, keys: readonly string[]): Record<string, unknown> | null => {
  if (!isPlainObject(value)) {
    return null;
  }

  for (const key of keys) {
    const candidate = value[key];
    if (isPlainObject(candidate)) {
      return candidate;
    }
  }

  return null;
};

const getNestedArray = (value: unknown, keys: readonly string[]): unknown[] => {
  if (Array.isArray(value)) {
    return value;
  }

  if (!isPlainObject(value)) {
    return [];
  }

  for (const key of keys) {
    const candidate = value[key];
    if (Array.isArray(candidate)) {
      return candidate;
    }
  }

  return [];
};

const normalizeNumber = (value: unknown): number => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === 'string') {
    const sanitizedValue = value.replace(/,/g, '').trim();
    if (!sanitizedValue) {
      return 0;
    }
    const parsedValue = Number(sanitizedValue);
    if (Number.isFinite(parsedValue)) {
      return parsedValue;
    }
  }

  return 0;
};

const pickStringField = (value: unknown, keys: readonly string[]): string => {
  if (!isPlainObject(value)) {
    return '';
  }

  for (const key of keys) {
    const candidate = value[key];
    if (typeof candidate === 'string' && candidate.trim()) {
      return candidate.trim();
    }
  }

  return '';
};

const pickNumberField = (value: unknown, keys: readonly string[]): number => {
  if (!isPlainObject(value)) {
    return 0;
  }

  for (const key of keys) {
    const candidate = value[key];
    const normalizedValue = normalizeNumber(candidate);
    if (normalizedValue !== 0 || candidate === 0 || candidate === '0') {
      return safeNum(normalizedValue);
    }
  }

  return 0;
};

const pickNumberArray = (value: unknown, keys: readonly string[]): number[] => {
  const rawArray = getNestedArray(value, keys);
  return rawArray
    .map((item) => normalizeNumber(item))
    .filter((item) => Number.isFinite(item));
};

const pickStringArray = (value: unknown, keys: readonly string[]): string[] => {
  const rawArray = getNestedArray(value, keys);
  return rawArray
    .filter((item): item is string => typeof item === 'string')
    .map((item) => item.trim())
    .filter(Boolean);
};

const formatDateLabel = (value: unknown): string => {
  if (typeof value === 'string' && value.trim()) {
    return value.trim();
  }

  const numericValue = normalizeNumber(value);
  if (numericValue > 0) {
    const timestamp = numericValue < 1_000_000_000_000 ? numericValue * 1000 : numericValue;
    const date = new Date(timestamp);
    if (!Number.isNaN(date.getTime())) {
      return `${date.getMonth() + 1}/${date.getDate()}`;
    }
  }

  return '';
};

const toYuanAmount = (value: unknown): number => {
  const normalizedValue = normalizeNumber(value);
  if (!normalizedValue) {
    return 0;
  }

  return normalizedValue >= 100000 ? safeNum(normalizedValue / 100) : safeNum(normalizedValue);
};

const createEmptyRevenuePeriod = (): HomeRevenuePeriodData => ({
  dates: [],
  values: [],
  total: 0,
  avg: 0,
  growth: 0,
});

const createEmptyPartnerStats = (): HomePartnerStats => ({
  total: 0,
  newThisMonth: 0,
  activeRate: 0,
  totalRevenue: 0,
  totalOrders: 0,
  avgPerPartner: 0,
});

export const createEmptyHomeOverview = (): HomeOverviewData => ({
  onlineCount: 0,
  onlinePeak: 0,
  onlineTrend: [],
  onlineGrowthRate: 0,
  pendingApplicationCount: 0,
  partnerStats: createEmptyPartnerStats(),
  revenueByPeriod: {
    today: createEmptyRevenuePeriod(),
    week: createEmptyRevenuePeriod(),
    month: createEmptyRevenuePeriod(),
    season: createEmptyRevenuePeriod(),
  },
  revenueTypes: REVENUE_TYPE_DEFAULTS.map((label) => ({ label, value: 0 })),
  partnerTop: [],
});

const resolveRevenueRoot = (response: unknown): Record<string, unknown> | null => (
  getNestedRecord(response, ['revenue', 'revenueOverview', 'income', 'recharge', 'revenueTrend'])
  ?? getNestedRecord(response, ['overview'])
  ?? (isPlainObject(response) ? response : null)
);

const mapRevenuePeriod = (revenueRoot: Record<string, unknown> | null, period: RevenuePeriod): HomeRevenuePeriodData => {
  if (!revenueRoot) {
    return createEmptyRevenuePeriod();
  }

  const periodRecord = getNestedRecord(revenueRoot, [period, `${period}Data`, `${period}Overview`])
    ?? getNestedRecord(getNestedRecord(revenueRoot, ['periods', 'series', 'trendByPeriod']), [period])
    ?? null;

  if (periodRecord) {
    const dates = pickStringArray(periodRecord, ['dates', 'labels', 'xAxis', 'categories']);
    const values = pickNumberArray(periodRecord, ['values', 'data', 'series', 'amounts']);
    const rawDateItems = dates.length > 0 ? dates : getNestedArray(periodRecord, ['dates', 'labels', 'xAxis', 'categories']).map((item) => formatDateLabel(item)).filter(Boolean);

    return {
      dates: rawDateItems,
      values,
      total: toYuanAmount(periodRecord.total ?? periodRecord.totalAmount ?? periodRecord.sumAmount),
      avg: toYuanAmount(periodRecord.avg ?? periodRecord.avgAmount ?? periodRecord.averageAmount),
      growth: pickNumberField(periodRecord, ['growth', 'growthRate', 'compareRate', 'increaseRate']),
    };
  }

  const summaryRoot = getNestedRecord(revenueRoot, ['revenueSummary', 'summary']);
  const trendRoot = getNestedRecord(revenueRoot, ['revenueTrend', 'trend']);
  if (!summaryRoot && !trendRoot) {
    return createEmptyRevenuePeriod();
  }

  const periodAliases: Record<RevenuePeriod, string[]> = {
    today: ['today'],
    week: ['week'],
    month: ['month', 'default'],
    season: ['season', 'quarter'],
  };
  const summaryPeriod = periodAliases[period].find((candidate) => {
    const responsePeriod = pickStringField(summaryRoot, ['period', 'revenuePeriod']).toLowerCase();
    return candidate === responsePeriod;
  });

  if (!summaryPeriod && period !== 'month') {
    return createEmptyRevenuePeriod();
  }

  const dates = pickStringArray(trendRoot, ['dates', 'labels', 'xAxis', 'categories']);
  const values = pickNumberArray(trendRoot, ['values', 'data', 'series', 'amounts']);
  const rawDateItems = dates.length > 0 ? dates : getNestedArray(trendRoot, ['dates', 'labels', 'xAxis', 'categories']).map((item) => formatDateLabel(item)).filter(Boolean);

  return {
    dates: rawDateItems,
    values,
    total: toYuanAmount(summaryRoot?.total ?? summaryRoot?.totalAmount ?? summaryRoot?.sumAmount),
    avg: toYuanAmount(summaryRoot?.avg ?? summaryRoot?.avgAmount ?? summaryRoot?.averageAmount),
    growth: pickNumberField(summaryRoot, ['growth', 'growthRate', 'compareRate', 'increaseRate']),
  };
};

const mapOnlineSection = (response: unknown): Pick<HomeOverviewData, 'onlineCount' | 'onlinePeak' | 'onlineTrend' | 'onlineGrowthRate'> => {
  const onlineRoot = getNestedRecord(response, ['online', 'onlineOverview', 'live', 'liveOverview'])
    ?? (isPlainObject(response) ? response : null);

  if (!onlineRoot) {
    return {
      onlineCount: 0,
      onlinePeak: 0,
      onlineTrend: [],
      onlineGrowthRate: 0,
    };
  }

  return {
    onlineCount: pickNumberField(onlineRoot, ['onlineCount', 'count', 'currentOnline', 'currentCount']),
    onlinePeak: pickNumberField(onlineRoot, ['onlinePeak', 'peak', 'peakCount', 'todayPeak']),
    onlineTrend: pickNumberArray(onlineRoot, ['onlineTrend', 'trend', 'trendData', 'series', 'values']),
    onlineGrowthRate: pickNumberField(onlineRoot, ['onlineGrowthRate', 'onlineChangeRatio', 'growthRate', 'compareRate', 'increaseRate']),
  };
};

const mapPartnerStats = (response: unknown): Pick<HomeOverviewData, 'partnerStats' | 'pendingApplicationCount'> => {
  const partnerRoot = getNestedRecord(response, ['partnerStats', 'partnerOverview', 'partner', 'partnerSummary'])
    ?? (isPlainObject(response) ? response : null);
  const reviewRoot = getNestedRecord(response, ['partnerReview', 'reviewStats', 'review', 'reviewOverview']);

  const partnerStats: HomePartnerStats = partnerRoot ? {
    total: pickNumberField(partnerRoot, ['total', 'partnerTotal', 'partnerCount']),
    newThisMonth: pickNumberField(partnerRoot, ['newThisMonth', 'newCount', 'newPartnerCount']),
    activeRate: pickNumberField(partnerRoot, ['activeRate', 'activityRate', 'activePercent']),
    totalRevenue: toYuanAmount(partnerRoot.totalRevenue ?? partnerRoot.totalIncome ?? partnerRoot.revenue),
    totalOrders: pickNumberField(partnerRoot, ['totalOrders', 'orderCount', 'orders']),
    avgPerPartner: toYuanAmount(partnerRoot.avgPerPartner ?? partnerRoot.avgIncome ?? partnerRoot.averageRevenue),
  } : createEmptyPartnerStats();

  return {
    partnerStats,
    pendingApplicationCount: reviewRoot
      ? pickNumberField(reviewRoot, ['pendingApplicationCount', 'pendingCount', 'waitingCount', 'todoCount'])
      : pickNumberField(partnerRoot, ['pendingApplicationCount', 'pendingReviewCount', 'pendingCount']),
  };
};

const mapRevenueTypes = (response: unknown): HomeRevenueTypeItem[] => {
  const rawTypeItems = getNestedArray(response, ['revenueTypes', 'revenueTypeDistribution', 'typeDistribution', 'rechargeTypes', 'revenueTypeBreakdown']);
  if (rawTypeItems.length === 0) {
    return REVENUE_TYPE_DEFAULTS.map((label) => ({ label, value: 0 }));
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

  return mappedItems.length > 0 ? mappedItems : REVENUE_TYPE_DEFAULTS.map((label) => ({ label, value: 0 }));
};

const mapPartnerTop = (response: unknown): HomePartnerRankItem[] => {
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
        city: pickStringField(item, ['city', 'regionName', 'storeCity']) || '--',
        orders: pickNumberField(item, ['orders', 'orderCount', 'totalOrders']),
        revenue: toYuanAmount(item.revenue ?? item.totalRevenue ?? item.income),
      };
    })
    .filter((item): item is HomePartnerRankItem => item !== null)
    .slice(0, 5);
};

const mapHomeOverview = (response: unknown): HomeOverviewData => {
  const emptyOverview = createEmptyHomeOverview();
  const revenueRoot = resolveRevenueRoot(response);
  const onlineSection = mapOnlineSection(response);
  const partnerSection = mapPartnerStats(response);
  const partnerTop = mapPartnerTop(response);

  const revenueByPeriod = REVENUE_PERIODS.reduce<Record<RevenuePeriod, HomeRevenuePeriodData>>((accumulator, period) => {
    accumulator[period] = mapRevenuePeriod(revenueRoot, period);
    return accumulator;
  }, {
    today: createEmptyRevenuePeriod(),
    week: createEmptyRevenuePeriod(),
    month: createEmptyRevenuePeriod(),
    season: createEmptyRevenuePeriod(),
  });

  return {
    ...emptyOverview,
    ...onlineSection,
    ...partnerSection,
    revenueByPeriod,
    revenueTypes: mapRevenueTypes(response),
    partnerTop,
  };
};

const requestHomeOverview = async (): Promise<HomeOverviewData> => {
  const response = await http.get<unknown>(HOME_OVERVIEW_API_PATH, {
    skipGlobalErrorHandler: true,
    errorMessage: '获取首页总览失败',
  });

  return mapHomeOverview(response);
};

export const fetchHomeOverview = createKeyedInFlightRequest(
  () => 'home-overview',
  async (): Promise<HomeOverviewData> => requestHomeOverview(),
);
