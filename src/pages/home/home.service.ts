// 首页总览服务层：封装首页接口请求、字段映射与默认值兜底。
import { createKeyedInFlightRequest, http, resolveEnvPath } from '@utils/http';
import { safeNum } from '@utils/utils';
import { readMembershipRevenueSyncEvents } from '../memberList/memberList.service';
import type { MembershipRevenueSyncPayload } from '../memberList/memberList.service';
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
const REVENUE_TYPE_DEFAULTS = ['月卡会员', '季度会员', '年卡会员', '永久会员', '其他充值'] as const;

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

  // Pulse dashboard amounts are returned in fen.
  return safeNum(normalizedValue / 100);
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

const getStartOfDay = (date: Date): Date => new Date(date.getFullYear(), date.getMonth(), date.getDate());

const getStartOfWeek = (date: Date): Date => {
  const start = getStartOfDay(date);
  const day = start.getDay();
  const offset = day === 0 ? 6 : day - 1;
  start.setDate(start.getDate() - offset);
  return start;
};

const getStartOfMonth = (date: Date): Date => new Date(date.getFullYear(), date.getMonth(), 1);

const getStartOfQuarter = (date: Date): Date => new Date(date.getFullYear(), Math.floor(date.getMonth() / 3) * 3, 1);

const isMembershipRevenueEventInPeriod = (
  event: MembershipRevenueSyncPayload,
  period: RevenuePeriod,
  now: Date,
): boolean => {
  const eventTime = event.createdAt;
  const endTime = now.getTime();
  const startTime = (
    period === 'today' ? getStartOfDay(now)
      : period === 'week' ? getStartOfWeek(now)
        : period === 'month' ? getStartOfMonth(now)
          : getStartOfQuarter(now)
  ).getTime();

  return eventTime >= startTime && eventTime <= endTime;
};

const mergeAmountIntoTrend = (
  dates: string[],
  values: number[],
  event: MembershipRevenueSyncPayload,
): { dates: string[]; values: number[] } => {
  const amountYuan = safeNum(event.amountFen / 100);
  const label = formatDateLabel(event.createdAt) || '今日';
  const nextDates = [...dates];
  const nextValues = [...values];
  const labelIndex = nextDates.findIndex((item) => item === label);

  if (labelIndex >= 0 && nextValues[labelIndex] !== undefined) {
    nextValues[labelIndex] = safeNum(nextValues[labelIndex] + amountYuan);
    return { dates: nextDates, values: nextValues };
  }

  if (nextValues.length === 0) {
    return {
      dates: [label],
      values: [amountYuan],
    };
  }

  if (nextDates.length === nextValues.length && nextDates.every((item) => item.includes('/'))) {
    nextDates.push(label);
    nextValues.push(amountYuan);
    return { dates: nextDates, values: nextValues };
  }

  const lastIndex = nextValues.length - 1;
  nextValues[lastIndex] = safeNum(nextValues[lastIndex] + amountYuan);
  return { dates: nextDates, values: nextValues };
};

const applyMembershipRevenueEventsToPeriod = (
  periodData: HomeRevenuePeriodData,
  events: MembershipRevenueSyncPayload[],
): HomeRevenuePeriodData => {
  if (events.length === 0) {
    return periodData;
  }

  const sortedEvents = [...events].sort((left, right) => left.createdAt - right.createdAt);
  const mergedTrend = sortedEvents.reduce<{ dates: string[]; values: number[] }>((accumulator, event) => (
    mergeAmountIntoTrend(accumulator.dates, accumulator.values, event)
  ), {
    dates: [...periodData.dates],
    values: [...periodData.values],
  });

  const addedTotal = sortedEvents.reduce((sum, event) => safeNum(sum + safeNum(event.amountFen / 100)), 0);
  const total = safeNum(periodData.total + addedTotal);
  const avgDivisor = Math.max(mergedTrend.values.length, 1);

  return {
    ...periodData,
    dates: mergedTrend.dates,
    values: mergedTrend.values,
    total,
    avg: safeNum(total / avgDivisor),
  };
};

const mergeRevenueTypes = (
  revenueTypes: HomeRevenueTypeItem[],
  totalBefore: number,
  events: MembershipRevenueSyncPayload[],
): HomeRevenueTypeItem[] => {
  if (events.length === 0) {
    return revenueTypes;
  }

  const labelOrder: string[] = [];
  const labelSet = new Set<string>();
  [...REVENUE_TYPE_DEFAULTS, ...revenueTypes.map((item) => item.label), ...events.map((item) => item.revenueTypeLabel)].forEach((label) => {
    if (!labelSet.has(label)) {
      labelSet.add(label);
      labelOrder.push(label);
    }
  });

  const amountMap = new Map<string, number>();
  labelOrder.forEach((label) => {
    amountMap.set(label, 0);
  });

  revenueTypes.forEach((item) => {
    amountMap.set(item.label, safeNum(totalBefore * safeNum(item.value) / 100));
  });
  events.forEach((event) => {
    amountMap.set(event.revenueTypeLabel, safeNum((amountMap.get(event.revenueTypeLabel) ?? 0) + safeNum(event.amountFen / 100)));
  });

  const totalAfter = Array.from(amountMap.values()).reduce((sum, value) => safeNum(sum + value), 0);

  if (totalAfter <= 0) {
    return labelOrder.map((label) => ({ label, value: 0 }));
  }

  const rawPercentages = labelOrder.map((label) => {
    const amount = amountMap.get(label) ?? 0;
    return { label, raw: safeNum(Number(((amount / totalAfter) * 100).toFixed(1))) };
  });

  // 尾差补偿：将四舍五入误差加到最大项上，确保百分比总和精确为 100。
  const rawSum = rawPercentages.reduce((sum, item) => safeNum(sum + item.raw), 0);
  const roundingDelta = safeNum(Number((100 - rawSum).toFixed(1)));
  if (roundingDelta !== 0 && rawPercentages.length > 0) {
    const maxIndex = rawPercentages.reduce(
      (maxIdx, item, idx, arr) => (item.raw > arr[maxIdx].raw ? idx : maxIdx),
      0,
    );
    rawPercentages[maxIndex].raw = safeNum(rawPercentages[maxIndex].raw + roundingDelta);
  }

  return rawPercentages.map((item) => ({ label: item.label, value: item.raw }));
};

const applyMembershipRevenueEventsToOverview = (
  overview: HomeOverviewData,
  query: HomeOverviewQuery,
): HomeOverviewData => {
  if (query.region) {
    return overview;
  }

  const events = readMembershipRevenueSyncEvents();
  if (events.length === 0) {
    return overview;
  }

  const now = new Date();
  const revenueByPeriod = REVENUE_PERIODS.reduce<Record<RevenuePeriod, HomeRevenuePeriodData>>((accumulator, period) => {
    const matchedEvents = events.filter((event) => isMembershipRevenueEventInPeriod(event, period, now));
    accumulator[period] = applyMembershipRevenueEventsToPeriod(overview.revenueByPeriod[period], matchedEvents);
    return accumulator;
  }, {
    today: overview.revenueByPeriod.today,
    week: overview.revenueByPeriod.week,
    month: overview.revenueByPeriod.month,
    season: overview.revenueByPeriod.season,
  });
  const currentPeriodEvents = events.filter((event) => isMembershipRevenueEventInPeriod(event, query.revenuePeriod, now));

  return {
    ...overview,
    revenueByPeriod,
    revenueTypes: mergeRevenueTypes(overview.revenueTypes, overview.revenueByPeriod[query.revenuePeriod].total, currentPeriodEvents),
  };
};

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

export interface HomeOverviewQuery {
  revenuePeriod: RevenuePeriod;
  region?: string;
  customDate?: string;
  customRangeStart?: string;
  customRangeEnd?: string;
}

const resolveRevenueRoot = (response: unknown): Record<string, unknown> | null => {
  if (!isPlainObject(response)) {
    return null;
  }

  // Prefer the aggregate response object when summary/trend fields already live at top level.
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

const mapRevenuePeriod = (
  revenueRoot: Record<string, unknown> | null,
  period: RevenuePeriod,
  requestedPeriod: RevenuePeriod,
): HomeRevenuePeriodData => {
  if (!revenueRoot) {
    return createEmptyRevenuePeriod();
  }

  const periodRecord = getNestedRecord(revenueRoot, [period, `${period}Data`, `${period}Overview`])
    ?? getNestedRecord(getNestedRecord(revenueRoot, ['periods', 'series', 'trendByPeriod']), [period])
    ?? null;

  if (periodRecord) {
    const dates = pickStringArray(periodRecord, ['dates', 'labels', 'xAxis', 'categories']);
    const values = pickNumberArray(periodRecord, ['values', 'data', 'series', 'amounts'])
      .map((value) => toYuanAmount(value));
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

  if (!summaryPeriod && requestedPeriod !== period) {
    return createEmptyRevenuePeriod();
  }

  const dates = pickStringArray(trendRoot, ['dates', 'labels', 'xAxis', 'categories']);
  const values = pickNumberArray(trendRoot, ['values', 'data', 'series', 'amounts'])
    .map((value) => toYuanAmount(value));
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

  // 后端将 pendingApplicationCount 放在响应顶层，优先从顶层读取，
  // 再 fallback 到 reviewRoot → partnerRoot 子对象中查找。
  const topLevelPendingCount = isPlainObject(response)
    ? pickNumberField(response, ['pendingApplicationCount', 'pendingReviewCount', 'pendingCount'])
    : 0;

  return {
    partnerStats,
    pendingApplicationCount: topLevelPendingCount > 0
      ? topLevelPendingCount
      : reviewRoot
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

const mapHomeOverview = (
  response: unknown,
  requestedPeriod: RevenuePeriod,
): HomeOverviewData => {
  const emptyOverview = createEmptyHomeOverview();
  const revenueRoot = resolveRevenueRoot(response);
  const onlineSection = mapOnlineSection(response);
  const partnerSection = mapPartnerStats(response);
  const partnerTop = mapPartnerTop(response);

  const revenueByPeriod = REVENUE_PERIODS.reduce<Record<RevenuePeriod, HomeRevenuePeriodData>>((accumulator, period) => {
    accumulator[period] = mapRevenuePeriod(revenueRoot, period, requestedPeriod);
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

const requestHomeOverview = async (query: HomeOverviewQuery): Promise<HomeOverviewData> => {
  const response = await http.get<unknown>(HOME_OVERVIEW_API_PATH, {
    params: {
      revenuePeriod: query.revenuePeriod,
      region: query.region || undefined,
      customDate: query.customDate || undefined,
      customRangeStart: query.customRangeStart || undefined,
      customRangeEnd: query.customRangeEnd || undefined,
    },
    skipGlobalErrorHandler: true,
    errorMessage: '获取首页总览失败',
  });

  return applyMembershipRevenueEventsToOverview(mapHomeOverview(response, query.revenuePeriod), query);
};

export const fetchHomeOverview = createKeyedInFlightRequest(
  (query: HomeOverviewQuery) => JSON.stringify(query),
  async (query: HomeOverviewQuery): Promise<HomeOverviewData> => requestHomeOverview(query),
);
