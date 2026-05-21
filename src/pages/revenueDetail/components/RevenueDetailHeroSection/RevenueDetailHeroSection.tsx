// 充值收入明细页总览区：展示当前周期总额、同比增长与核心摘要指标。
import { memo } from 'react';
import type * as React from 'react';
import AnimatedNumber from '@components/ui/data-display/AnimatedNumber/AnimatedNumber';
import { cx, fmtAmount, safeNum } from '@utils/utils';
import {
  IconRevenueDetailDocument,
  IconRevenueDetailTrendUp,
} from '../RevenueDetailIcons/RevenueDetailIcons';
import type { RevenuePeriod, RevenueDetailSummary } from '../../revenueDetail.types';
import sharedStyles from '../../revenueDetail.module.less';
import styles from './RevenueDetailHeroSection.module.less';

interface RevenueDetailHeroSectionProps {
  summary: RevenueDetailSummary;
  revenuePeriod: RevenuePeriod;
  activeTags: string[];
}

const RevenueDetailHeroSectionComponent = ({
  summary,
  revenuePeriod,
  activeTags,
}: RevenueDetailHeroSectionProps): React.JSX.Element => {
  const growthLabel = `${summary.growth >= 0 ? '+' : ''}${safeNum(summary.growth)}%`;

  return (
    <section className={cx(sharedStyles.heroSection, styles.root)}>
      <div className={sharedStyles.heroMain}>
        <div className={sharedStyles.heroEyebrow}>
          <span className={sharedStyles.heroLiveDot} aria-hidden="true" />
          {activeTags[0] ?? '当前周期'}
          {activeTags[1] ? (
            <span className={sharedStyles.heroRegionTag}>{activeTags[1]}</span>
          ) : null}
        </div>
        <div className={sharedStyles.heroAmount}>
          <span className={sharedStyles.heroCurrency}>¥</span>
          <AnimatedNumber value={fmtAmount(summary.total)} triggerKey={`hero-${revenuePeriod}`} />
        </div>
        <div className={sharedStyles.heroMeta}>
          <div className={sharedStyles.heroMetaItem}>
            <IconRevenueDetailTrendUp width={13} height={13} />
            <span>同比增长</span>
            <strong className={sharedStyles.heroGrowthVal}>{growthLabel}</strong>
          </div>
          <span className={sharedStyles.heroMetaSep} aria-hidden="true" />
          <div className={sharedStyles.heroMetaItem}>
            <IconRevenueDetailDocument width={13} height={13} />
            <span>{safeNum(summary.orders).toLocaleString('zh-CN')} 笔</span>
          </div>
        </div>
      </div>

      <div className={sharedStyles.heroSecondary}>
        <div className={sharedStyles.heroSecItem}>
          <span className={sharedStyles.heroSecLabel}>日均收入</span>
          <span className={sharedStyles.heroSecVal}>
            ¥<AnimatedNumber value={fmtAmount(summary.avg)} triggerKey={`avg-${revenuePeriod}`} />
          </span>
        </div>
        <div className={sharedStyles.heroSecDivider} aria-hidden="true" />
        <div className={sharedStyles.heroSecItem}>
          <span className={sharedStyles.heroSecLabel}>单日峰值</span>
          <span className={sharedStyles.heroSecVal}>
            ¥<AnimatedNumber value={fmtAmount(summary.peak)} triggerKey={`peak-${revenuePeriod}`} />
          </span>
        </div>
      </div>
    </section>
  );
};

export const RevenueDetailHeroSection = memo(RevenueDetailHeroSectionComponent);

RevenueDetailHeroSection.displayName = 'RevenueDetailHeroSection';

export default RevenueDetailHeroSection;
