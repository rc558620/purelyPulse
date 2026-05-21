// 首页合伙人概览区块：负责合伙人总数、活跃率与推广收益展示。
import { memo } from 'react';
import AnimatedNumber from '@components/ui/data-display/AnimatedNumber/AnimatedNumber';
import { cx, fmtAmount, safeNum } from '@utils/utils';
import type { HomePartnerStats } from '../../home.types';
import { IconHomeActiveRateRing, IconHomeClock, IconHomeCurrency, IconHomeUsers } from '../HomeIcons/HomeIcons';
import styles from './HomePartnerOverviewSection.module.less';

interface HomePartnerOverviewSectionProps {
  partnerStats: HomePartnerStats;
}

const HomePartnerOverviewSection = memo(({ partnerStats }: HomePartnerOverviewSectionProps): React.JSX.Element => (
  <section className={styles.bentoRow}>
    <div className={cx(styles.bentoCard, styles.bentoCardPurple)}>
      <div className={cx(styles.bentoBadge, styles.bentoBadgePurple)}>
        <IconHomeUsers />
        合伙人
      </div>
      <div className={cx(styles.bentoBigNum, styles.bentoBigNumPurple)}>
        <AnimatedNumber value={safeNum(partnerStats.total)} triggerKey="partner-total" />
      </div>
      <div className={styles.bentoLabel}>总人数</div>
      <div className={cx(styles.bentoTag, styles.bentoTagPurple)}>
        本月 +{safeNum(partnerStats.newThisMonth)}
      </div>
    </div>

    <div className={cx(styles.bentoCard, styles.bentoCardEmerald)}>
      <div className={cx(styles.bentoBadge, styles.bentoBadgeEmerald)}>
        <IconHomeClock />
        活跃率
      </div>
      <div className={cx(styles.bentoBigNum, styles.bentoBigNumEmerald)}>
        <AnimatedNumber value={safeNum(partnerStats.activeRate)} triggerKey="partner-active" />
        <span className={styles.bentoUnit}>%</span>
      </div>
      <div className={styles.bentoLabel}>本月活跃</div>
      <div className={styles.bentoRingWrap} aria-hidden="true">
        <IconHomeActiveRateRing className={styles.bentoRingSvg} progress={safeNum(partnerStats.activeRate)} />
      </div>
    </div>

    <div className={cx(styles.bentoCard, styles.bentoCardBlue)}>
      <div className={cx(styles.bentoBadge, styles.bentoBadgeBlue)}>
        <IconHomeCurrency />
        收益
      </div>
      <div className={cx(styles.bentoBigNum, styles.bentoBigNumBlue, styles.bentoBigNumRevenue)}>
        ¥<AnimatedNumber value={fmtAmount(safeNum(partnerStats.totalRevenue))} triggerKey="partner-revenue" />
      </div>
      <div className={styles.bentoLabel}>推广总收益</div>
      <div className={cx(styles.bentoTag, styles.bentoTagBlue)}>
        {safeNum(partnerStats.totalOrders).toLocaleString('zh-CN')} 单
      </div>
    </div>
  </section>
));

HomePartnerOverviewSection.displayName = 'HomePartnerOverviewSection';

export default HomePartnerOverviewSection;
