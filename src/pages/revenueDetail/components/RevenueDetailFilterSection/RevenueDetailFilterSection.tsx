// 充值收入明细页筛选区：统一承载时间周期、日期范围与地区筛选交互。
import type * as React from 'react';
import { CascaderView } from '@components/form/CascaderView';
import type { CascadeValue } from '@components/form/CascaderView/types';
import CustomModeBtnRow from '@components/form/CustomModeBtnRow/CustomModeBtnRow';
import DateRangePicker from '@components/form/DateRangePicker/DateRangePicker';
import DayPicker from '@components/form/DayPicker';
import SlidingTabBar from '@components/ui/filter/SlidingTabBar/SlidingTabBar';
import { REGION_DATA } from '@constants/regionData';
import { cx } from '@utils/utils';
import {
  IconRevenueDetailChevronDown,
  IconRevenueDetailFilter,
} from '../RevenueDetailIcons/RevenueDetailIcons';
import { REVENUE_TAB_OPTIONS } from '../../revenueDetail.shared';
import type { RevenuePeriod } from '../../revenueDetail.types';
import sharedStyles from '../../revenueDetail.module.less';
import styles from './RevenueDetailFilterSection.module.less';

interface RevenueDetailFilterSectionProps {
  revenuePeriod: RevenuePeriod;
  filterOpen: boolean;
  hasFilter: boolean;
  isCustomDate: boolean;
  isCustomRange: boolean;
  customDateBtnText: string;
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
}

export const RevenueDetailFilterSection = ({
  revenuePeriod,
  filterOpen,
  hasFilter,
  isCustomDate,
  isCustomRange,
  customDateBtnText,
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
}: RevenueDetailFilterSectionProps): React.JSX.Element => (
  <section className={cx(sharedStyles.filterSection, styles.root)}>
    <button
      className={sharedStyles.filterToggle}
      type="button"
      onClick={() => setFilterOpen((previousValue) => !previousValue)}
      aria-expanded={filterOpen}
      aria-controls="filter-panel"
    >
      <div className={sharedStyles.filterToggleLeft}>
        <div className={sharedStyles.filterToggleIcon} aria-hidden="true">
          <IconRevenueDetailFilter />
        </div>
        <span className={sharedStyles.filterToggleTitle}>筛选条件</span>
        {hasFilter ? (
          <span className={sharedStyles.filterActiveDot} aria-label="已设置筛选条件" />
        ) : null}
      </div>
      <div className={sharedStyles.filterToggleRight}>
        {!filterOpen ? (
          <div className={sharedStyles.filterSummaryTabs}>
            <SlidingTabBar
              options={REVENUE_TAB_OPTIONS}
              value={revenuePeriod}
              onChange={(value) => handleChangeRevenuePeriod(value as RevenuePeriod)}
              variant="pill"
            />
          </div>
        ) : null}
        <IconRevenueDetailChevronDown
          className={cx(sharedStyles.filterChevron, filterOpen && sharedStyles.filterChevronOpen)}
        />
      </div>
    </button>

    <div
      id="filter-panel"
      className={cx(sharedStyles.filterPanel, filterOpen && sharedStyles.filterPanelOpen)}
      aria-hidden={!filterOpen}
    >
      <div className={sharedStyles.filterPanelInner}>
        <div className={sharedStyles.filterGroup}>
          <span className={sharedStyles.filterGroupLabel}>时间周期</span>
          <SlidingTabBar
            options={REVENUE_TAB_OPTIONS}
            value={revenuePeriod}
            onChange={(value) => handleChangeRevenuePeriod(value as RevenuePeriod)}
            variant="pill"
          />
        </div>

        <div className={sharedStyles.filterGroup}>
          <span className={sharedStyles.filterGroupLabel}>精确日期</span>
          <CustomModeBtnRow
            isCustomDate={isCustomDate}
            isCustomRange={isCustomRange}
            extraBtnText={customDateBtnText}
            onToggleCustomDate={handleToggleCustomDate}
            onToggleCustomRange={handleToggleCustomRange}
          />
          {isCustomDate ? (
            <DayPicker
              year={customYear}
              month={customMonth}
              day={customDay}
              onChange={(year, month, day) => {
                setCustomYear(year);
                setCustomMonth(month);
                setCustomDay(day);
              }}
              onClear={handleClearCustomDate}
            />
          ) : null}
          {isCustomRange ? (
            <DateRangePicker
              startYear={rangeStartYear}
              startMonth={rangeStartMonth}
              startDay={rangeStartDay}
              endYear={rangeEndYear}
              endMonth={rangeEndMonth}
              endDay={rangeEndDay}
              onStartChange={(year, month, day) => {
                setRangeStartYear(year);
                setRangeStartMonth(month);
                setRangeStartDay(day);
              }}
              onEndChange={(year, month, day) => {
                setRangeEndYear(year);
                setRangeEndMonth(month);
                setRangeEndDay(day);
              }}
              onClear={handleClearCustomRange}
            />
          ) : null}
        </div>

        <div className={sharedStyles.filterGroup}>
          <span className={sharedStyles.filterGroupLabel}>所在地区</span>
          <CascaderView
            options={REGION_DATA}
            value={region}
            onChange={setRegion}
            placeholder="选择省 / 市 / 区"
            allowClear
          />
        </div>
      </div>
    </div>
  </section>
);

export default RevenueDetailFilterSection;
