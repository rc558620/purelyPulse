// 首页在线概览区块：负责在线人数横幅与趋势图展示。
import { memo } from 'react';
import AnimatedNumber from '@components/ui/data-display/AnimatedNumber/AnimatedNumber';
import ChartRenderer from '@components/ui/data-display/ChartRenderer';
import { safeNum } from '@utils/utils';
import type { HomeOverviewData } from '../../home.types';
import { useHomeSparklineChart } from '../../useHomeCharts';
import { IconHomeTrendUp } from '../HomeIcons/HomeIcons';
import styles from './HomeHeroSection.module.less';

interface HomeHeroSectionProps {
  overview: Pick<HomeOverviewData, 'onlineCount' | 'onlinePeak' | 'onlineTrend' | 'onlineGrowthRate'>;
}

const HomeHeroSection = memo(({ overview }: HomeHeroSectionProps): React.JSX.Element => {
  const onlineTrend = overview.onlineTrend.length > 0 ? overview.onlineTrend : [0];
  const onlineGrowthLabel = `${overview.onlineGrowthRate >= 0 ? '+' : ''}${safeNum(overview.onlineGrowthRate)}%`;
  const { sparklineOption, sparklineHeight } = useHomeSparklineChart(onlineTrend);

  return (
    <section className={styles.heroCard}>
      <div className={styles.heroLeft}>
        <div className={styles.heroLiveBadge}>
          <span className={styles.heroLiveDot} aria-hidden="true" />
          LIVE
        </div>
        <div className={styles.heroCountWrap}>
          <span className={styles.heroCount}>
            <AnimatedNumber value={safeNum(overview.onlineCount).toLocaleString('zh-CN')} triggerKey="online-count" />
          </span>
          <span className={styles.heroCountUnit}>人在线</span>
        </div>
        <div className={styles.heroMeta}>
          <span className={styles.heroMetaItem}>
            <IconHomeTrendUp width={12} height={12} />
            较昨日 {onlineGrowthLabel}
          </span>
          <span className={styles.heroMetaDivider} aria-hidden="true" />
          <span className={styles.heroMetaItem}>今日峰值 {safeNum(overview.onlinePeak).toLocaleString('zh-CN')} 人</span>
        </div>
      </div>

      <div className={styles.heroSparkline}>
        <ChartRenderer option={sparklineOption} className={styles.heroSparklineCanvas} height={sparklineHeight} />
      </div>

      <div className={styles.heroDecorCircle} aria-hidden="true" />
    </section>
  );
});

HomeHeroSection.displayName = 'HomeHeroSection';

export default HomeHeroSection;
