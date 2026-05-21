// 充值收入明细页趋势区：展示折线图与当前筛选文案。
import { memo } from 'react';
import type * as React from 'react';
import ChartRenderer from '@components/ui/data-display/ChartRenderer';
import { cx } from '@utils/utils';
import { IconRevenueDetailTrendUp } from '../RevenueDetailIcons/RevenueDetailIcons';
import RevenueDetailChartCard from '../RevenueDetailChartCard/RevenueDetailChartCard';
import sharedStyles from '../../revenueDetail.module.less';
import styles from './RevenueDetailTrendSection.module.less';

interface RevenueDetailTrendSectionProps {
  chartSubtitle: string;
  revenueChartOption: echarts.EChartsOption;
  chartHeight: number;
}

const RevenueDetailTrendSectionComponent = ({
  chartSubtitle,
  revenueChartOption,
  chartHeight,
}: RevenueDetailTrendSectionProps): React.JSX.Element => (
  <RevenueDetailChartCard
    className={cx(sharedStyles.chartSection, styles.root)}
    title="收入趋势图"
    subtitle={chartSubtitle}
    icon={<IconRevenueDetailTrendUp strokeWidth={2} />}
    toneClassName={sharedStyles.toneOrange}
  >
    <div className={sharedStyles.chartWrap}>
      <ChartRenderer option={revenueChartOption} className={sharedStyles.chartCanvas} height={chartHeight} />
    </div>
  </RevenueDetailChartCard>
);

export const RevenueDetailTrendSection = memo(RevenueDetailTrendSectionComponent);

RevenueDetailTrendSection.displayName = 'RevenueDetailTrendSection';

export default RevenueDetailTrendSection;
