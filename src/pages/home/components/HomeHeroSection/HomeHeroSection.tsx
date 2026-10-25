// 首页在线概览区块：标题 + 柱状图展示商家端 / 个人端 / 合计的在线人数。
import { memo } from 'react';
import ChartRenderer from '@components/ui/data-display/ChartRenderer';
import { safeNum } from '@utils/utils';
import type { HomeOverviewData } from '../../home.types';
import { useHomeOnlineBarChart } from '../../useHomeCharts';
import { IconHomeTrendUp } from '../HomeIcons/HomeIcons';
import styles from './HomeHeroSection.module.less';

interface HomeHeroSectionProps {
  overview: Pick<
    HomeOverviewData,
    'onlineCount' | 'profitOnlineCount' | 'clubOnlineCount' | 'onlinePeak' | 'onlineGrowthRate'
  >;
}

const HomeHeroSection = memo(({ overview }: HomeHeroSectionProps): React.JSX.Element => {
  const onlineGrowthLabel = `${overview.onlineGrowthRate >= 0 ? '+' : ''}${safeNum(overview.onlineGrowthRate)}%`;
  const { onlineBarOption, onlineBarHeight } = useHomeOnlineBarChart({
    profitCount: safeNum(overview.profitOnlineCount),
    clubCount: safeNum(overview.clubOnlineCount),
    totalCount: safeNum(overview.onlineCount),
  });

  return (
    <section className={styles.heroCard}>
      <div className={styles.heroLeft}>
        <div className={styles.heroHead}>
          <div className={styles.heroLiveBadge}>
            <span className={styles.heroLiveDot} aria-hidden="true" />
            LIVE
          </div>
          {/* 三端在线人数由右侧柱状图承载，左侧只保留语义标题 */}
          <h2 className={styles.heroTitle}>在线人数</h2>
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

      {/* 三端在线人数对比柱状图：数值全部取自接口，是本卡片唯一的数据呈现 */}
      <div className={styles.heroChart}>
        <ChartRenderer
          option={onlineBarOption}
          height={onlineBarHeight}
          className={styles.heroChartCanvas}
        />
      </div>

      <div className={styles.heroDecorCircle} aria-hidden="true" />
    </section>
  );
});

HomeHeroSection.displayName = 'HomeHeroSection';

export default HomeHeroSection;
