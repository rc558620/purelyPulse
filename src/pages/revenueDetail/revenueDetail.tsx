// 充值收入明细页：负责装配趋势总览、筛选条件、类型分布与充值记录。
import React from 'react';
import PageHeader from '@components/ui/layout/PageHeader';
import { EmptyState, InertiaSpinner } from '@components/ui/feedback';
import { isNonEmptyArray, safeNum } from '@utils/utils';
import RevenueDetailFilterSection from './components/RevenueDetailFilterSection/RevenueDetailFilterSection';
import RevenueDetailHeroSection from './components/RevenueDetailHeroSection/RevenueDetailHeroSection';
import { IconRevenueDetailEmpty } from './components/RevenueDetailIcons/RevenueDetailIcons';
import RevenueDetailMetricGrid from './components/RevenueDetailMetricGrid/RevenueDetailMetricGrid';
import RevenueDetailRecordSection from './components/RevenueDetailRecordSection/RevenueDetailRecordSection';
import RevenueDetailTrendSection from './components/RevenueDetailTrendSection/RevenueDetailTrendSection';
import RevenueDetailTypeSection from './components/RevenueDetailTypeSection/RevenueDetailTypeSection';
import { useRevenueDetail } from './useRevenueDetail';
import { useRevenueDetailCharts } from './useRevenueDetailCharts';
import type { RevenueTypeItem } from './revenueDetail.types';
import styles from './revenueDetail.module.less';

const EMPTY_REVENUE_TYPES: RevenueTypeItem[] = [];

const RevenueDetail: React.FC = () => {
  const {
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
  } = useRevenueDetail();

  const summary = data.summary;
  const trend = data.trend;
  const revenueTypes = data.revenueTypes;
  const safeRevenueTypes = isNonEmptyArray(revenueTypes) ? revenueTypes : EMPTY_REVENUE_TYPES;
  const growthLabel = `${summary.growth >= 0 ? '+' : ''}${safeNum(summary.growth)}%`;
  const chartSubtitle = activeTags.join(' · ') || '暂无筛选条件';
  const isInitialLoading = isLoading && !hasLoaded;
  const showInitialError = !isLoading && !hasLoaded && Boolean(errorMessage);
  const {
    pieOption,
    pieChartHeight,
    revenueChartOption,
    revenueChartHeight,
  } = useRevenueDetailCharts({
    revenuePeriod,
    trend,
    revenueTypes,
  });

  return (
    <div className={styles.pageContainer}>
      <div className={styles.bgMesh} aria-hidden="true" />
      <div className={styles.bgGlow1} aria-hidden="true" />
      <div className={styles.bgGlow2} aria-hidden="true" />
      <div className={styles.bgGlow3} aria-hidden="true" />

      <PageHeader title="充值收入趋势" />

      <main className={styles.contentWrapper}>
        {isInitialLoading ? (
          <section className={styles.statusCard}>
            <InertiaSpinner spinning size="lg" variant="brand" />
            <span className={styles.statusTitle}>正在加载充值收入明细...</span>
            <span className={styles.statusDesc}>稍等一下，正在同步最新趋势与明细</span>
          </section>
        ) : null}

        {showInitialError ? (
          <section className={styles.statusCard} role="alert">
            <EmptyState
              icon={<IconRevenueDetailEmpty />}
              title="充值收入明细加载失败"
              desc={errorMessage}
              actionText="重新加载"
              onAction={retryLoad}
            />
          </section>
        ) : null}

        {!isInitialLoading && !showInitialError ? (
          <>
            <RevenueDetailHeroSection
              summary={summary}
              revenuePeriod={revenuePeriod}
              activeTags={activeTags}
            />
            <RevenueDetailFilterSection
              revenuePeriod={revenuePeriod}
              filterOpen={filterOpen}
              hasFilter={hasFilter}
              isCustomDate={isCustomDate}
              isCustomRange={isCustomRange}
              customDateBtnText={customDateBtnText}
              customYear={customYear}
              customMonth={customMonth}
              customDay={customDay}
              rangeStartYear={rangeStartYear}
              rangeStartMonth={rangeStartMonth}
              rangeStartDay={rangeStartDay}
              rangeEndYear={rangeEndYear}
              rangeEndMonth={rangeEndMonth}
              rangeEndDay={rangeEndDay}
              region={region}
              setFilterOpen={setFilterOpen}
              setCustomYear={setCustomYear}
              setCustomMonth={setCustomMonth}
              setCustomDay={setCustomDay}
              setRangeStartYear={setRangeStartYear}
              setRangeStartMonth={setRangeStartMonth}
              setRangeStartDay={setRangeStartDay}
              setRangeEndYear={setRangeEndYear}
              setRangeEndMonth={setRangeEndMonth}
              setRangeEndDay={setRangeEndDay}
              setRegion={setRegion}
              handleChangeRevenuePeriod={handleChangeRevenuePeriod}
              handleToggleCustomDate={handleToggleCustomDate}
              handleToggleCustomRange={handleToggleCustomRange}
              handleClearCustomDate={handleClearCustomDate}
              handleClearCustomRange={handleClearCustomRange}
            />
            <RevenueDetailMetricGrid
              summary={summary}
              revenuePeriod={revenuePeriod}
              growthLabel={growthLabel}
            />
            <RevenueDetailTrendSection
              chartSubtitle={chartSubtitle}
              revenueChartOption={revenueChartOption}
              chartHeight={revenueChartHeight}
            />
            <RevenueDetailTypeSection
              revenueTypes={safeRevenueTypes}
              pieOption={pieOption}
              chartHeight={pieChartHeight}
            />
            <RevenueDetailRecordSection
              totalRecords={data.totalRecords}
              displayedRecords={displayedRecords}
              canLoadMoreRecords={canLoadMoreRecords}
              loadMoreRecords={loadMoreRecords}
            />
            <div className={styles.bottomSafeArea} aria-hidden="true" />
          </>
        ) : null}
      </main>
    </div>
  );
};

export default RevenueDetail;
