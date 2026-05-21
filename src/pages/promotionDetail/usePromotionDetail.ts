// 推广详情页面状态管理：负责编排筛选状态、请求状态、结果派生与视图切换。
import { useCallback } from 'react';

// 数字展示与聚合结果在下层派生 hook 中统一通过 safeNum 约束。
import type { Dispatch, SetStateAction } from 'react';
import type { CascadeValue } from '@components/form/CascaderView/types';
import { usePromotionDetailDerived } from './hooks/usePromotionDetailDerived';
import { usePromotionDetailFilterState } from './hooks/usePromotionDetailFilterState';
import { usePromotionDetailRequest } from './hooks/usePromotionDetailRequest';
import { usePromotionDetailViewState } from './hooks/usePromotionDetailViewState';
import type {
  PromotionDetailData,
  PromotionPartnerItem,
  PromotionPeriodRecord,
  PromotionPeriodTab,
  PromotionQueryMode,
  PromotionRegionItem,
  PromotionViewMode,
} from './promotionDetail.types';

interface SearchPromotionParams {
  name: string;
}

interface UsePromotionDetailPageReturn {
  data: PromotionDetailData;
  isLoading: boolean;
  errorMessage: string;
  hasSearched: boolean;
  viewMode: PromotionViewMode;
  selectedRegion: PromotionRegionItem | null;
  selectedPartner: PromotionPartnerItem | null;
  periodTab: PromotionPeriodTab;
  queryMode: PromotionQueryMode;
  dayYear: number;
  dayMonth: number;
  dayDay: number;
  rangeStartYear: number;
  rangeStartMonth: number;
  rangeStartDay: number;
  rangeEndYear: number;
  rangeEndMonth: number;
  rangeEndDay: number;
  region: CascadeValue[];
  isDateRangeValid: boolean;
  regionDisplayText: string;
  dateDisplayText: string;
  filteredRegions: PromotionRegionItem[];
  totalPartners: number;
  totalOrders: number;
  totalRevenue: number;
  currentPartners: PromotionPartnerItem[];
  periodRecords: PromotionPeriodRecord[];
  detailTotal: {
    orders: number;
    revenue: number;
  };
  pageTitle: string;
  retryLoad: () => void;
  searchPromotionDetail: (params: SearchPromotionParams) => Promise<void>;
  resetFilters: () => void;
  handleRegionClick: (regionItem: PromotionRegionItem) => void;
  handlePartnerClick: (partner: PromotionPartnerItem) => void;
  handleBreadcrumbBack: (target: PromotionViewMode) => void;
  setPeriodTab: Dispatch<SetStateAction<PromotionPeriodTab>>;
  setQueryMode: Dispatch<SetStateAction<PromotionQueryMode>>;
  setDayYear: Dispatch<SetStateAction<number>>;
  setDayMonth: Dispatch<SetStateAction<number>>;
  setDayDay: Dispatch<SetStateAction<number>>;
  setRangeStartYear: Dispatch<SetStateAction<number>>;
  setRangeStartMonth: Dispatch<SetStateAction<number>>;
  setRangeStartDay: Dispatch<SetStateAction<number>>;
  setRangeEndYear: Dispatch<SetStateAction<number>>;
  setRangeEndMonth: Dispatch<SetStateAction<number>>;
  setRangeEndDay: Dispatch<SetStateAction<number>>;
  setRegion: Dispatch<SetStateAction<CascadeValue[]>>;
}

export const usePromotionDetail = (): UsePromotionDetailPageReturn => {
  const {
    queryMode,
    dayYear,
    dayMonth,
    dayDay,
    rangeStartYear,
    rangeStartMonth,
    rangeStartDay,
    rangeEndYear,
    rangeEndMonth,
    rangeEndDay,
    region,
    isDateRangeValid,
    currentDateDisplayText,
    currentRegionSelection,
    buildSearchQuery,
    buildSearchMeta,
    resetFilterState,
    setQueryMode,
    setDayYear,
    setDayMonth,
    setDayDay,
    setRangeStartYear,
    setRangeStartMonth,
    setRangeStartDay,
    setRangeEndYear,
    setRangeEndMonth,
    setRangeEndDay,
    setRegion,
  } = usePromotionDetailFilterState();
  const {
    data,
    isLoading,
    errorMessage,
    hasSearched,
    submittedQuery,
    submittedQueryMeta,
    runSearch,
    retryLoad,
    resetRequestState,
  } = usePromotionDetailRequest();
  const {
    viewMode,
    selectedRegion,
    selectedPartner,
    periodTab,
    pageTitle,
    resetViewState,
    handleRegionClick,
    handlePartnerClick,
    handleBreadcrumbBack,
    setPeriodTab,
  } = usePromotionDetailViewState();
  const derivedState = usePromotionDetailDerived({
    data,
    submittedQuery,
    submittedQueryMeta,
    currentRegionText: currentRegionSelection.text,
    currentDateText: currentDateDisplayText,
    selectedRegion,
    selectedPartner,
    periodTab,
  });

  const searchPromotionDetail = useCallback(async ({ name }: SearchPromotionParams): Promise<void> => {
    const query = buildSearchQuery(name);
    const meta = buildSearchMeta();
    resetViewState();
    await runSearch(query, meta);
  }, [buildSearchMeta, buildSearchQuery, resetViewState, runSearch]);

  const resetFilters = useCallback((): void => {
    resetFilterState();
    resetRequestState();
    resetViewState();
  }, [resetFilterState, resetRequestState, resetViewState]);

  return {
    data,
    isLoading,
    errorMessage,
    hasSearched,
    viewMode,
    selectedRegion,
    selectedPartner,
    periodTab,
    queryMode,
    dayYear,
    dayMonth,
    dayDay,
    rangeStartYear,
    rangeStartMonth,
    rangeStartDay,
    rangeEndYear,
    rangeEndMonth,
    rangeEndDay,
    region,
    isDateRangeValid,
    regionDisplayText: derivedState.regionDisplayText,
    dateDisplayText: derivedState.dateDisplayText,
    filteredRegions: derivedState.filteredRegions,
    totalPartners: derivedState.totalPartners,
    totalOrders: derivedState.totalOrders,
    totalRevenue: derivedState.totalRevenue,
    currentPartners: derivedState.currentPartners,
    periodRecords: derivedState.periodRecords,
    detailTotal: derivedState.detailTotal,
    pageTitle,
    retryLoad,
    searchPromotionDetail,
    resetFilters,
    handleRegionClick,
    handlePartnerClick,
    handleBreadcrumbBack,
    setPeriodTab,
    setQueryMode,
    setDayYear,
    setDayMonth,
    setDayDay,
    setRangeStartYear,
    setRangeStartMonth,
    setRangeStartDay,
    setRangeEndYear,
    setRangeEndMonth,
    setRangeEndDay,
    setRegion,
  };
};
