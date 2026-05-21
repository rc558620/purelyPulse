// 充值收入明细页指标网格：展示总收入、均值、笔数与峰值四张摘要卡片。
import { memo } from 'react';
import type * as React from 'react';
import AnimatedNumber from '@components/ui/data-display/AnimatedNumber/AnimatedNumber';
import { cx, fmtAmount, isNonEmptyArray, safeNum } from '@utils/utils';
import {
  IconRevenueDetailCalendar,
  IconRevenueDetailCurrency,
  IconRevenueDetailDocument,
  IconRevenueDetailTrendUp,
} from '../RevenueDetailIcons/RevenueDetailIcons';
import type { RevenuePeriod, RevenueDetailSummary } from '../../revenueDetail.types';
import { getRevenueToneClassName } from '../../revenueDetail.shared';
import type { RevenueToneClassName } from '../../revenueDetail.shared';
import sharedStyles from '../../revenueDetail.module.less';
import styles from './RevenueDetailMetricGrid.module.less';

interface RevenueMetricCard {
  key: string;
  label: string;
  value: React.JSX.Element;
  tone: RevenueToneClassName;
  icon: React.JSX.Element;
  badge: string;
}

interface RevenueDetailMetricGridProps {
  summary: RevenueDetailSummary;
  revenuePeriod: RevenuePeriod;
  growthLabel: string;
}

interface BuildRevenueMetricCardsParams {
  summary: RevenueDetailSummary;
  revenuePeriod: RevenuePeriod;
  growthLabel: string;
}

interface RevenueMetricCardConfig {
  key: string;
  label: string;
  tone: RevenueToneClassName;
  icon: React.JSX.Element;
  badge: string | ((params: BuildRevenueMetricCardsParams) => string);
  renderValue: (params: BuildRevenueMetricCardsParams) => React.JSX.Element;
}

const REVENUE_METRIC_CARD_CONFIGS: ReadonlyArray<RevenueMetricCardConfig> = [
  {
    key: 'total',
    label: '总充值收入',
    tone: 'toneOrange',
    icon: <IconRevenueDetailCurrency />,
    badge: ({ growthLabel }) => growthLabel,
    renderValue: ({ summary, revenuePeriod }) => (
      <>
        <span className={sharedStyles.bentoValPrefix}>¥</span>
        <AnimatedNumber value={fmtAmount(summary.total)} triggerKey={`b-total-${revenuePeriod}`} />
      </>
    ),
  },
  {
    key: 'avg',
    label: '日均收入',
    tone: 'toneLime',
    icon: <IconRevenueDetailCalendar />,
    badge: '平均',
    renderValue: ({ summary, revenuePeriod }) => (
      <>
        <span className={sharedStyles.bentoValPrefix}>¥</span>
        <AnimatedNumber value={fmtAmount(summary.avg)} triggerKey={`b-avg-${revenuePeriod}`} />
      </>
    ),
  },
  {
    key: 'orders',
    label: '充值笔数',
    tone: 'toneIndigo',
    icon: <IconRevenueDetailDocument />,
    badge: '笔',
    renderValue: ({ summary, revenuePeriod }) => (
      <AnimatedNumber value={safeNum(summary.orders).toLocaleString('zh-CN')} triggerKey={`b-orders-${revenuePeriod}`} />
    ),
  },
  {
    key: 'peak',
    label: '单日峰值',
    tone: 'toneEmerald',
    icon: <IconRevenueDetailTrendUp strokeWidth={2} />,
    badge: '峰值',
    renderValue: ({ summary, revenuePeriod }) => (
      <>
        <span className={sharedStyles.bentoValPrefix}>¥</span>
        <AnimatedNumber value={fmtAmount(summary.peak)} triggerKey={`b-peak-${revenuePeriod}`} />
      </>
    ),
  },
];

const buildRevenueMetricCards = (
  params: BuildRevenueMetricCardsParams,
): RevenueMetricCard[] => REVENUE_METRIC_CARD_CONFIGS.map((item) => ({
  key: item.key,
  label: item.label,
  tone: item.tone,
  icon: item.icon,
  badge: typeof item.badge === 'function' ? item.badge(params) : item.badge,
  value: item.renderValue(params),
}));

const RevenueDetailMetricGridComponent = ({
  summary,
  revenuePeriod,
  growthLabel,
}: RevenueDetailMetricGridProps): React.JSX.Element => {
  const metricCards = buildRevenueMetricCards({
    summary,
    revenuePeriod,
    growthLabel,
  });

  return (
    <section className={cx(sharedStyles.bentoGrid, styles.root)}>
      {isNonEmptyArray(metricCards) ? metricCards.map((item) => (
        <div key={item.key} className={cx(sharedStyles.bentoCard, getRevenueToneClassName(item.tone))}>
          <div className={sharedStyles.bentoDeco} aria-hidden="true" />
          <div className={sharedStyles.bentoIcon} aria-hidden="true">
            {item.icon}
          </div>
          <div className={sharedStyles.bentoVal}>{item.value}</div>
          <div className={sharedStyles.bentoBottom}>
            <span className={sharedStyles.bentoLabel}>{item.label}</span>
            <span className={sharedStyles.bentoBadge}>{item.badge}</span>
          </div>
        </div>
      )) : null}
    </section>
  );
};

export const RevenueDetailMetricGrid = memo(RevenueDetailMetricGridComponent);

RevenueDetailMetricGrid.displayName = 'RevenueDetailMetricGrid';

export default RevenueDetailMetricGrid;
