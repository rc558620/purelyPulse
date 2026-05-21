// 推广详情趋势图：负责装配趋势图卡片与空态。
import React from 'react';
import ChartRenderer from '@components/ui/data-display/ChartRenderer';
import { EmptyState } from '@components/ui/feedback';
import { isNonEmptyArray } from '@utils/utils';
import {
  IconPromotionDetailChart,
  IconPromotionDetailEmpty,
} from '../_shared/icons/PromotionDetailIcons';
import PromotionDetailChartCard from '../cards/PromotionDetailChartCard';
import styles from '../../promotionDetail.module.less';
import type { PromotionPeriodRecord, PromotionPeriodTab } from '../../promotionDetail.types';
import { usePromotionTrendChart } from '../../usePromotionDetailCharts';

export interface PromotionDetailTrendChartProps {
  periodTab: PromotionPeriodTab;
  periodRecords: PromotionPeriodRecord[];
}

const PromotionDetailTrendChart: React.FC<PromotionDetailTrendChartProps> = ({
  periodTab,
  periodRecords,
}) => {
  const { trendChartOption, trendChartHeight } = usePromotionTrendChart(periodRecords);

  return (
    <PromotionDetailChartCard
      title={`${periodTab === 'day' ? '每日' : periodTab === 'month' ? '每月' : '每年'}推广趋势`}
      icon={<IconPromotionDetailChart width={14} height={14} />}
    >
      {isNonEmptyArray(periodRecords) ? (
        <ChartRenderer option={trendChartOption} className={styles.chartCanvas} height={trendChartHeight} />
      ) : (
        <div className={styles.chartEmptyState}>
          <EmptyState
            icon={<IconPromotionDetailEmpty />}
            title="暂无趋势数据"
            desc="当前合伙人在该时间维度下还没有趋势明细。"
          />
        </div>
      )}
    </PromotionDetailChartCard>
  );
};

export default React.memo(PromotionDetailTrendChart);
