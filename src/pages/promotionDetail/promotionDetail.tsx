// 推广详情页面：负责装配筛选区、分发视图与页面级导航。
import React, { useCallback, useMemo } from 'react';
import PageHeader from '@components/ui/layout/PageHeader';
import { useForm } from '@components/form';
import { REGION_DATA } from '@constants/regionData';
import { useAnimatedNavigate } from '@hooks/useAnimatedNavigate';
import { showToast } from '@components/ui/feedback/Toast';
import { safeNum } from '@utils/utils';
import PromotionDetailBreadcrumb from './components/navigation/PromotionDetailBreadcrumb';
import PromotionDetailFilterPanel from './components/filter/PromotionDetailFilterPanel';
import type { PromotionDetailQueryFormDTO } from './components/filter/PromotionDetailFilterPanel.types';
import PromotionDetailViewRouter from './components/navigation/PromotionDetailViewRouter';
import styles from './promotionDetail.module.less';
import { usePromotionDetail } from './usePromotionDetail';

const PromotionDetail: React.FC = () => {
  const navigate = useAnimatedNavigate();
  const [form] = useForm<PromotionDetailQueryFormDTO>();
  const {
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
    regionDisplayText,
    dateDisplayText,
    filteredRegions,
    totalPartners,
    totalOrders,
    totalRevenueDisplay,
    currentPartners,
    periodRecords,
    detailTotal,
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
  } = usePromotionDetail();

  const showRegionFilterPanel = viewMode === 'region';
  const showRegionEmptyState = showRegionFilterPanel && hasSearched && !isLoading && !errorMessage && safeNum(filteredRegions.length) === 0;
  const showPartnerEmptyState = viewMode === 'partners' && !!selectedRegion && safeNum(currentPartners.length) === 0;
  const showDetailEmptyState = viewMode === 'detail' && !!selectedPartner && safeNum(periodRecords.length) === 0;

  const handleSubmit = useCallback(async (values: PromotionDetailQueryFormDTO) => {
    if (!isDateRangeValid) {
      showToast({ message: '结束日期不能早于开始日期', type: 'warning' });
      return;
    }

    await searchPromotionDetail({ name: values.name ?? '' });
  }, [isDateRangeValid, searchPromotionDetail]);

  const handleFormSubmit = useCallback((values: PromotionDetailQueryFormDTO): void => {
    void handleSubmit(values);
  }, [handleSubmit]);

  const handleSubmitFailed = useCallback(() => {
    showToast({ message: '请检查查询条件', type: 'warning' });
  }, []);

  const handleReset = useCallback(() => {
    form.reset();
    resetFilters();
  }, [form, resetFilters]);

  const handleBackToRegion = useCallback((): void => {
    handleBreadcrumbBack('region');
  }, [handleBreadcrumbBack]);

  const handleBackToPartners = useCallback((): void => {
    handleBreadcrumbBack('partners');
  }, [handleBreadcrumbBack]);

  const handleBack = useCallback(() => {
    if (viewMode === 'detail') {
      handleBackToPartners();
      return;
    }

    if (viewMode === 'partners') {
      handleBackToRegion();
      return;
    }

    navigate(-1);
  }, [handleBackToPartners, handleBackToRegion, navigate, viewMode]);

  const handleDayChange = useCallback((year: number, month: number, day: number) => {
    setDayYear(year);
    setDayMonth(month);
    setDayDay(day);
  }, [setDayDay, setDayMonth, setDayYear]);

  const handleDayReset = useCallback(() => {
    const nextDate = new Date();
    setDayYear(nextDate.getFullYear());
    setDayMonth(nextDate.getMonth() + 1);
    setDayDay(nextDate.getDate());
  }, [setDayDay, setDayMonth, setDayYear]);

  const handleRangeStartChange = useCallback((year: number, month: number, day: number) => {
    setRangeStartYear(year);
    setRangeStartMonth(month);
    setRangeStartDay(day);
  }, [setRangeStartDay, setRangeStartMonth, setRangeStartYear]);

  const handleRangeEndChange = useCallback((year: number, month: number, day: number) => {
    setRangeEndYear(year);
    setRangeEndMonth(month);
    setRangeEndDay(day);
  }, [setRangeEndDay, setRangeEndMonth, setRangeEndYear]);

  const handleRangeReset = useCallback(() => {
    const nextDate = new Date();
    setRangeStartYear(nextDate.getFullYear());
    setRangeStartMonth(nextDate.getMonth() + 1);
    setRangeStartDay(1);
    setRangeEndYear(nextDate.getFullYear());
    setRangeEndMonth(nextDate.getMonth() + 1);
    setRangeEndDay(nextDate.getDate());
  }, [
    setRangeEndDay,
    setRangeEndMonth,
    setRangeEndYear,
    setRangeStartDay,
    setRangeStartMonth,
    setRangeStartYear,
  ]);

  const regionViewProps = useMemo(() => ({
    isLoading,
    errorMessage,
    regionDisplayText,
    dateDisplayText,
    filteredRegions,
    totalPartners,
    totalOrders,
    totalRevenueDisplay,
    onRetry: retryLoad,
    onRegionClick: handleRegionClick,
  }), [
    dateDisplayText,
    errorMessage,
    filteredRegions,
    handleRegionClick,
    isLoading,
    regionDisplayText,
    retryLoad,
    totalOrders,
    totalPartners,
    totalRevenueDisplay,
  ]);

  const partnerViewProps = useMemo(() => {
    if (!selectedRegion) {
      return null;
    }

    return {
      selectedRegion,
      dateDisplayText,
      currentPartners,
      showEmptyState: showPartnerEmptyState,
      onBackToRegion: handleBackToRegion,
      onPartnerClick: handlePartnerClick,
    };
  }, [
    currentPartners,
    dateDisplayText,
    handleBackToRegion,
    handlePartnerClick,
    selectedRegion,
    showPartnerEmptyState,
  ]);

  const partnerDetailViewProps = useMemo(() => {
    if (!selectedPartner) {
      return null;
    }

    return {
      selectedPartner,
      periodTab,
      periodRecords,
      detailTotal,
      showEmptyState: showDetailEmptyState,
      onPeriodTabChange: setPeriodTab,
    };
  }, [detailTotal, periodRecords, periodTab, selectedPartner, setPeriodTab, showDetailEmptyState]);

  return (
    <div className={styles.pageContainer}>
      <div className={styles.blurOrb} aria-hidden="true" />

      <PageHeader title={pageTitle} onBack={handleBack} />
      <PromotionDetailBreadcrumb
        viewMode={viewMode}
        selectedRegionName={selectedRegion?.province}
        selectedPartnerName={selectedPartner?.name}
        onBackToRegion={handleBackToRegion}
        onBackToPartners={handleBackToPartners}
      />

      <main className={styles.contentWrapper}>
        {showRegionFilterPanel ? (
          <PromotionDetailFilterPanel
            form={form}
            isLoading={isLoading}
            isDateRangeValid={isDateRangeValid}
            queryMode={queryMode}
            regionValues={region}
            regionOptions={REGION_DATA}
            dayYear={dayYear}
            dayMonth={dayMonth}
            dayDay={dayDay}
            rangeStartYear={rangeStartYear}
            rangeStartMonth={rangeStartMonth}
            rangeStartDay={rangeStartDay}
            rangeEndYear={rangeEndYear}
            rangeEndMonth={rangeEndMonth}
            rangeEndDay={rangeEndDay}
            hasSearched={hasSearched}
            showEmptyState={showRegionEmptyState}
            onSubmit={handleFormSubmit}
            onSubmitFailed={handleSubmitFailed}
            onReset={handleReset}
            onRegionChange={setRegion}
            onQueryModeChange={setQueryMode}
            onDayChange={handleDayChange}
            onDayReset={handleDayReset}
            onRangeStartChange={handleRangeStartChange}
            onRangeEndChange={handleRangeEndChange}
            onRangeReset={handleRangeReset}
            onRetry={retryLoad}
          />
        ) : null}

        <PromotionDetailViewRouter
          viewMode={viewMode}
          regionViewProps={regionViewProps}
          partnerViewProps={partnerViewProps}
          partnerDetailViewProps={partnerDetailViewProps}
        />
      </main>
    </div>
  );
};

export default PromotionDetail;
