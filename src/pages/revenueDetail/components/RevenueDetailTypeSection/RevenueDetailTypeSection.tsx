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
}

// 饼图尺寸完全交给 .typePieWrap（响应式 140/180）决定。
// 不传 height 时 ChartRenderer / Echarts 会兜底 DEFAULT_CHART_HEIGHT(300px)，
// 画布变成「180 宽 × 300 高」：ECharts 按画布 50% 定位圆环中心（y=150），
// 而中心文字按 .typePieWrap 居中（y=90），两者相差 (300-180)/2=60px 导致错位。
// 这里显式 height:100%（覆盖兜底高度）+ minHeight:0，让画布与 wrap 完全同尺寸。
const PIE_CANVAS_STYLE: React.CSSProperties = { height: '100%', minHeight: 0 };

const RevenueDetailTypeSectionComponent = ({
  revenueTypes,
  pieOption,
}: RevenueDetailTypeSectionProps): React.JSX.Element => {
  // 饼图中心显示占比最大的类型百分比，比显示类型数量更有业务意义
  const dominantType = revenueTypes.reduce<RevenueTypeItem | null>(
    (max, item) => (max === null || item.value > max.value ? item : max),
    null,
  );
  const centerValue = dominantType ? `${safeNum(dominantType.value)}%` : '--';
  const centerLabel = dominantType?.label ?? '暂无数据';

  return (
  <RevenueDetailChartCard
    className={cx(sharedStyles.typeSection, styles.root)}
    title="充值类型分布"
    icon={<IconRevenueDetailPie />}
    toneClassName={sharedStyles.toneLime}
  >
    <div className={sharedStyles.typeLayout}>
      <div className={sharedStyles.typePieWrap}>
        <ChartRenderer
          option={pieOption}
          className={sharedStyles.chartCanvas}
          style={PIE_CANVAS_STYLE}
        />
        <div className={sharedStyles.typePieCenter} aria-hidden="true">
          <span className={sharedStyles.typePieCenterVal}>{centerValue}</span>
          <span className={sharedStyles.typePieCenterLbl}>{centerLabel}</span>
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
};

export const RevenueDetailTypeSection = memo(RevenueDetailTypeSectionComponent);

RevenueDetailTypeSection.displayName = 'RevenueDetailTypeSection';

export default RevenueDetailTypeSection;
