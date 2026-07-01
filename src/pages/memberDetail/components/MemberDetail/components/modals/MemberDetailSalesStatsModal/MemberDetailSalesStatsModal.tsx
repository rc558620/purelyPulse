// 营业详情弹窗：展示该商家今日/本周/本月/今年/去年的销售额与利润 ECharts 柱状图。
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import ReactDOM from 'react-dom';
import { cx, safeNum } from '@utils/utils';
import SlidingTabBar from '@components/ui/filter/SlidingTabBar';
import type { SlidingTabOption } from '@components/ui/filter/SlidingTabBar';
import Echarts from '@components/business/Echarts/Echarts';
import {
  IconClose,
  IconProfitCoin,
  IconSalesBarChart,
  IconSalesRevenue,
} from '@pages/memberDetail/components/MemberDetailIcons/MemberDetailIcons';
import type { MemberSalesStats, SalesPeriodType } from '@pages/memberList/memberList.types';
import { fetchMemberSalesStats } from '@pages/memberList/memberList.service';
import {
  type ChartMetric,
  buildChartOption,
  formatGrowth,
} from './memberDetailSalesStats.utils';
import styles from './MemberDetailSalesStatsModal.module.less';

interface MemberDetailSalesStatsModalProps {
  /** 目标会员 id。 */
  memberId: string;
  /** 会员姓名，用于弹窗副标题。 */
  memberName: string;
  /** 关闭弹窗回调。 */
  onClose: () => void;
}

// ─── 模块级常量（不随渲染变化，天然引用稳定） ────────────────────────────────

/** 时间维度 Tab 选项。 */
const PERIOD_TABS: readonly SlidingTabOption<SalesPeriodType>[] = [
  { value: 'today',    label: '今日'   },
  { value: 'week',     label: '本周'   },
  { value: 'month',    label: '本月'   },
  { value: 'year',     label: '今年'   },
  { value: 'lastYear', label: '去年'   },
] as const;

// ─── 子组件：汇总卡 ────────────────────────────────────────────────────────────

interface SummaryCardProps {
  /** 图标节点。 */
  icon: React.ReactNode;
  /** 图标容器附加样式类名。 */
  iconClassName: string;
  /** 金额展示值（后端直接返回，前端不再分转元）。 */
  totalDisplay: string;
  /** 标签文案。 */
  label: string;
  /** 增幅百分比（null = 无数据）。 */
  growthPct: number | null;
  /** 是否激活（决定卡片边框/背景色）。 */
  isActive: boolean;
  /** 激活态附加类名（销售额绿色 / 利润蓝色）。 */
  activeClassName: string;
  /** 点击事件。 */
  onClick: () => void;
}

const SummaryCard: React.FC<SummaryCardProps> = ({
  icon,
  iconClassName,
  totalDisplay,
  label,
  growthPct,
  isActive,
  activeClassName,
  onClick,
}) => (
  <button
    type="button"
    className={cx(styles.summaryCard, isActive && activeClassName)}
    onClick={onClick}
    aria-pressed={isActive}
  >
    <div className={cx(styles.summaryIconWrap, iconClassName)} aria-hidden="true">
      {icon}
    </div>
    <div className={styles.summaryCardBody}>
      <div className={styles.summaryValue}>
        <span className={styles.summaryCurrency}>¥</span>
        {totalDisplay || '0'}
      </div>
      <div className={styles.summaryLabel}>
        {label}
        {growthPct !== null && (
          <span className={cx(styles.growthTag, growthPct >= 0 ? styles.growthPos : styles.growthNeg)}>
            {formatGrowth(growthPct)}
          </span>
        )}
      </div>
    </div>
    {isActive && <div className={cx(styles.activeIndicatorDot, iconClassName === styles.iconProfit && styles.activeIndicatorDotBlue)} aria-hidden="true" />}
  </button>
);

// ─── 主组件 ────────────────────────────────────────────────────────────────────

const MemberDetailSalesStatsModal: React.FC<MemberDetailSalesStatsModalProps> = ({
  memberId,
  memberName,
  onClose,
}) => {
  const [stats, setStats] = useState<MemberSalesStats | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [activePeriod, setActivePeriod] = useState<SalesPeriodType>('week');
  const [activeMetric, setActiveMetric] = useState<ChartMetric>('sales');
  const requestIdRef = useRef<number>(0);

  // 请求营业详情数据
  const loadStats = useCallback(async (): Promise<void> => {
    const normalizedMemberId = memberId?.trim() ?? '';
    if (!normalizedMemberId) {
      setStats(null);
      setIsLoading(false);
      setErrorMessage('会员 ID 无效');
      return;
    }

    requestIdRef.current += 1;
    const currentRequestId = requestIdRef.current;
    setStats(null);
    setIsLoading(true);
    setErrorMessage('');

    try {
      const response = await fetchMemberSalesStats(normalizedMemberId);
      if (currentRequestId !== requestIdRef.current) {
        return;
      }
      setStats(response);
    } catch (error) {
      if (currentRequestId !== requestIdRef.current) {
        return;
      }
      setStats(null);
      if (typeof error === 'object' && error !== null && 'statusCode' in error && (error as { statusCode?: number }).statusCode === 403) {
        setErrorMessage('暂无权限查看营业数据');
      } else {
        setErrorMessage(error instanceof Error ? error.message : '获取营业详情失败');
      }
    } finally {
      if (currentRequestId === requestIdRef.current) {
        setIsLoading(false);
      }
    }
  }, [memberId]);

  useEffect(() => {
    void loadStats();
  }, [loadStats]);

  // ESC 关闭
  useEffect(() => {
    const handler = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const handleOverlayClick = useCallback((event: React.MouseEvent<HTMLDivElement>): void => {
    if (event.target === event.currentTarget) onClose();
  }, [onClose]);

  const handleRetry = useCallback((): void => {
    void loadStats();
  }, [loadStats]);

  const handleSelectSales = useCallback((): void => setActiveMetric('sales'), []);
  const handleSelectProfit = useCallback((): void => setActiveMetric('profit'), []);

  // 渲染主体内容
  const renderBody = (): React.ReactNode => {
    if (isLoading) {
      return (
        <div className={styles.body}>
          <div className={styles.skeletonTab} />
          <div className={styles.skeletonRow}>
            <div className={styles.skeletonCard} />
            <div className={styles.skeletonCard} />
          </div>
          <div className={styles.skeletonChartHeader} />
          <div className={styles.skeletonChart} />
        </div>
      );
    }

    if (errorMessage || !stats) {
      return (
        <div className={styles.body}>
          <div className={styles.stateBox}>
            <p className={styles.stateText}>{errorMessage || '暂无营业数据'}</p>
            {errorMessage && (
              <button type="button" className={styles.retryBtn} onClick={handleRetry}>
                重新加载
              </button>
            )}
          </div>
        </div>
      );
    }

    const currentSummary = stats[activePeriod];
    const totalDisplay = activeMetric === 'sales' ? currentSummary.totalSalesDisplay : currentSummary.totalProfitDisplay;
    const growthPct = activeMetric === 'sales'
      ? currentSummary.salesGrowthPct
      : currentSummary.profitGrowthPct;
    const isPositiveGrowth = growthPct !== null && safeNum(growthPct) >= 0;

    // ECharts option：仅 dataPoints / metric 变化时才重算
    const chartOption = buildChartOption(
      currentSummary.dataPoints.map(p => p.label),
      currentSummary.dataPoints.map(p =>
        safeNum(Number(activeMetric === 'sales' ? p.salesDisplay : p.profitDisplay)),
      ),
      activeMetric,
    );

    return (
      <div className={styles.body}>
        {/* 时间维度 Tab */}
        <div className={styles.periodTabWrap}>
          <SlidingTabBar
            options={PERIOD_TABS}
            value={activePeriod}
            onChange={setActivePeriod}
            variant="segment"
            ariaLabel="时间维度选择"
          />
        </div>

        {/* 销售额 + 利润汇总卡 */}
        <div className={styles.summaryRow}>
          {/* 销售额汇总卡 */}
          <SummaryCard
            icon={<IconSalesRevenue width={16} height={16} strokeWidth={2.2} />}
            iconClassName={styles.iconSales}
            totalDisplay={currentSummary.totalSalesDisplay}
            label="销售额"
            growthPct={currentSummary.salesGrowthPct}
            isActive={activeMetric === 'sales'}
            activeClassName={styles.summaryCardActive}
            onClick={handleSelectSales}
          />
          {/* 利润汇总卡 */}
          <SummaryCard
            icon={<IconProfitCoin width={16} height={16} strokeWidth={2.2} />}
            iconClassName={styles.iconProfit}
            totalDisplay={currentSummary.totalProfitDisplay}
            label="利润"
            growthPct={currentSummary.profitGrowthPct}
            isActive={activeMetric === 'profit'}
            activeClassName={styles.summaryCardActiveBlue}
            onClick={handleSelectProfit}
          />
        </div>

        {/* 图表区标题行 */}
        <div className={styles.chartHeader}>
          <div className={styles.chartTitleGroup}>
            <span className={styles.chartTitleIcon} aria-hidden="true">
              {activeMetric === 'sales'
                ? <IconSalesRevenue width={14} height={14} strokeWidth={2.2} />
                : <IconProfitCoin width={14} height={14} strokeWidth={2.2} />
              }
            </span>
            <span className={styles.chartTitle}>
              {activeMetric === 'sales' ? '销售额趋势' : '利润趋势'}
            </span>
          </div>
          <div className={cx(styles.chartTotalBadge, activeMetric === 'profit' && styles.chartTotalBadgeBlue)}>
            <span className={styles.chartTotalLabel}>合计</span>
            <span className={styles.chartTotalValue}>
              ¥{totalDisplay || '0'}
            </span>
            {growthPct !== null && (
              <span className={cx(styles.chartGrowthBadge, isPositiveGrowth ? styles.growthPos : styles.growthNeg)}>
                {formatGrowth(growthPct)}
              </span>
            )}
          </div>
        </div>

        {/* ECharts 柱状图 / 空态 */}
        {currentSummary.dataPoints.length > 0 ? (
          <div className={styles.chartWrap}>
            <Echarts option={chartOption} className={styles.chart} />
          </div>
        ) : (
          <div className={styles.chartEmpty}>
            <IconSalesBarChart width={32} height={32} strokeWidth={1.4} />
            <p className={styles.chartEmptyText}>暂无趋势数据</p>
          </div>
        )}
      </div>
    );
  };

  return ReactDOM.createPortal(
    <div
      className={styles.overlay}
      role="dialog"
      aria-modal="true"
      aria-label={`${memberName} 营业详情`}
      onClick={handleOverlayClick}
    >
      <div className={styles.card}>
        {/* 弹窗头部 */}
        <div className={styles.header}>
          <div className={styles.headerMain}>
            <div className={styles.headerIcon} aria-hidden="true">
              <IconSalesBarChart width={16} height={16} strokeWidth={2.2} />
            </div>
            <div className={styles.headerText}>
              <h2 className={styles.title}>营业详情</h2>
              <p className={styles.desc}>{memberName} 的销售额与利润数据</p>
            </div>
          </div>
          <button
            type="button"
            className={styles.closeBtn}
            onClick={onClose}
            aria-label="关闭营业详情"
          >
            <IconClose width={16} height={16} strokeWidth={2.4} />
          </button>
        </div>

        {/* 弹窗主体 */}
        {renderBody()}

        {/* 底部关闭按钮 */}
        <div className={styles.footer}>
          <button type="button" className={styles.footerCloseBtn} onClick={onClose}>
            关闭
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
};

export default MemberDetailSalesStatsModal;
