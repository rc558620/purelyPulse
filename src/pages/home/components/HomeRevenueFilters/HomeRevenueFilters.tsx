// 首页收入筛选区块：负责地区、周期与自定义日期筛选展示。
import { memo, useState } from 'react';
import { CascaderView } from '@components/form/CascaderView';
import CustomModeBtnRow from '@components/form/CustomModeBtnRow/CustomModeBtnRow';
import DateRangePicker from '@components/form/DateRangePicker/DateRangePicker';
import DayPicker from '@components/form/DayPicker';
import SlidingTabBar from '@components/ui/filter/SlidingTabBar/SlidingTabBar';
import { REGION_DATA } from '@constants/regionData';
import { safeNum } from '@utils/utils';
import type { CascadeValue } from '@components/form/CascaderView/types';
import type { RevenuePeriod } from '../../home.types';
import styles from './HomeRevenueFilters.module.less';

interface HomeRevenueFiltersProps {
  rankRegion: CascadeValue[];
  revenuePeriod: RevenuePeriod;
  onRegionChange: (value: CascadeValue[]) => void;
  onRevenuePeriodChange: (value: RevenuePeriod) => void;
  onCustomDateChange: (date: string | undefined) => void;
  onCustomRangeChange: (start: string | undefined, end: string | undefined) => void;
}

interface HomeFilterDateValue {
  year: number;
  month: number;
  day: number;
}

const revenueTabs: Array<{ value: RevenuePeriod; label: string }> = [
  { value: 'today', label: '今日' },
  { value: 'week', label: '本周' },
  { value: 'month', label: '本月' },
  { value: 'season', label: '本季' },
];

const createCurrentDateValue = (): HomeFilterDateValue => {
  const now = new Date();
  return {
    year: now.getFullYear(),
    month: now.getMonth() + 1,
    day: now.getDate(),
  };
};

const createRangeStartValue = (): HomeFilterDateValue => {
  const now = new Date();
  return {
    year: now.getFullYear(),
    month: now.getMonth() + 1,
    day: 1,
  };
};

const formatDateValue = (value: HomeFilterDateValue): string =>
  `${safeNum(value.year)}-${String(safeNum(value.month)).padStart(2, '0')}-${String(safeNum(value.day)).padStart(2, '0')}`;

const HomeRevenueFilters = memo(({
  rankRegion,
  revenuePeriod,
  onRegionChange,
  onRevenuePeriodChange,
  onCustomDateChange,
  onCustomRangeChange,
}: HomeRevenueFiltersProps): React.JSX.Element => {
  const [isCustomDate, setIsCustomDate] = useState(false);
  const [isCustomRange, setIsCustomRange] = useState(false);
  const [customDate, setCustomDate] = useState<HomeFilterDateValue>(() => createCurrentDateValue());
  const [rangeStart, setRangeStart] = useState<HomeFilterDateValue>(() => createRangeStartValue());
  const [rangeEnd, setRangeEnd] = useState<HomeFilterDateValue>(() => createCurrentDateValue());

  const handleToggleCustomDate = (): void => {
    setIsCustomDate((prev) => {
      const next = !prev;
      if (!next) {
        onCustomDateChange(undefined);
      }
      return next;
    });
    setIsCustomRange(false);
    onCustomRangeChange(undefined, undefined);
  };

  const handleToggleCustomRange = (): void => {
    setIsCustomRange((prev) => {
      const next = !prev;
      if (!next) {
        onCustomRangeChange(undefined, undefined);
      }
      return next;
    });
    setIsCustomDate(false);
    onCustomDateChange(undefined);
  };

  const handleCustomDayClear = (): void => {
    setIsCustomDate(false);
    onCustomDateChange(undefined);
  };

  const handleCustomDateChange = (year: number, month: number, day: number): void => {
    const next = { year, month, day };
    setCustomDate(next);
    onCustomDateChange(formatDateValue(next));
  };

  const handleRangeStartChange = (year: number, month: number, day: number): void => {
    const next = { year, month, day };
    setRangeStart(next);
    onCustomRangeChange(formatDateValue(next), formatDateValue(rangeEnd));
  };

  const handleRangeEndChange = (year: number, month: number, day: number): void => {
    const next = { year, month, day };
    setRangeEnd(next);
    onCustomRangeChange(formatDateValue(rangeStart), formatDateValue(next));
  };

  const handleRangeClear = (): void => {
    setIsCustomRange(false);
    onCustomRangeChange(undefined, undefined);
  };

  const customDateBtnText = isCustomDate
    ? `${safeNum(customDate.year)}/${String(safeNum(customDate.month)).padStart(2, '0')}/${String(safeNum(customDate.day)).padStart(2, '0')}`
    : '选择年月日';

  return (
    <section className={styles.revenueFilterBlock}>
      <CascaderView
        options={REGION_DATA}
        value={rankRegion}
        onChange={onRegionChange}
        placeholder="选择省 / 市 / 区"
        allowClear
      />

      <SlidingTabBar
        options={revenueTabs}
        value={revenuePeriod}
        onChange={(value) => onRevenuePeriodChange(value as RevenuePeriod)}
        variant="pill"
      />

      <CustomModeBtnRow
        isCustomDate={isCustomDate}
        isCustomRange={isCustomRange}
        extraBtnText={customDateBtnText}
        onToggleCustomDate={handleToggleCustomDate}
        onToggleCustomRange={handleToggleCustomRange}
      />

      {isCustomDate ? (
        <div className={styles.revenueDayPickerWrap}>
          <DayPicker
            year={safeNum(customDate.year)}
            month={safeNum(customDate.month)}
            day={safeNum(customDate.day)}
            onChange={handleCustomDateChange}
            onClear={handleCustomDayClear}
          />
        </div>
      ) : null}

      {isCustomRange ? (
        <DateRangePicker
          startYear={safeNum(rangeStart.year)}
          startMonth={safeNum(rangeStart.month)}
          startDay={safeNum(rangeStart.day)}
          endYear={safeNum(rangeEnd.year)}
          endMonth={safeNum(rangeEnd.month)}
          endDay={safeNum(rangeEnd.day)}
          onStartChange={handleRangeStartChange}
          onEndChange={handleRangeEndChange}
          onClear={handleRangeClear}
        />
      ) : null}
    </section>
  );
});

HomeRevenueFilters.displayName = 'HomeRevenueFilters';

export default HomeRevenueFilters;
