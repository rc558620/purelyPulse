// 充值收入明细页类型分布区：展示饼图与各充值类型占比进度。
import { memo } from 'react';
import type * as React from 'react';
import ChartRenderer from '@components/ui/data-display/ChartRenderer';
import { cx, isNonEmptyArray, safeNum } from '@utils/utils';
import { IconRevenueDetailPie } from '../RevenueDetailIcons/RevenueDetailIcons';
import RevenueDetailChartCard from '../RevenueDetailChartCard/RevenueDetailChartCard';
import { getRevenueToneClassName, getRevenueTypeMeta } from '../../revenueDetail.shared';
import type { RevenueTypeItem } from '../../revenueDetail.types';
import sharedStyles from '../../revenueDetail.module.less';
import styles from './RevenueDetailTypeSection.module.less';

interface RevenueDetailTypeSectionProps {
  revenueTypes: RevenueTypeItem[];
  pieOption: echarts.EChartsOption;
  chartHeight: number;
}

const RevenueDetailTypeSectionComponent = ({
  revenueTypes,
  pieOption,
  chartHeight,
}: RevenueDetailTypeSectionProps): React.JSX.Element => (
  <RevenueDetailChartCard
    className={cx(sharedStyles.typeSection, styles.root)}
    title="充值类型分布"
    icon={<IconRevenueDetailPie />}
    toneClassName={sharedStyles.toneLime}
  >
    <div className={sharedStyles.typeLayout}>
      <div className={sharedStyles.typePieWrap}>
        <ChartRenderer option={pieOption} className={sharedStyles.chartCanvas} height={chartHeight} />
        <div className={sharedStyles.typePieCenter} aria-hidden="true">
          <span className={sharedStyles.typePieCenterVal}>{revenueTypes.length}</span>
          <span className={sharedStyles.typePieCenterLbl}>类型</span>
        </div>
      </div>

      <div className={sharedStyles.typeCardList}>
        {isNonEmptyArray(revenueTypes) ? revenueTypes.map((item) => {
          const meta = getRevenueTypeMeta(item.label);
          return (
            <div key={item.label} className={cx(sharedStyles.typeItem, getRevenueToneClassName(meta.tone))}>
              <div className={sharedStyles.typeItemDot} aria-hidden="true" />
              <div className={sharedStyles.typeItemBody}>
                <div className={sharedStyles.typeItemTop}>
                  <span className={sharedStyles.typeItemLabel}>{item.label}</span>
                  <span className={sharedStyles.typeItemPct}>{safeNum(item.value)}%</span>
                </div>
                <div className={sharedStyles.typeItemTrack} aria-hidden="true">
                  <progress className={sharedStyles.typeItemProgress} max={100} value={safeNum(item.value)} />
                </div>
              </div>
            </div>
          );
        }) : null}
      </div>
    </div>
  </RevenueDetailChartCard>
);

export const RevenueDetailTypeSection = memo(RevenueDetailTypeSectionComponent);

RevenueDetailTypeSection.displayName = 'RevenueDetailTypeSection';

export default RevenueDetailTypeSection;
