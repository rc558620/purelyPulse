// 推广详情筛选状态 hook：负责日期、地区与查询参数构建。
import { useCallback, useMemo, useRef, useState } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import type { CascadeValue } from '@components/form/CascaderView/types';
import { normalizeRegionValue } from '@constants/regionData';
import { safeNum } from '@utils/utils';
import type {
  PromotionDetailQuery,
  PromotionDetailQueryMeta,
  PromotionQueryMode,
} from '../promotionDetail.types';

interface RegionSelectionResult {
  labels: string[];
  text: string;
}

export interface UsePromotionDetailFilterStateReturn {
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
  currentDateDisplayText: string;
  currentRegionSelection: RegionSelectionResult;
  buildSearchQuery: (name: string) => PromotionDetailQuery;
  buildSearchMeta: () => PromotionDetailQueryMeta;
  resetFilterState: () => void;
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

interface DateParts {
  year: number;
  month: number;
  day: number;
}

const formatDateText = (year: number, month: number, day: number): string => (
  `${safeNum(year)}/${String(safeNum(month)).padStart(2, '0')}/${String(safeNum(day)).padStart(2, '0')}`
);

const resolveRegionSelection = (region: CascadeValue[]): RegionSelectionResult => {
  if (region.length === 0) {
    return { labels: [], text: '全部地区' };
  }

  const regionLabels = normalizeRegionValue(region)?.regionLabels ?? [];

  return {
    labels: regionLabels,
    text: regionLabels.length > 0 ? regionLabels.join(' · ') : '全部地区',
  };
};

const getDateParts = (value: Date): DateParts => ({
  year: safeNum(value.getFullYear()),
  month: safeNum(value.getMonth() + 1),
  day: safeNum(value.getDate()),
});

export const usePromotionDetailFilterState = (): UsePromotionDetailFilterStateReturn => {
  const initialDateRef = useRef(new Date());
  const initialDateParts = getDateParts(initialDateRef.current);
  const [queryMode, setQueryMode] = useState<PromotionQueryMode>('day');
  const [dayYear, setDayYear] = useState(initialDateParts.year);
  const [dayMonth, setDayMonth] = useState(initialDateParts.month);
  const [dayDay, setDayDay] = useState(initialDateParts.day);
  const [rangeStartYear, setRangeStartYear] = useState(initialDateParts.year);
  const [rangeStartMonth, setRangeStartMonth] = useState(initialDateParts.month);
  const [rangeStartDay, setRangeStartDay] = useState(1);
  const [rangeEndYear, setRangeEndYear] = useState(initialDateParts.year);
  const [rangeEndMonth, setRangeEndMonth] = useState(initialDateParts.month);
  const [rangeEndDay, setRangeEndDay] = useState(initialDateParts.day);
  const [region, setRegion] = useState<CascadeValue[]>([]);

  const currentRegionSelection = useMemo(() => resolveRegionSelection(region), [region]);

  const isDateRangeValid = useMemo(() => {
    if (queryMode !== 'range') {
      return true;
    }

    const startDate = new Date(rangeStartYear, rangeStartMonth - 1, rangeStartDay);
    const endDate = new Date(rangeEndYear, rangeEndMonth - 1, rangeEndDay);
    return endDate >= startDate;
  }, [queryMode, rangeEndDay, rangeEndMonth, rangeEndYear, rangeStartDay, rangeStartMonth, rangeStartYear]);

  const currentDateDisplayText = useMemo(() => {
    if (queryMode === 'day') {
      return formatDateText(dayYear, dayMonth, dayDay);
    }

    return `${formatDateText(rangeStartYear, rangeStartMonth, rangeStartDay)} ~ ${formatDateText(rangeEndYear, rangeEndMonth, rangeEndDay)}`;
  }, [dayDay, dayMonth, dayYear, queryMode, rangeEndDay, rangeEndMonth, rangeEndYear, rangeStartDay, rangeStartMonth, rangeStartYear]);

  const buildSearchQuery = useCallback((name: string): PromotionDetailQuery => ({
    name: name.trim(),
    queryMode,
    date: queryMode === 'day' ? formatDateText(dayYear, dayMonth, dayDay) : null,
    startDate: queryMode === 'range' ? formatDateText(rangeStartYear, rangeStartMonth, rangeStartDay) : null,
    endDate: queryMode === 'range' ? formatDateText(rangeEndYear, rangeEndMonth, rangeEndDay) : null,
    regionValues: region.filter(Boolean).map((item) => String(item)),
  }), [dayDay, dayMonth, dayYear, queryMode, rangeEndDay, rangeEndMonth, rangeEndYear, rangeStartDay, rangeStartMonth, rangeStartYear, region]);

  const buildSearchMeta = useCallback((): PromotionDetailQueryMeta => ({
    regionLabels: currentRegionSelection.labels,
    regionDisplayText: currentRegionSelection.text,
    dateDisplayText: currentDateDisplayText,
  }), [currentDateDisplayText, currentRegionSelection.labels, currentRegionSelection.text]);

  const resetFilterState = useCallback((): void => {
    const nextDateParts = getDateParts(new Date());
    setQueryMode('day');
    setDayYear(nextDateParts.year);
    setDayMonth(nextDateParts.month);
    setDayDay(nextDateParts.day);
    setRangeStartYear(nextDateParts.year);
    setRangeStartMonth(nextDateParts.month);
    setRangeStartDay(1);
    setRangeEndYear(nextDateParts.year);
    setRangeEndMonth(nextDateParts.month);
    setRangeEndDay(nextDateParts.day);
    setRegion([]);
  }, []);

  return {
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
  };
};
