import { formatRegionValue } from '@constants/regionData';
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

const isFieldPresent = (value: unknown): boolean => value !== undefined && value !== null;

/** 直接从后端响应中读取金额展示字符串字段，前端不做转换 */
const pickDisplayField = (value: unknown, keys: readonly string[]): string => {
  if (!isPlainObject(value)) {
    return '';
  }

  for (const key of keys) {
    const candidate = (value as Record<string, unknown>)[key];
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
    if (!(key in value)) {
      continue;
    }

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
  totalDisplay: '',
  avgDisplay: '',
  growth: 0,
  orders: 0,
  peakDisplay: '',
});

const createEmptyTrend = (): RevenueDetailTrend => ({
  dates: [],
  valuesDisplay: [],
});

export const createEmptyRevenueDetail = (): RevenueDetailData => ({
  summary: createEmptySummary(),
  trend: createEmptyTrend(),
  revenueTypes: DEFAULT_REVENUE_TYPE_LABELS.map((label) => ({ label, value: 0 })),
  records: [],
  totalRecords: 0,
});

const mapSummary = (response: unknown, period: RevenuePeriod): RevenueDetailSummary => {
  const summaryRoot = getNestedRecord(response, ['revenueSummary', 'summary', 'stats', 'overview'])
    ?? buildPeriodRoot(response, period)
    ?? (isPlainObject(response) ? response : null);

  if (!summaryRoot) {
    return createEmptySummary();
  }

  return {
    totalDisplay: pickDisplayField(summaryRoot, ['totalDisplay', 'totalFen', 'totalAmount', 'revenue', 'amount', 'total']),
    avgDisplay: pickDisplayField(summaryRoot, ['avgDisplay', 'avgFen', 'avgAmount', 'averageAmount', 'avg']),
    growth: pickNumberField(summaryRoot, ['growth', 'growthRate', 'compareRate', 'increaseRate']),
    orders: pickNumberField(summaryRoot, ['orders', 'orderCount', 'totalOrders', 'count']),
    peakDisplay: pickDisplayField(summaryRoot, ['peakDisplay', 'peakFen', 'peakAmount', 'maxAmount', 'peak']),
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
  const valuesDisplay = getNestedArray(trendRoot, ['valuesDisplay', 'values', 'data', 'series', 'amounts'])
    .map((item): string => {
      if (typeof item === 'string' && item.trim()) return item.trim();
      return '';
    })
    .filter(Boolean);

  return {
    dates: dates.length > 0
      ? dates
      : getNestedArray(trendRoot, ['dates', 'labels', 'xAxis', 'categories']).map((item) => formatDateLabel(item)).filter(Boolean),
    valuesDisplay,
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

      const id = pickStringField(item, ['id', 'recordId', 'orderId', 'tradeNo'])
        || `record-${pickStringField(item, ['user', 'userName', 'memberName'])}-${safeNum(normalizeNumber(item.amount ?? item.payAmount))}-${pickStringField(item, ['time', 'createdAt', 'payTime'])}`;
      const user = pickStringField(item, ['user', 'userName', 'memberName', 'customerName']) || '未知用户';
      const type = pickStringField(item, ['type', 'typeName', 'memberCardType', 'category']) || '其他充值';

      return {
        id,
        user,
        type,
        amountDisplay: pickDisplayField(item, ['amountDisplay', 'amountFen', 'amount', 'payAmount', 'revenue']),
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
