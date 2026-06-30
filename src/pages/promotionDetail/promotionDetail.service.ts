import { createKeyedInFlightRequest, http, resolveEnvPath } from '@utils/http';
import { safeNum } from '@utils/utils';
import type {
  PromotionDetailData,
  PromotionDetailQuery,
  PromotionDetailSummary,
  PromotionDetailTotal,
  PromotionPartnerItem,
  PromotionPartnerSeries,
  PromotionPeriodRecord,
  PromotionPeriodTab,
  PromotionRegionItem,
} from './promotionDetail.types';

const PROMOTION_DETAIL_API_PATH = resolveEnvPath(import.meta.env.VITE_PROMOTION_DETAIL_API_PATH, '/pulse/growth/admin/promo-detail');

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

/** 直接从后端响应中读取展示字符串字段，前端不做转换 */
const pickDisplayField = (value: unknown, keys: readonly string[]): string => {
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

const normalizeDateLabel = (value: unknown, tab?: PromotionPeriodTab): string => {
  if (typeof value === 'string' && value.trim()) {
    return value.trim();
  }

  const numericValue = normalizeNumber(value);
  if (!numericValue) {
    return '';
  }

  // 优先识别时间戳：秒级（< 1e12）或毫秒级（>= 1e12），阈值 1e9 排除年/月小数字
  if (numericValue >= 1_000_000_000) {
    const timestamp = numericValue < 1_000_000_000_000 ? numericValue * 1000 : numericValue;
    const date = new Date(timestamp);
    if (!Number.isNaN(date.getTime())) {
      if (tab === 'year') {
        return `${date.getFullYear()}年`;
      }

      if (tab === 'month') {
        return `${date.getMonth() + 1}月`;
      }

      return `${date.getMonth() + 1}/${date.getDate()}`;
    }
  }

  if (tab === 'year' && numericValue >= 1000 && numericValue <= 9999) {
    return `${numericValue}年`;
  }

  if (tab === 'month' && numericValue >= 1 && numericValue <= 12) {
    return `${numericValue}月`;
  }

  // 年月组合值识别：6 位数字如 202406 → "2024年6月"
  if (tab === 'month' && numericValue >= 100001 && numericValue <= 999912) {
    const ymYear = Math.floor(numericValue / 100);
    const ymMonth = numericValue % 100;
    if (ymYear >= 1000 && ymYear <= 9999 && ymMonth >= 1 && ymMonth <= 12) {
      return `${ymYear}年${ymMonth}月`;
    }
  }

  return String(numericValue);
};

const normalizeDateText = (value: unknown): string => {
  if (typeof value === 'string' && value.trim()) {
    return value.trim();
  }

  const label = normalizeDateLabel(value, 'day');
  return label || '--';
};

const normalizePhone = (value: unknown): string => {
  if (typeof value === 'string' && value.trim()) {
    return value.trim();
  }

  const numericValue = normalizeNumber(value);
  if (!numericValue) {
    return '--';
  }

  return String(Math.trunc(numericValue));
};

/**
 * 标准化省份名称：去除 省/市/自治区/特别行政区/壮族/回族/维吾尔 等后缀/中缀，
 * 使 "浙江省" → "浙江"、"广西壮族自治区" → "广西"、"北京市" → "北京"，
 * 确保 partner.province 与 region.province 在 derived hook 中能精确匹配。
 */
export const normalizeProvinceName = (name: string): string => {
  const trimmed = name.trim();
  if (!trimmed) {
    return trimmed;
  }

  // 特殊自治区：全称 → 简称（必须在通用规则之前处理）
  const specialRegionMap: Record<string, string> = {
    '广西壮族自治区': '广西',
    '宁夏回族自治区': '宁夏',
    '新疆维吾尔自治区': '新疆',
    '香港特别行政区': '香港',
    '澳门特别行政区': '澳门',
  };

  const specialName = specialRegionMap[trimmed];
  if (specialName) {
    return specialName;
  }

  // 通用后缀去除
  return trimmed
    .replace(/自治区$/, '')
    .replace(/省$/, '')
    .replace(/市$/, '');
};

const resolveAvatarText = (explicitAvatar: unknown, name: string): string => {
  if (typeof explicitAvatar === 'string' && explicitAvatar.trim()) {
    return explicitAvatar.trim().slice(0, 2);
  }

  const normalizedName = name.trim();
  if (!normalizedName) {
    return 'A';
  }

  return normalizedName.slice(0, 1).toUpperCase();
};

const createEmptySummary = (): PromotionDetailSummary => ({
  totalPartners: 0,
  totalOrders: 0,
  totalRevenueDisplay: '',
});

const createEmptyDetailTotal = (): PromotionDetailTotal => ({
  orders: 0,
  revenueDisplay: '',
});

export const createEmptyPromotionDetail = (): PromotionDetailData => ({
  regions: [],
  partners: [],
  summary: createEmptySummary(),
  detailTotal: createEmptyDetailTotal(),
});

const mapPeriodRecords = (value: unknown, tab: PromotionPeriodTab): PromotionPeriodRecord[] => {
  const rawItems = getNestedArray(value, [
    `${tab}Records`,
    `${tab}Series`,
    `${tab}Trend`,
    `${tab}List`,
    tab,
    'records',
    'series',
    'trend',
    'list',
    'items',
    'data',
  ]);

  return rawItems
    .map((item): PromotionPeriodRecord | null => {
      if (!isPlainObject(item)) {
        return null;
      }

      const label = pickStringField(item, ['label', 'date', 'period', 'month', 'year', 'name'])
        || normalizeDateLabel(item.timestamp ?? item.time ?? item.value, tab);
      if (!label) {
        return null;
      }

      return {
        label,
        orders: pickNumberField(item, ['orders', 'orderCount', 'count', 'promotionOrders']),
        revenueDisplay: pickDisplayField(item, ['revenueDisplay', 'amountDisplay', 'totalAmountDisplay', 'incomeDisplay']),
      };
    })
    .filter((item): item is PromotionPeriodRecord => item !== null);
};

const extractPartnerSeriesRoot = (
  response: unknown,
  item: Record<string, unknown>,
  partnerId: string,
): Record<string, unknown> | null => {
  const nestedRoot = getNestedRecord(item, ['detail', 'details', 'trend', 'trends', 'series', 'stats']);
  if (nestedRoot) {
    return nestedRoot;
  }

  const detailMap = getNestedRecord(response, ['partnerDetailMap', 'partnerDetails', 'detailsByPartner', 'partnerSeriesMap', 'trendMap']);
  if (detailMap && isPlainObject(detailMap[partnerId])) {
    return detailMap[partnerId] as Record<string, unknown>;
  }

  return null;
};

const mapPartnerSeries = (
  response: unknown,
  item: Record<string, unknown>,
  partnerId: string,
): PromotionPartnerSeries => {
  const detailRoot = extractPartnerSeriesRoot(response, item, partnerId) ?? item;

  return {
    day: mapPeriodRecords(detailRoot, 'day'),
    month: mapPeriodRecords(detailRoot, 'month'),
    year: mapPeriodRecords(detailRoot, 'year'),
  };
};

const mapPartnerItem = (
  response: unknown,
  item: Record<string, unknown>,
  fallbackProvince = '',
): PromotionPartnerItem | null => {
  const id = pickStringField(item, ['id', 'partnerId', 'userId', 'memberId'])
    || `partner-${Math.random().toString(36).slice(2, 10)}`;
  const name = pickStringField(item, ['name', 'partnerName', 'userName', 'memberName']);
  if (!name) {
    return null;
  }

  const province = normalizeProvinceName(pickStringField(item, ['province', 'provinceName', 'region', 'regionName']) || fallbackProvince);
  const city = pickStringField(item, ['city', 'cityName']) || province || '--';
  const district = pickStringField(item, ['district', 'districtName', 'area', 'areaName']);
  const series = mapPartnerSeries(response, item, id);

  return {
    id,
    name,
    province,
    city,
    district: district || undefined,
    orders: pickNumberField(item, ['orders', 'orderCount', 'promotionOrders', 'count']),
    revenueDisplay: pickDisplayField(item, ['revenueDisplay', 'amountDisplay', 'totalAmountDisplay', 'incomeDisplay']),
    growth: pickNumberField(item, ['growth', 'growthRate', 'increaseRate', 'compareRate']),
    avatar: resolveAvatarText(item.avatar ?? item.avatarText, name),
    avatarUrl: typeof item.avatarUrl === 'string' && item.avatarUrl.trim() ? item.avatarUrl.trim() : undefined,
    rank: Math.max(0, pickNumberField(item, ['rank', 'sort', 'orderNo', 'index'])),
    joinDate: normalizeDateText(item.joinDate ?? item.createdAt ?? item.applyTime ?? item.registerTime),
    phone: normalizePhone(item.phone ?? item.mobile ?? item.mobilePhone),
    series,
  };
};

const extractPartnersFromRegions = (response: unknown, regions: unknown[]): PromotionPartnerItem[] => {
  const partners: PromotionPartnerItem[] = [];

  regions.forEach((regionItem) => {
    if (!isPlainObject(regionItem)) {
      return;
    }

    const province = pickStringField(regionItem, ['province', 'provinceName', 'region', 'regionName', 'name', 'label']);
    const regionPartners = getNestedArray(regionItem, ['partners', 'partnerList', 'items', 'rows', 'list', 'data']);
    regionPartners.forEach((partnerItem) => {
      if (!isPlainObject(partnerItem)) {
        return;
      }

      const mappedPartner = mapPartnerItem(response, partnerItem, province);
      if (mappedPartner) {
        partners.push(mappedPartner);
      }
    });
  });

  return partners;
};

const dedupePartners = (partners: PromotionPartnerItem[]): PromotionPartnerItem[] => {
  const partnerMap = new Map<string, PromotionPartnerItem>();

  partners.forEach((partner) => {
    const existingPartner = partnerMap.get(partner.id);
    if (!existingPartner) {
      partnerMap.set(partner.id, partner);
      return;
    }

    const nextPartner: PromotionPartnerItem = {
      ...existingPartner,
      ...partner,
      series: {
        day: partner.series.day.length > 0 ? partner.series.day : existingPartner.series.day,
        month: partner.series.month.length > 0 ? partner.series.month : existingPartner.series.month,
        year: partner.series.year.length > 0 ? partner.series.year : existingPartner.series.year,
      },
    };

    partnerMap.set(partner.id, nextPartner);
  });

  return [...partnerMap.values()].sort((leftPartner, rightPartner) => {
    const leftRank = leftPartner.rank > 0 ? leftPartner.rank : Number.MAX_SAFE_INTEGER;
    const rightRank = rightPartner.rank > 0 ? rightPartner.rank : Number.MAX_SAFE_INTEGER;

    if (leftRank !== rightRank) {
      return leftRank - rightRank;
    }

    return rightPartner.orders - leftPartner.orders;
  });
};

const mapPartners = (response: unknown): PromotionPartnerItem[] => {
  const rawRegions = getNestedArray(response, ['regions', 'regionList', 'provinceList', 'areaStats', 'distribution']);
  const directPartners = getNestedArray(response, ['partners', 'partnerList', 'partnerStats', 'users', 'members', 'items', 'rows', 'list', 'data'])
    .map((item) => (isPlainObject(item) ? mapPartnerItem(response, item) : null))
    .filter((item): item is PromotionPartnerItem => item !== null);
  const regionPartners = rawRegions.length > 0 ? extractPartnersFromRegions(response, rawRegions) : [];

  return dedupePartners([...directPartners, ...regionPartners]);
};

const mapRegionItem = (item: Record<string, unknown>): PromotionRegionItem | null => {
  const rawProvince = pickStringField(item, ['province', 'provinceName', 'region', 'regionName', 'name', 'label']);
  if (!rawProvince) {
    return null;
  }

  const province = normalizeProvinceName(rawProvince);

  return {
    province,
    city: pickStringField(item, ['city', 'cityName']) || undefined,
    partnerCount: pickNumberField(item, ['partnerCount', 'partners', 'count', 'totalPartners']),
    totalOrders: pickNumberField(item, ['totalOrders', 'orders', 'orderCount', 'promotionOrders']),
    totalRevenueDisplay: pickDisplayField(item, ['totalRevenueDisplay', 'revenueDisplay', 'totalAmountDisplay', 'amountDisplay']),
    growth: pickNumberField(item, ['growth', 'growthRate', 'increaseRate', 'compareRate']),
  };
};

const mapRegions = (response: unknown): PromotionRegionItem[] => {
  const rawRegions = getNestedArray(response, ['regions', 'regionList', 'provinceList', 'areaStats', 'distribution']);
  const mappedRegions = rawRegions
    .map((item) => (isPlainObject(item) ? mapRegionItem(item) : null))
    .filter((item): item is PromotionRegionItem => item !== null);

  return mappedRegions.sort((leftRegion, rightRegion) => {
    if (rightRegion.partnerCount !== leftRegion.partnerCount) {
      return rightRegion.partnerCount - leftRegion.partnerCount;
    }

    // 排序仍可基于 partnerCount，金额仅做展示
    return 0;
  });
};

const mapSummary = (response: unknown): PromotionDetailSummary => {
  const summarySource = getNestedRecord(response, ['summary', 'overview', 'stats', 'totals'])
    ?? (isPlainObject(response) ? response : null);

  if (!summarySource) {
    return createEmptySummary();
  }

  return {
    totalPartners: pickNumberField(summarySource, ['totalPartners', 'partnerCount', 'partners', 'total']),
    totalOrders: pickNumberField(summarySource, ['totalOrders', 'orders', 'orderCount', 'totalOrderCount']),
    totalRevenueDisplay: pickDisplayField(summarySource, ['totalRevenueDisplay', 'revenueDisplay', 'totalAmountDisplay', 'incomeDisplay']),
  };
};

const mapDetailTotal = (response: unknown): PromotionDetailTotal => {
  const detailSource = getNestedRecord(response, ['detailSummary', 'detailTotal', 'detailStats', 'partnerSummary'])
    ?? (isPlainObject(response) ? response : null);

  if (!detailSource) {
    return createEmptyDetailTotal();
  }

  return {
    orders: pickNumberField(detailSource, ['orders', 'orderCount', 'totalOrders', 'count']),
    revenueDisplay: pickDisplayField(detailSource, ['revenueDisplay', 'totalRevenueDisplay', 'amountDisplay', 'totalAmountDisplay']),
  };
};

const mapPromotionDetail = (response: unknown): PromotionDetailData => {
  const partners = mapPartners(response);
  const regions = mapRegions(response);
  const summary = mapSummary(response);
  const detailTotal = mapDetailTotal(response);

  return {
    regions,
    partners,
    summary,
    detailTotal,
  };
};

const buildRequestParams = (query: PromotionDetailQuery): Record<string, string | undefined> => {
  const regionValues = query.regionValues.filter(Boolean);
  const [provinceCode, cityCode, districtCode] = regionValues;

  return {
    keyword: query.name || undefined,
    queryMode: query.queryMode,
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

const requestPromotionDetail = async (query: PromotionDetailQuery): Promise<PromotionDetailData> => {
  const response = await http.get<unknown>(PROMOTION_DETAIL_API_PATH, {
    params: buildRequestParams(query),
    skipGlobalErrorHandler: true,
    errorMessage: '获取推广详情失败',
  });

  return mapPromotionDetail(response);
};

export const fetchPromotionDetail = createKeyedInFlightRequest(
  (query: PromotionDetailQuery) => JSON.stringify(query),
  async (query: PromotionDetailQuery): Promise<PromotionDetailData> => requestPromotionDetail(query),
);
