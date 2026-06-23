// 充值收入明细页状态管理：统一维护筛选条件、请求状态与分页展示。
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { CascadeValue } from '@components/form/CascaderView/types';
import { MEMBERSHIP_REVENUE_SYNC_EVENT } from '../memberList/memberList.constants';
import type { MembershipRevenueSyncPayload } from '../memberList/memberList.service';
import { normalizeRegionValue } from '@constants/regionData';
import { safeNum } from '@utils/utils';
import { createEmptyRevenueDetail, fetchRevenueDetail } from './revenueDetail.service';
import type {
  RevenueDetailData,
  RevenueDetailQuery,
  RevenuePeriod,
  RevenueRecordItem,
} from './revenueDetail.types';

const DEFAULT_VISIBLE_RECORD_COUNT = 10;
const QUERY_DEBOUNCE_MS = 180;
const PERIOD_LABEL_MAP: Record<RevenuePeriod, string> = {
  today: '今日',
  week: '本周',
  month: '本月',
  season: '本季',
};

const formatDateText = (year: number, month: number, day: number): string => (
  `${year}/${String(month).padStart(2, '0')}/${String(day).padStart(2, '0')}`
);

const resolveRegionDisplayText = (region: CascadeValue[]): string => {
  if (region.length === 0) {
    return '';
  }

  return normalizeRegionValue(region)?.regionLabels.join(' · ') ?? '';
};

export interface UseRevenueDetailReturn {
  data: RevenueDetailData;
  isLoading: boolean;
  hasLoaded: boolean;
  errorMessage: string;
  retryLoad: () => void;
  revenuePeriod: RevenuePeriod;
  filterOpen: boolean;
  isCustomDate: boolean;
  isCustomRange: boolean;
  customYear: number;
  customMonth: number;
  customDay: number;
  rangeStartYear: number;
  rangeStartMonth: number;
  rangeStartDay: number;
  rangeEndYear: number;
  rangeEndMonth: number;
  rangeEndDay: number;
  region: CascadeValue[];
  regionDisplayText: string;
  activeTags: string[];
  customDateBtnText: string;
  hasFilter: boolean;
  displayedRecords: RevenueRecordItem[];
  canLoadMoreRecords: boolean;
  setFilterOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setCustomYear: React.Dispatch<React.SetStateAction<number>>;
  setCustomMonth: React.Dispatch<React.SetStateAction<number>>;
  setCustomDay: React.Dispatch<React.SetStateAction<number>>;
  setRangeStartYear: React.Dispatch<React.SetStateAction<number>>;
  setRangeStartMonth: React.Dispatch<React.SetStateAction<number>>;
  setRangeStartDay: React.Dispatch<React.SetStateAction<number>>;
  setRangeEndYear: React.Dispatch<React.SetStateAction<number>>;
  setRangeEndMonth: React.Dispatch<React.SetStateAction<number>>;
  setRangeEndDay: React.Dispatch<React.SetStateAction<number>>;
  setRegion: React.Dispatch<React.SetStateAction<CascadeValue[]>>;
  handleChangeRevenuePeriod: (period: RevenuePeriod) => void;
  handleToggleCustomDate: () => void;
  handleToggleCustomRange: () => void;
  handleClearCustomDate: () => void;
  handleClearCustomRange: () => void;
  loadMoreRecords: () => void;
}

export const useRevenueDetail = (): UseRevenueDetailReturn => {
  const [data, setData] = useState<RevenueDetailData>(() => createEmptyRevenueDetail());
  const [isLoading, setIsLoading] = useState(true);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [revenuePeriod, setRevenuePeriod] = useState<RevenuePeriod>('month');
  const [filterOpen, setFilterOpen] = useState(false);
  const [isCustomDate, setIsCustomDate] = useState(false);
  const [isCustomRange, setIsCustomRange] = useState(false);
  const nowRef = useRef(new Date());
  const now = nowRef.current;
  const [customYear, setCustomYear] = useState(safeNum(now.getFullYear()));
  const [customMonth, setCustomMonth] = useState(safeNum(now.getMonth() + 1));
  const [customDay, setCustomDay] = useState(safeNum(now.getDate()));
  const [rangeStartYear, setRangeStartYear] = useState(safeNum(now.getFullYear()));
  const [rangeStartMonth, setRangeStartMonth] = useState(safeNum(now.getMonth() + 1));
  const [rangeStartDay, setRangeStartDay] = useState(1);
  const [rangeEndYear, setRangeEndYear] = useState(safeNum(now.getFullYear()));
  const [rangeEndMonth, setRangeEndMonth] = useState(safeNum(now.getMonth() + 1));
  const [rangeEndDay, setRangeEndDay] = useState(safeNum(now.getDate()));
  const [region, setRegion] = useState<CascadeValue[]>([]);
  const [visibleRecordCount, setVisibleRecordCount] = useState(DEFAULT_VISIBLE_RECORD_COUNT);
  const prevRecordsLengthRef = useRef(0);
  const requestIdRef = useRef(0);
  const isFirstLoadRef = useRef(true);

  const regionDisplayText = useMemo(() => resolveRegionDisplayText(region), [region]);

  const query = useMemo(() => ({
    period: revenuePeriod,
    date: isCustomDate ? formatDateText(customYear, customMonth, customDay) : null,
    startDate: isCustomRange ? formatDateText(rangeStartYear, rangeStartMonth, rangeStartDay) : null,
    endDate: isCustomRange ? formatDateText(rangeEndYear, rangeEndMonth, rangeEndDay) : null,
    regionValues: region.filter(Boolean).map((item) => String(item)),
  }), [
    customDay,
    customMonth,
    customYear,
    isCustomDate,
    isCustomRange,
    rangeEndDay,
    rangeEndMonth,
    rangeEndYear,
    rangeStartDay,
    rangeStartMonth,
    rangeStartYear,
    region,
    revenuePeriod,
  ]);

  const loadRevenueDetail = useCallback(async (targetQuery: RevenueDetailQuery): Promise<void> => {
    requestIdRef.current += 1;
    const currentRequestId = requestIdRef.current;
    setIsLoading(true);

    try {
      const response = await fetchRevenueDetail(targetQuery);
      if (currentRequestId !== requestIdRef.current) {
        return;
      }

      setData(response);
      setHasLoaded(true);
      setErrorMessage('');
    } catch (error) {
      if (currentRequestId !== requestIdRef.current) {
        return;
      }

      setErrorMessage(error instanceof Error ? error.message : '获取充值收入明细失败');
    } finally {
      if (currentRequestId === requestIdRef.current) {
        setIsLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    if (isFirstLoadRef.current) {
      isFirstLoadRef.current = false;
      void loadRevenueDetail(query);
      return;
    }

    const timer = window.setTimeout(() => {
      void loadRevenueDetail(query);
    }, QUERY_DEBOUNCE_MS);

    return () => {
      window.clearTimeout(timer);
    };
  }, [loadRevenueDetail, query]);

  useEffect(() => {
    // 仅在记录条数减少时（筛选条件切换导致数据重置）重置分页，
    // 实时事件追加导致的记录增长不重置，避免用户已加载的记录缩短
    if (data.records.length < prevRecordsLengthRef.current) {
      setVisibleRecordCount(DEFAULT_VISIBLE_RECORD_COUNT);
    }
    prevRecordsLengthRef.current = data.records.length;
  }, [data.records.length]);

  useEffect(() => {
    const handleMembershipRevenueSync = (event: Event): void => {
      const customEvent = event as CustomEvent<MembershipRevenueSyncPayload>;
      const payload = customEvent.detail;
      if (!payload) {
        return;
      }

      void loadRevenueDetail(query);
    };

    window.addEventListener(MEMBERSHIP_REVENUE_SYNC_EVENT, handleMembershipRevenueSync);
    return () => {
      window.removeEventListener(MEMBERSHIP_REVENUE_SYNC_EVENT, handleMembershipRevenueSync);
    };
  }, [loadRevenueDetail, query]);

  const activeTags = useMemo(() => {
    const tags: string[] = [];

    if (isCustomDate) {
      tags.push(formatDateText(customYear, customMonth, customDay));
    } else if (isCustomRange) {
      tags.push(`${formatDateText(rangeStartYear, rangeStartMonth, rangeStartDay)} → ${formatDateText(rangeEndYear, rangeEndMonth, rangeEndDay)}`);
    } else {
      tags.push(PERIOD_LABEL_MAP[revenuePeriod]);
    }

    if (regionDisplayText) {
      tags.push(regionDisplayText);
    }

    return tags;
  }, [
    customDay,
    customMonth,
    customYear,
    isCustomDate,
    isCustomRange,
    rangeEndDay,
    rangeEndMonth,
    rangeEndYear,
    rangeStartDay,
    rangeStartMonth,
    rangeStartYear,
    regionDisplayText,
    revenuePeriod,
  ]);

  const customDateBtnText = isCustomDate
    ? formatDateText(customYear, customMonth, customDay)
    : '选择年月日';

  const displayedRecords = useMemo(() => data.records.slice(0, visibleRecordCount), [data.records, visibleRecordCount]);
  const canLoadMoreRecords = displayedRecords.length < data.records.length;
  const hasFilter = isCustomDate || isCustomRange || region.length > 0;

  const handleChangeRevenuePeriod = useCallback((period: RevenuePeriod): void => {
    setRevenuePeriod(period);
    setIsCustomDate(false);
    setIsCustomRange(false);
  }, []);

  const handleToggleCustomDate = useCallback((): void => {
    setIsCustomDate((previousValue) => !previousValue);
    setIsCustomRange(false);
  }, []);

  const handleToggleCustomRange = useCallback((): void => {
    setIsCustomRange((previousValue) => !previousValue);
    setIsCustomDate(false);
  }, []);

  const handleClearCustomDate = useCallback((): void => {
    setIsCustomDate(false);
  }, []);

  const handleClearCustomRange = useCallback((): void => {
    setIsCustomRange(false);
  }, []);

  const retryLoad = useCallback((): void => {
    void loadRevenueDetail(query);
  }, [loadRevenueDetail, query]);

  const loadMoreRecords = useCallback((): void => {
    setVisibleRecordCount((previousValue) => safeNum(previousValue + DEFAULT_VISIBLE_RECORD_COUNT));
  }, []);

  return {
    data,
    isLoading,
    hasLoaded,
    errorMessage,
    retryLoad,
    revenuePeriod,
    filterOpen,
    isCustomDate,
    isCustomRange,
    customYear,
    customMonth,
    customDay,
    rangeStartYear,
    rangeStartMonth,
    rangeStartDay,
    rangeEndYear,
    rangeEndMonth,
    rangeEndDay,
    region,
    regionDisplayText,
    activeTags,
    customDateBtnText,
    hasFilter,
    displayedRecords,
    canLoadMoreRecords,
    setFilterOpen,
    setCustomYear,
    setCustomMonth,
    setCustomDay,
    setRangeStartYear,
    setRangeStartMonth,
    setRangeStartDay,
    setRangeEndYear,
    setRangeEndMonth,
    setRangeEndDay,
    setRegion,
    handleChangeRevenuePeriod,
    handleToggleCustomDate,
    handleToggleCustomRange,
    handleClearCustomDate,
    handleClearCustomRange,
    loadMoreRecords,
  };
};
