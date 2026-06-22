// 推广详情结果派生 hook：负责筛选结果、分组缓存与详情统计，聚合数值最终在 UI 层按 safeNum 规则展示。
import { useMemo } from 'react';
import { normalizeProvinceName } from '../promotionDetail.service';
import type {
  PromotionDetailData,
  PromotionDetailQuery,
  PromotionDetailQueryMeta,
  PromotionPartnerItem,
  PromotionPeriodRecord,
  PromotionPeriodTab,
  PromotionRegionItem,
} from '../promotionDetail.types';

interface DetailTotal {
  orders: number;
  revenue: number;
}

export interface UsePromotionDetailDerivedParams {
  data: PromotionDetailData;
  submittedQuery: PromotionDetailQuery | null;
  submittedQueryMeta: PromotionDetailQueryMeta;
  currentRegionText: string;
  currentDateText: string;
  selectedRegion: PromotionRegionItem | null;
  selectedPartner: PromotionPartnerItem | null;
  periodTab: PromotionPeriodTab;
}

export interface UsePromotionDetailDerivedReturn {
  regionDisplayText: string;
  dateDisplayText: string;
  filteredRegions: PromotionRegionItem[];
  totalPartners: number;
  totalOrders: number;
  totalRevenue: number;
  currentPartners: PromotionPartnerItem[];
  periodRecords: PromotionPeriodRecord[];
  detailTotal: DetailTotal;
}

interface RegionSummary {
  totalPartners: number;
  totalOrders: number;
  totalRevenue: number;
}

const EMPTY_REGION_SUMMARY: RegionSummary = {
  totalPartners: 0,
  totalOrders: 0,
  totalRevenue: 0,
};

const EMPTY_DETAIL_TOTAL: DetailTotal = {
  orders: 0,
  revenue: 0,
};

const normalizeNameKeyword = (value: string): string => value.trim();

const resolvePartnerProvince = (partner: PromotionPartnerItem): string => partner.province || partner.city;

const comparePartnerDisplayOrder = (
  leftPartner: PromotionPartnerItem,
  rightPartner: PromotionPartnerItem,
): number => {
  const leftRank = leftPartner.rank > 0 ? leftPartner.rank : Number.MAX_SAFE_INTEGER;
  const rightRank = rightPartner.rank > 0 ? rightPartner.rank : Number.MAX_SAFE_INTEGER;
  if (leftRank !== rightRank) {
    return leftRank - rightRank;
  }

  return rightPartner.orders - leftPartner.orders;
};

/**
 * 地区名匹配：对 label 和 partner 字段都做省份名标准化后再比较，
 * 避免子串匹配误判（如 "南" 匹配 "湖南"/"海南"）和后缀不一致（如 "浙江省" vs "浙江"）。
 */
const isRegionFieldMatched = (partnerFieldValue: string, label: string): boolean => {
  if (!label || !partnerFieldValue) {
    return true;
  }

  const normalizedLabel = normalizeProvinceName(label);
  const normalizedField = normalizeProvinceName(partnerFieldValue);

  // 精确匹配优先（标准化后 "浙江" === "浙江"）
  if (normalizedField === normalizedLabel) {
    return true;
  }

  // 兼容 label 比 partner 字段更具体的情况（如 label="杭州市", field="浙江"）
  if (normalizedField.includes(normalizedLabel) || normalizedLabel.includes(normalizedField)) {
    return true;
  }

  return false;
};

const isPartnerMatched = (
  partner: PromotionPartnerItem,
  nameKeyword: string,
  regionLabels: string[],
): boolean => {
  if (nameKeyword && !partner.name.includes(nameKeyword)) {
    return false;
  }

  const [provinceLabel, cityLabel, districtLabel] = regionLabels;
  if (provinceLabel && !isRegionFieldMatched(partner.province || '', provinceLabel)) {
    return false;
  }

  if (cityLabel && !isRegionFieldMatched(partner.city || '', cityLabel)) {
    return false;
  }

  if (districtLabel && !isRegionFieldMatched(partner.district || '', districtLabel)) {
    return false;
  }

  return true;
};

export const usePromotionDetailDerived = ({
  data,
  submittedQuery,
  submittedQueryMeta,
  currentRegionText,
  currentDateText,
  selectedRegion,
  selectedPartner,
  periodTab,
}: UsePromotionDetailDerivedParams): UsePromotionDetailDerivedReturn => {
  const submittedNameKeyword = normalizeNameKeyword(submittedQuery?.name ?? '');
  const hasClientFilter = submittedNameKeyword.length > 0 || submittedQueryMeta.regionLabels.length > 0;

  const matchedPartners = useMemo(() => {
    if (!submittedQuery || !hasClientFilter || data.partners.length === 0) {
      return data.partners;
    }

    return data.partners.filter((partner) => isPartnerMatched(partner, submittedNameKeyword, submittedQueryMeta.regionLabels));
  }, [data.partners, hasClientFilter, submittedNameKeyword, submittedQuery, submittedQueryMeta.regionLabels]);

  const matchedPartnerProvinceSet = useMemo(() => (
    new Set(matchedPartners.map((partner) => resolvePartnerProvince(partner)))
  ), [matchedPartners]);

  const filteredRegions = useMemo(() => {
    if (!submittedQuery || !hasClientFilter || data.partners.length === 0) {
      return data.regions;
    }

    if (matchedPartnerProvinceSet.size === 0) {
      return [];
    }

    return data.regions.filter((regionItem) => matchedPartnerProvinceSet.has(regionItem.province));
  }, [data.partners, data.regions, hasClientFilter, matchedPartnerProvinceSet, submittedQuery]);

  const regionSummary = useMemo(() => matchedPartners.reduce<RegionSummary>((summary, partner) => ({
    totalPartners: summary.totalPartners + 1,
    totalOrders: summary.totalOrders + partner.orders,
    totalRevenue: summary.totalRevenue + partner.revenue,
  }), EMPTY_REGION_SUMMARY), [matchedPartners]);

  const partnersByProvince = useMemo(() => {
    const provincePartnerMap = new Map<string, PromotionPartnerItem[]>();

    matchedPartners.forEach((partner) => {
      const province = resolvePartnerProvince(partner);
      const provincePartners = provincePartnerMap.get(province);
      if (provincePartners) {
        provincePartners.push(partner);
        return;
      }

      provincePartnerMap.set(province, [partner]);
    });

    provincePartnerMap.forEach((provincePartners, province) => {
      provincePartnerMap.set(province, [...provincePartners].sort(comparePartnerDisplayOrder));
    });

    return provincePartnerMap;
  }, [matchedPartners]);

  const currentPartners = useMemo(() => {
    if (!selectedRegion) {
      return [];
    }

    return partnersByProvince.get(selectedRegion.province) ?? [];
  }, [partnersByProvince, selectedRegion]);

  const periodRecords = useMemo(() => {
    if (!selectedPartner) {
      return [];
    }

    return selectedPartner.series[periodTab] ?? [];
  }, [periodTab, selectedPartner]);

  const detailTotal = useMemo(() => periodRecords.reduce<DetailTotal>((summary, record) => ({
    orders: summary.orders + record.orders,
    revenue: summary.revenue + record.revenue,
  }), EMPTY_DETAIL_TOTAL), [periodRecords]);

  const regionDisplayText = submittedQuery ? submittedQueryMeta.regionDisplayText : currentRegionText;
  const dateDisplayText = submittedQuery ? submittedQueryMeta.dateDisplayText : currentDateText;

  return {
    regionDisplayText,
    dateDisplayText,
    filteredRegions,
    totalPartners: regionSummary.totalPartners,
    totalOrders: regionSummary.totalOrders,
    totalRevenue: regionSummary.totalRevenue,
    currentPartners,
    periodRecords,
    detailTotal,
  };
};
