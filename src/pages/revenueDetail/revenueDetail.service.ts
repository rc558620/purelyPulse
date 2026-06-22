import { formatRegionValue } from '@constants/regionData';
import { createKeyedInFlightRequest, http, resolveEnvPath } from '@utils/http';
import { safeNum } from '@utils/utils';
import { readMembershipRevenueSyncEvents } from '../memberList/memberList.service';
import type { MembershipRevenueSyncPayload } from '../memberList/memberList.service';
import type {
  RevenueDetailData,
  RevenueDetailQuery,
  RevenueDetailSummary,
  RevenueDetailTrend,
  RevenuePeriod,
  RevenueRecordItem,
  RevenueTypeItem,
} from './revenueDetail.types';

const REVENUE_DETAIL_API_PATH = resolveEnvPath(import.meta.env.VITE_REVENUE_DETAIL_API_PATH, '/revenue-detail');
const DEFAULT_REVENUE_TYPE_LABELS = ['月卡会员', '季度会员', '年卡会员', '永久会员', '其他充值'] as const;

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

const toYuanAmount = (value: unknown): number => {
  const normalizedValue = normalizeNumber(value);
  if (!normalizedValue) {
    return 0;
  }

  // Pulse revenue detail amount fields are returned in fen.
  return safeNum(normalizedValue / 100);
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

const pickStringArray = (value: unknown, keys: readonly string[]): string[] => {
  return getNestedArray(value, keys)
    .filter((item): item is string => typeof item === 'string')
    .map((item) => item.trim())
    .filter(Boolean);
};

const pickNumberArray = (value: unknown, keys: readonly string[]): number[] => {
  return getNestedArray(value, keys)
    .map((item) => normalizeNumber(item))
    .filter((item) => Number.isFinite(item));
};

const formatDateLabel = (value: unknown): string => {
  if (typeof value === 'string' && value.trim()) {
    return value.trim();
  }

  const numericValue = normalizeNumber(value);
  if (!numericValue) {
    return '';
  }

  const timestamp = numericValue < 1_000_000_000_000 ? numericValue * 1000 : numericValue;
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) {
    return '';
  }

  return `${date.getMonth() + 1}/${date.getDate()}`;
};

const formatRecordTime = (value: unknown): string => {
  if (typeof value === 'string' && value.trim()) {
    const trimmedValue = value.trim();
    const matchedTime = trimmedValue.match(/\b\d{1,2}:\d{2}\b/);
    if (matchedTime) {
      return matchedTime[0];
    }

    return trimmedValue;
  }

  const numericValue = normalizeNumber(value);
  if (!numericValue) {
    return '--';
  }

  const timestamp = numericValue < 1_000_000_000_000 ? numericValue * 1000 : numericValue;
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) {
    return '--';
  }

  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
};

const buildRegionText = (value: unknown): string => {
  const directRegion = formatRegionValue(
    pickStringField(value, ['region', 'regionName', 'areaName', 'regionCode', 'areaCode', 'districtCode']),
  );
  if (directRegion) {
    return directRegion;
  }

  const regionLabels = [
    pickStringField(value, ['province', 'provinceName']),
    pickStringField(value, ['city', 'cityName']),
    pickStringField(value, ['district', 'districtName', 'area']),
  ].filter(Boolean);
  if (regionLabels.length > 0) {
    return regionLabels.join(' · ');
  }

  const regionCodePath = [
    pickStringField(value, ['provinceCode']),
    pickStringField(value, ['cityCode']),
    pickStringField(value, ['districtCode', 'areaCode']),
  ].filter(Boolean);

  return formatRegionValue(regionCodePath) || '--';
};

const resolveRevenueRoot = (response: unknown): Record<string, unknown> | null => {
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

const buildPeriodRoot = (response: unknown, period: RevenuePeriod): Record<string, unknown> | null => {
  const revenueRoot = resolveRevenueRoot(response);

  if (!revenueRoot) {
    return null;
  }

  return getNestedRecord(revenueRoot, [period, `${period}Data`, `${period}Overview`])
    ?? getNestedRecord(getNestedRecord(revenueRoot, ['periods', 'series', 'trendByPeriod']), [period])
    ?? null;
};

const createEmptySummary = (): RevenueDetailSummary => ({
  total: 0,
  avg: 0,
  growth: 0,
  orders: 0,
  peak: 0,
});

const createEmptyTrend = (): RevenueDetailTrend => ({
  dates: [],
  values: [],
});

export const createEmptyRevenueDetail = (): RevenueDetailData => ({
  summary: createEmptySummary(),
  trend: createEmptyTrend(),
  revenueTypes: DEFAULT_REVENUE_TYPE_LABELS.map((label) => ({ label, value: 0 })),
  records: [],
  totalRecords: 0,
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

const parseDateText = (value: string | null): Date | null => {
  if (!value) {
    return null;
  }

  const [year, month, day] = value.split('/').map((item) => Number(item));
  if (!year || !month || !day) {
    return null;
  }

  return new Date(year, month - 1, day);
};

const isMembershipRevenueEventInPeriod = (timestamp: number, period: RevenuePeriod, now: Date): boolean => {
  const endTime = now.getTime();
  const startTime = (
    period === 'today' ? getStartOfDay(now)
      : period === 'week' ? getStartOfWeek(now)
        : period === 'month' ? getStartOfMonth(now)
          : getStartOfQuarter(now)
  ).getTime();

  return timestamp >= startTime && timestamp <= endTime;
};

const matchesRevenueDetailQuery = (event: MembershipRevenueSyncPayload, query: RevenueDetailQuery): boolean => {
  if (query.regionValues.length > 0) {
    return false;
  }

  const eventDate = getStartOfDay(new Date(event.createdAt)).getTime();
  if (query.date) {
    return eventDate === getStartOfDay(parseDateText(query.date) ?? new Date(0)).getTime();
  }

  if (query.startDate || query.endDate) {
    const startDate = query.startDate ? getStartOfDay(parseDateText(query.startDate) ?? new Date(0)).getTime() : Number.NEGATIVE_INFINITY;
    const endDate = query.endDate ? getStartOfDay(parseDateText(query.endDate) ?? new Date(8.64e15)).getTime() : Number.POSITIVE_INFINITY;
    return eventDate >= startDate && eventDate <= endDate;
  }

  return isMembershipRevenueEventInPeriod(event.createdAt, query.period, new Date());
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

const mergeRevenueTypes = (
  revenueTypes: RevenueTypeItem[],
  totalBefore: number,
  events: MembershipRevenueSyncPayload[],
): RevenueTypeItem[] => {
  if (events.length === 0) {
    return revenueTypes;
  }

  const labelOrder: string[] = [];
  const labelSet = new Set<string>();
  [...DEFAULT_REVENUE_TYPE_LABELS, ...revenueTypes.map((item) => item.label), ...events.map((item) => item.revenueTypeLabel)].forEach((label) => {
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
  return labelOrder.map((label) => ({
    label,
    value: totalAfter > 0 ? safeNum(Number((((amountMap.get(label) ?? 0) / totalAfter) * 100).toFixed(1))) : 0,
  }));
};

const resolveAverageDivisor = (query: RevenueDetailQuery, trendLength: number): number => {
  if (query.date) {
    return 1;
  }

  if (query.startDate && query.endDate) {
    const startDate = parseDateText(query.startDate);
    const endDate = parseDateText(query.endDate);
    if (startDate && endDate) {
      const diffDays = Math.floor((getStartOfDay(endDate).getTime() - getStartOfDay(startDate).getTime()) / 86_400_000) + 1;
      return Math.max(diffDays, 1);
    }
  }

  return Math.max(trendLength, 1);
};

const buildManualRevenueRecord = (event: MembershipRevenueSyncPayload): RevenueRecordItem => ({
  id: `membership-revenue-${event.memberId}-${event.createdAt}-${event.level}`,
  user: event.memberName,
  type: event.revenueTypeLabel,
  amount: safeNum(event.amountFen / 100),
  region: '--',
  time: formatRecordTime(event.createdAt),
});

const applyMembershipRevenueEventsToRevenueDetail = (
  detail: RevenueDetailData,
  query: RevenueDetailQuery,
): RevenueDetailData => {
  const events = readMembershipRevenueSyncEvents()
    .filter((event) => matchesRevenueDetailQuery(event, query))
    .sort((left, right) => left.createdAt - right.createdAt);
  if (events.length === 0) {
    return detail;
  }

  const trend = events.reduce<{ dates: string[]; values: number[] }>((accumulator, event) => (
    mergeAmountIntoTrend(accumulator.dates, accumulator.values, event)
  ), {
    dates: [...detail.trend.dates],
    values: [...detail.trend.values],
  });
  const addedTotal = events.reduce((sum, event) => safeNum(sum + safeNum(event.amountFen / 100)), 0);
  const peakByDay = events.reduce<Map<string, number>>((accumulator, event) => {
    const label = formatDateLabel(event.createdAt) || '今日';
    accumulator.set(label, safeNum((accumulator.get(label) ?? 0) + safeNum(event.amountFen / 100)));
    return accumulator;
  }, new Map<string, number>());
  const addedPeak = Array.from(peakByDay.values()).reduce((maxValue, value) => Math.max(maxValue, value), 0);
  const total = safeNum(detail.summary.total + addedTotal);
  const avgDivisor = resolveAverageDivisor(query, trend.values.length);
  const manualRecords = [...events]
    .sort((left, right) => right.createdAt - left.createdAt)
    .map((event) => buildManualRevenueRecord(event));

  return {
    ...detail,
    summary: {
      ...detail.summary,
      total,
      avg: safeNum(total / avgDivisor),
      orders: safeNum(detail.summary.orders + events.length),
      peak: Math.max(detail.summary.peak, addedPeak),
    },
    trend,
    revenueTypes: mergeRevenueTypes(detail.revenueTypes, detail.summary.total, events),
    records: manualRecords.concat(detail.records),
    totalRecords: safeNum(detail.totalRecords + events.length),
  };
};

const mapSummary = (response: unknown, period: RevenuePeriod): RevenueDetailSummary => {
  const summaryRoot = getNestedRecord(response, ['revenueSummary', 'summary', 'stats', 'overview'])
    ?? buildPeriodRoot(response, period)
    ?? (isPlainObject(response) ? response : null);

  if (!summaryRoot) {
    return createEmptySummary();
  }

  return {
    total: toYuanAmount(summaryRoot.total ?? summaryRoot.totalAmount ?? summaryRoot.revenue ?? summaryRoot.amount),
    avg: toYuanAmount(summaryRoot.avg ?? summaryRoot.avgAmount ?? summaryRoot.averageAmount),
    growth: pickNumberField(summaryRoot, ['growth', 'growthRate', 'compareRate', 'increaseRate']),
    orders: pickNumberField(summaryRoot, ['orders', 'orderCount', 'totalOrders', 'count']),
    peak: toYuanAmount(summaryRoot.peak ?? summaryRoot.peakAmount ?? summaryRoot.maxAmount),
  };
};

const mapTrend = (response: unknown, period: RevenuePeriod): RevenueDetailTrend => {
  const trendRoot = getNestedRecord(response, ['revenueTrend', 'trend', 'trendData', 'chart'])
    ?? buildPeriodRoot(response, period)
    ?? (isPlainObject(response) ? response : null);

  if (!trendRoot) {
    return createEmptyTrend();
  }

  const dates = pickStringArray(trendRoot, ['dates', 'labels', 'xAxis', 'categories']);
  const values = pickNumberArray(trendRoot, ['values', 'data', 'series', 'amounts']);

  return {
    dates: dates.length > 0
      ? dates
      : getNestedArray(trendRoot, ['dates', 'labels', 'xAxis', 'categories']).map((item) => formatDateLabel(item)).filter(Boolean),
    values,
  };
};

const mapRevenueTypes = (response: unknown): RevenueTypeItem[] => {
  const rawItems = getNestedArray(response, ['revenueTypes', 'revenueTypeBreakdown', 'typeDistribution', 'distribution', 'typeStats']);
  if (rawItems.length === 0) {
    return DEFAULT_REVENUE_TYPE_LABELS.map((label) => ({ label, value: 0 }));
  }

  const mappedItems = rawItems
    .map((item): RevenueTypeItem | null => {
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
    .filter((item): item is RevenueTypeItem => item !== null);

  return mappedItems.length > 0 ? mappedItems : DEFAULT_REVENUE_TYPE_LABELS.map((label) => ({ label, value: 0 }));
};

const mapRecords = (response: unknown): RevenueRecordItem[] => {
  const rawItems = getNestedArray(response, ['records', 'details', 'list', 'items', 'rows', 'data']);

  return rawItems
    .map((item): RevenueRecordItem | null => {
      if (!isPlainObject(item)) {
        return null;
      }

      const id = pickStringField(item, ['id', 'recordId', 'orderId', 'tradeNo']) || `record-${Math.random().toString(36).slice(2, 10)}`;
      const user = pickStringField(item, ['user', 'userName', 'memberName', 'customerName']) || '未知用户';
      const type = pickStringField(item, ['type', 'typeName', 'memberCardType', 'category']) || '其他充值';

      return {
        id,
        user,
        type,
        amount: toYuanAmount(item.amount ?? item.payAmount ?? item.revenue),
        region: buildRegionText(item),
        time: formatRecordTime(item.time ?? item.createdAt ?? item.payTime),
      };
    })
    .filter((item): item is RevenueRecordItem => item !== null);
};

const mapRevenueDetail = (response: unknown, period: RevenuePeriod): RevenueDetailData => {
  const emptyData = createEmptyRevenueDetail();
  const records = mapRecords(response);

  return {
    ...emptyData,
    summary: mapSummary(response, period),
    trend: mapTrend(response, period),
    revenueTypes: mapRevenueTypes(response),
    records,
    totalRecords: pickNumberField(response, ['totalRecords', 'total', 'count', 'totalCount']) || records.length,
  };
};

const buildRequestParams = (query: RevenueDetailQuery): Record<string, string | undefined> => {
  const regionValues = query.regionValues.filter(Boolean);
  const [provinceCode, cityCode, districtCode] = regionValues;
  const isCustomQuery = Boolean(query.date || query.startDate || query.endDate);

  return {
    period: isCustomQuery ? undefined : query.period,
    date: query.date ?? undefined,
    startDate: query.startDate ?? undefined,
    endDate: query.endDate ?? undefined,
    regionValues: regionValues.length > 0 ? regionValues.join(',') : undefined,
    regionCode: regionValues.length > 0 ? regionValues[regionValues.length - 1] : undefined,
    provinceCode,
    cityCode,
    districtCode,
  };
};

const requestRevenueDetail = async (query: RevenueDetailQuery): Promise<RevenueDetailData> => {
  const response = await http.get<unknown>(REVENUE_DETAIL_API_PATH, {
    params: buildRequestParams(query),
    skipGlobalErrorHandler: true,
    errorMessage: '获取充值收入明细失败',
  });

  return applyMembershipRevenueEventsToRevenueDetail(mapRevenueDetail(response, query.period), query);
};

export const fetchRevenueDetail = createKeyedInFlightRequest(
  (query: RevenueDetailQuery) => JSON.stringify(query),
  async (query: RevenueDetailQuery): Promise<RevenueDetailData> => requestRevenueDetail(query),
);
