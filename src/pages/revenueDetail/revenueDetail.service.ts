import { createKeyedInFlightRequest, http, resolveEnvPath } from '@utils/http';
import { safeNum } from '@utils/utils';
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
const DEFAULT_REVENUE_TYPE_LABELS = ['月卡会员', '季度会员', '年卡会员', '其他充值'] as const;

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

  return normalizedValue >= 100000 ? safeNum(normalizedValue / 100) : safeNum(normalizedValue);
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
  const directRegion = pickStringField(value, ['region', 'regionName', 'areaName']);
  if (directRegion) {
    return directRegion;
  }

  const parts = [
    pickStringField(value, ['province', 'provinceName']),
    pickStringField(value, ['city', 'cityName']),
    pickStringField(value, ['district', 'districtName', 'area']),
  ].filter(Boolean);

  return parts.length > 0 ? parts.join(' · ') : '--';
};

const buildPeriodRoot = (response: unknown, period: RevenuePeriod): Record<string, unknown> | null => {
  const revenueRoot = getNestedRecord(response, ['revenue', 'revenueOverview', 'income', 'recharge'])
    ?? getNestedRecord(response, ['overview'])
    ?? (isPlainObject(response) ? response : null);

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

const mapSummary = (response: unknown, period: RevenuePeriod): RevenueDetailSummary => {
  const summaryRoot = getNestedRecord(response, ['summary', 'stats', 'overview'])
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
  const trendRoot = getNestedRecord(response, ['trend', 'trendData', 'chart'])
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
  const rawItems = getNestedArray(response, ['revenueTypes', 'typeDistribution', 'distribution', 'typeStats']);
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

  return mapRevenueDetail(response, query.period);
};

export const fetchRevenueDetail = createKeyedInFlightRequest(
  (query: RevenueDetailQuery) => JSON.stringify(query),
  async (query: RevenueDetailQuery): Promise<RevenueDetailData> => requestRevenueDetail(query),
);
