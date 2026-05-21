// 首页收入趋势区块：负责收入图表、概览指标与类型分布展示。
import { memo } from 'react';
import AnimatedNumber from '@components/ui/data-display/AnimatedNumber/AnimatedNumber';
import ChartRenderer from '@components/ui/data-display/ChartRenderer';
import { cx, fmtAmount, isNonEmptyArray, safeNum } from '@utils/utils';
import type { CSSProperties } from 'react';
import type { HomeRevenueTypeItem, RevenuePeriod, HomeRevenuePeriodData } from '../../home.types';
import { useHomeRevenueChart } from '../../useHomeCharts';
import { CHART_ICON_GRADIENTS } from '../../home.constants';
import { IconHomeChevronRight, IconHomeTrendUp } from '../HomeIcons/HomeIcons';
import styles from './HomeRevenueSection.module.less';

type HomeRevenueTypeTone = 'lime' | 'emerald' | 'blue' | 'slate';

interface HomeRevenueSectionProps {
  revenuePeriod: RevenuePeriod;
  revenueSummary: HomeRevenuePeriodData;
  revenueTypes: HomeRevenueTypeItem[];
  onNavigateDetail: () => void;
}

interface HomeRevenueTypeSectionProps {
  revenueTypes: HomeRevenueTypeItem[];
}

const revenueTypeToneMap: Record<string, HomeRevenueTypeTone> = {
  月卡会员: 'lime',
  季度会员: 'emerald',
  年卡会员: 'blue',
  其他充值: 'slate',
};

const getRevenueTypeToneClassName = (tone: HomeRevenueTypeTone): string => {
  switch (tone) {
    case 'lime':
      return styles.revenueTypeToneLime;
    case 'emerald':
      return styles.revenueTypeToneEmerald;
    case 'blue':
      return styles.revenueTypeToneBlue;
    case 'slate':
      return styles.revenueTypeToneSlate;
    default:
      return styles.revenueTypeToneSlate;
  }
};

const HomeRevenueTypeSection = ({ revenueTypes }: HomeRevenueTypeSectionProps): React.JSX.Element => (
  <div className={styles.revenueTypeGrid}>
    {isNonEmptyArray(revenueTypes)
      ? revenueTypes.map((item) => {
          const tone = revenueTypeToneMap[item.label] ?? 'slate';
          // 百分比宽度由实时数据驱动，这里保留最小范围的 style 透传，避免 transform 缩放方案影响条形观感。
          const typeFillStyle: CSSProperties = {
            width: `${safeNum(item.value)}%`,
          };

          return (
            <div key={item.label} className={cx(styles.revenueTypeItem, getRevenueTypeToneClassName(tone))}>
              <div className={styles.revenueTypeTop}>
                <span className={styles.revenueTypeDot} aria-hidden="true" />
                <span className={styles.revenueTypeLabel}>{item.label}</span>
                <span className={styles.revenueTypePct}>{safeNum(item.value)}%</span>
              </div>
              <div className={styles.revenueTypeTrack} aria-hidden="true">
                <div className={styles.revenueTypeFill} style={typeFillStyle} />
              </div>
            </div>
          );
        })
      : null}
  </div>
);

const HomeRevenueSection = memo(({
  revenuePeriod,
  revenueSummary,
  revenueTypes,
  onNavigateDetail,
}: HomeRevenueSectionProps): React.JSX.Element => {
  const revenueGrowthLabel = `${revenueSummary.growth >= 0 ? '+' : ''}${safeNum(revenueSummary.growth)}%`;
  const { revenueChartOption, revenueChartHeight } = useHomeRevenueChart(revenuePeriod, revenueSummary);

  return (
    <section className={styles.revenueCard}>
      <div className={styles.revenueTitleWrap}>
        <div className={styles.revenueTitleIcon} style={{ background: CHART_ICON_GRADIENTS.revenueTrend }} aria-hidden="true">
          <IconHomeTrendUp />
        </div>
        <div className={styles.revenueTitleContent}>
          <div className={styles.revenueTitle}>充值收入趋势</div>
          <div className={styles.revenueSub}>按时间周期查看收入变化</div>
        </div>
        <button
          className={styles.revenueDetailBtn}
          type="button"
          aria-label="查看充值收入趋势详情"
          onClick={onNavigateDetail}
        >
          详情
          <IconHomeChevronRight width={13} height={13} />
        </button>
      </div>

      <div className={styles.revenueSummary}>
        <div className={styles.revenueSummaryItem}>
          <span className={styles.revenueSummaryVal}>
            ¥<AnimatedNumber value={fmtAmount(revenueSummary.total)} triggerKey={`rev-total-${revenuePeriod}`} />
          </span>
          <span className={styles.revenueSummaryLbl}>总充值收入</span>
        </div>
        <div className={styles.revenueSummaryDivider} aria-hidden="true" />
        <div className={styles.revenueSummaryItem}>
          <span className={styles.revenueSummaryVal}>
            ¥<AnimatedNumber value={fmtAmount(revenueSummary.avg)} triggerKey={`rev-avg-${revenuePeriod}`} />
          </span>
          <span className={styles.revenueSummaryLbl}>日均收入</span>
        </div>
        <div className={styles.revenueSummaryDivider} aria-hidden="true" />
        <div className={styles.revenueSummaryItem}>
          <span className={cx(styles.revenueSummaryVal, styles.revenueSummaryGreen)}>
            <AnimatedNumber value={revenueGrowthLabel} triggerKey={`rev-growth-${revenuePeriod}`} />
          </span>
          <span className={styles.revenueSummaryLbl}>同比增长</span>
        </div>
      </div>

      <div className={styles.revenueChartWrap}>
        <ChartRenderer option={revenueChartOption} className={styles.revenueChartCanvas} height={revenueChartHeight} />
      </div>

      <HomeRevenueTypeSection revenueTypes={revenueTypes} />
    </section>
  );
});

HomeRevenueSection.displayName = 'HomeRevenueSection';

export default HomeRevenueSection;
