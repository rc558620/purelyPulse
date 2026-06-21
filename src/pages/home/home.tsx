// 首页页面：负责筛选状态编排、数据装配与区块组合。
import { useCallback, useMemo, useState } from 'react';
import { useAnimatedNavigate } from '@hooks/useAnimatedNavigate';
import { ROUTE_PATHS } from '../../router/paths';
import type { CascadeValue } from '@components/form/CascaderView/types';
import { normalizeRegionValue } from '@constants/regionData';
import type { RevenuePeriod } from './home.types';
import { useHomeOverview } from './useHomeOverview';
import HomeHeroSection from './components/HomeHeroSection/HomeHeroSection';
import HomeNavbar from './components/HomeNavbar/HomeNavbar';
import HomeOverviewState from './components/HomeOverviewState/HomeOverviewState';
import HomePartnerOverviewSection from './components/HomePartnerOverviewSection/HomePartnerOverviewSection';
import HomePartnerRankSection from './components/HomePartnerRankSection/HomePartnerRankSection';
import HomeQuickNavSection from './components/HomeQuickNavSection/HomeQuickNavSection';
import HomeRevenueFilters from './components/HomeRevenueFilters/HomeRevenueFilters';
import HomeRevenueSection from './components/HomeRevenueSection/HomeRevenueSection';
import styles from './home.module.less';

const Home = (): React.JSX.Element => {
  const navigate = useAnimatedNavigate();
  const [revenuePeriod, setRevenuePeriod] = useState<RevenuePeriod>('month');
  const [rankRegion, setRankRegion] = useState<CascadeValue[]>([]);
  const rankRegionLabel = useMemo(() => {
    const regionLabels = normalizeRegionValue(rankRegion)?.regionLabels ?? [];
    return regionLabels[regionLabels.length - 1] || undefined;
  }, [rankRegion]);
  const homeOverviewQuery = useMemo(() => ({
    revenuePeriod,
    region: rankRegionLabel,
  }), [rankRegionLabel, revenuePeriod]);
  const { overview, isLoading, hasLoaded, errorMessage, retryLoad } = useHomeOverview(homeOverviewQuery);

  const handleRankRegionChange = useCallback((value: CascadeValue[]): void => {
    setRankRegion(value);
  }, []);

  const handleRevenuePeriodChange = useCallback((value: RevenuePeriod): void => {
    setRevenuePeriod(value);
  }, []);

  const handleNavigateRevenueDetail = useCallback((): void => {
    navigate(ROUTE_PATHS.revenueDetail);
  }, [navigate]);

  const handleNavigatePromotionDetail = useCallback((): void => {
    navigate(ROUTE_PATHS.promotionDetail);
  }, [navigate]);

  const isInitialLoading = isLoading && !hasLoaded;
  const showInitialError = !isLoading && !hasLoaded && Boolean(errorMessage);
  const revenueSummary = overview.revenueByPeriod[revenuePeriod];

  return (
    <div className={styles.pageContainer}>
      <div className={styles.bgOrb1} aria-hidden="true" />
      <div className={styles.bgOrb2} aria-hidden="true" />
      <div className={styles.bgGrid} aria-hidden="true" />

      {/* 顶部导航栏：门店信息、通知、设置及用户头像 */}
      <HomeNavbar />

      <main className={styles.contentWrapper}>
        <HomeOverviewState
          isLoading={isLoading}
          hasLoaded={hasLoaded}
          errorMessage={errorMessage}
          retryLoad={retryLoad}
        />

        {!isInitialLoading && !showInitialError ? (
          <>
            <HomeHeroSection overview={overview} />
            <HomePartnerOverviewSection partnerStats={overview.partnerStats} />
            <HomeQuickNavSection
              pendingApplicationCount={overview.pendingApplicationCount}
              onNavigate={navigate}
            />
            <HomeRevenueFilters
              rankRegion={rankRegion}
              revenuePeriod={revenuePeriod}
              onRegionChange={handleRankRegionChange}
              onRevenuePeriodChange={handleRevenuePeriodChange}
            />
            <HomeRevenueSection
              revenuePeriod={revenuePeriod}
              revenueSummary={revenueSummary}
              revenueTypes={overview.revenueTypes}
              onNavigateDetail={handleNavigateRevenueDetail}
            />
            <HomePartnerRankSection
              rankRegion={rankRegion}
              partnerTop={overview.partnerTop}
              onNavigateDetail={handleNavigatePromotionDetail}
            />
          </>
        ) : null}
      </main>
    </div>
  );
};

export default Home;
