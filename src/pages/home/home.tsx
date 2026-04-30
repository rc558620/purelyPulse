import React, { useCallback, useMemo, useState } from 'react';
import AnimatedNumber from '@components/ui/data-display/AnimatedNumber/AnimatedNumber';
import SlidingTabBar from '@components/ui/filter/SlidingTabBar/SlidingTabBar';
import CustomModeBtnRow from '@components/form/CustomModeBtnRow/CustomModeBtnRow';
import DateRangePicker from '@components/form/DateRangePicker/DateRangePicker';
import DayPicker from '@components/form/DayPicker';
import { CascaderView } from '@components/form/CascaderView';
import Echarts from '@components/business/Echarts/Echarts';
import { fmtAmount } from '@utils/utils';
import { REGION_DATA } from '@constants/regionData';
import type { CascadeValue } from '@components/form/CascaderView/types';
import { useAnimatedNavigate } from '@hooks/useAnimatedNavigate';
import { ROUTE_PATHS } from '../../router/paths';
import styles from './home.module.less';

// ─── Mock 数据 ──────────────────────────────────────────────────

const ONLINE_COUNT = 2847;
const ONLINE_PEAK = 5120;
const ONLINE_TREND = [1200, 1800, 2200, 3100, 2847, 2600, 2900, 3400, 3100, 2847];

const PARTNER_STATS = {
  total: 312,
  newThisMonth: 28,
  activeRate: 78,
  totalRevenue: 124800,
  totalOrders: 3640,
  avgPerPartner: 400,
};

const PARTNER_TOP = [
  { name: '张三', city: '上海', orders: 240, revenue: 12000 },
  { name: '李四', city: '北京', orders: 198, revenue: 9900 },
  { name: '王五', city: '广州', orders: 175, revenue: 8750 },
  { name: '赵六', city: '成都', orders: 152, revenue: 7600 },
  { name: '陈七', city: '杭州', orders: 138, revenue: 6900 },
];

type RevenuePeriod = 'today' | 'week' | 'month' | 'season';

const REVENUE_TABS = [
  { value: 'today'  as const, label: '今日' },
  { value: 'week'   as const, label: '本周' },
  { value: 'month'  as const, label: '本月' },
  { value: 'season' as const, label: '本季' },
];

const REVENUE_DATA: Record<RevenuePeriod, { dates: string[]; values: number[] }> = {
  today: {
    dates: ['0:00', '3:00', '6:00', '9:00', '12:00', '15:00', '18:00', '21:00', '24:00'],
    values: [120, 80, 200, 680, 950, 1100, 1380, 1200, 920],
  },
  week: {
    dates: ['4/11', '4/12', '4/13', '4/14', '4/15', '4/16', '4/17'],
    values: [3200, 4100, 3800, 5200, 4600, 6100, 5800],
  },
  month: {
    dates: Array.from({ length: 30 }, (_, i) => {
      const d = new Date(2026, 2, 19 + i);
      return `${d.getMonth() + 1}/${d.getDate()}`;
    }),
    values: [
      2800, 3100, 2600, 3800, 4200, 3600, 5100, 4800, 3900, 4600,
      5200, 4100, 3700, 4900, 5500, 4300, 3800, 5800, 6100, 4700,
      5300, 4900, 5600, 4200, 6200, 5800, 4600, 5100, 6400, 5800,
    ],
  },
  season: {
    dates: Array.from({ length: 13 }, (_, i) => {
      const d = new Date(2026, 0, 18 + i * 7);
      return `${d.getMonth() + 1}/${d.getDate()}`;
    }),
    values: [18200, 21600, 19800, 24100, 22400, 27800, 25600, 31200, 28900, 34600, 32100, 38400, 40700],
  },
};

const REVENUE_SUMMARY: Record<RevenuePeriod, { total: number; avg: number; growth: number }> = {
  today:  { total: 6730,   avg: 841,  growth: 18.2 },
  week:   { total: 32800,  avg: 4686, growth: 12.4 },
  month:  { total: 142600, avg: 4753, growth: 8.7  },
  season: { total: 384600, avg: 4273, growth: 15.2 },
};

// ─── 组件 ──────────────────────────────────────────────────────

// 合伙人申请待审核数（Mock）
const PENDING_APPLICATION_COUNT = 5;

const Home: React.FC = () => {
  const navigate = useAnimatedNavigate();
  const [revenuePeriod, setRevenuePeriod] = useState<RevenuePeriod>('month');

  // 自定义日期模式
  const [isCustomDate,  setIsCustomDate]  = useState(false);
  const [isCustomRange, setIsCustomRange] = useState(false);

  // 单日选择
  const now = new Date();
  const [customYear,  setCustomYear]  = useState(now.getFullYear());
  const [customMonth, setCustomMonth] = useState(now.getMonth() + 1);
  const [customDay,   setCustomDay]   = useState(now.getDate());

  // 日期范围
  const [rangeStartYear,  setRangeStartYear]  = useState(now.getFullYear());
  const [rangeStartMonth, setRangeStartMonth] = useState(now.getMonth() + 1);
  const [rangeStartDay,   setRangeStartDay]   = useState(1);
  const [rangeEndYear,    setRangeEndYear]    = useState(now.getFullYear());
  const [rangeEndMonth,   setRangeEndMonth]   = useState(now.getMonth() + 1);
  const [rangeEndDay,     setRangeEndDay]     = useState(now.getDate());

  // 推广排行 — 地区
  const [rankRegion, setRankRegion] = useState<CascadeValue[]>([]);

  // 地区显示文本（取最末级 label）
  const regionDisplayText = useMemo(() => {
    if (rankRegion.length === 0) return '全部地区';
    const labels: string[] = [];
    let nodes = REGION_DATA;
    for (const val of rankRegion) {
      const node = nodes.find(n => n.value === val);
      if (!node) break;
      labels.push(node.label);
      nodes = node.children ?? [];
    }
    return labels.join(' · ');
  }, [rankRegion]);

  const handleToggleCustomDate = useCallback(() => {
    setIsCustomDate(prev => !prev);
    setIsCustomRange(false);
  }, []);

  const handleToggleCustomRange = useCallback(() => {
    setIsCustomRange(prev => !prev);
    setIsCustomDate(false);
  }, []);

  const handleCustomDayClear = useCallback(() => {
    setIsCustomDate(false);
  }, []);

  const customDateBtnText = isCustomDate
    ? `${customYear}/${String(customMonth).padStart(2, '0')}/${String(customDay).padStart(2, '0')}`
    : '选择年月日';

  // ── 在线人数 sparkline ──
  const sparklineOption = useMemo<echarts.EChartsOption>(() => ({
    grid: { top: 0, bottom: 0, left: 0, right: 0 },
    xAxis: { type: 'category', show: false, data: ONLINE_TREND.map((_, i) => i) },
    yAxis: { type: 'value', show: false },
    series: [{
      type: 'line',
      data: ONLINE_TREND,
      smooth: true,
      symbol: 'none',
      lineStyle: { color: '#84cc16', width: 2.5 },
      areaStyle: {
        color: {
          type: 'linear',
          x: 0, y: 0, x2: 0, y2: 1,
          colorStops: [
            { offset: 0, color: 'rgba(132,204,22,0.4)' },
            { offset: 1, color: 'rgba(132,204,22,0.02)' },
          ],
        },
      },
    }],
  }), []);

  // ── 充值收入折线图 ──
  const revenueData = REVENUE_DATA[revenuePeriod];
  const revenueChartOption = useMemo<echarts.EChartsOption>(() => ({
    grid: { top: 16, bottom: 40, left: 52, right: 16 },
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(255,255,255,0.96)',
      borderColor: '#e2e8f0',
      borderWidth: 1,
      textStyle: { color: '#1e293b', fontSize: 12 },
      formatter: (params: unknown) => {
        const p = (params as { axisValue: string; value: number }[])[0];
        return `${p.axisValue}：¥${fmtAmount(p.value)}`;
      },
    },
    xAxis: {
      type: 'category',
      data: revenueData.dates,
      axisLine: { lineStyle: { color: '#e2e8f0' } },
      axisTick: { show: false },
      axisLabel: {
        color: '#94a3b8',
        fontSize: 10,
        interval: revenuePeriod === 'month' ? 4 : revenuePeriod === 'season' ? 1 : 0,
      },
      boundaryGap: false,
    },
    yAxis: {
      type: 'value',
      axisLine: { show: false },
      axisTick: { show: false },
      splitLine: { lineStyle: { color: '#f1f5f9' } },
      axisLabel: {
        color: '#94a3b8',
        fontSize: 10,
        formatter: (v: number) => v >= 10000 ? `${(v / 10000).toFixed(1)}w` : String(v),
      },
    },
    series: [{
      type: 'line',
      data: revenueData.values,
      smooth: true,
      symbol: 'circle',
      symbolSize: 5,
      showSymbol: false,
      lineStyle: { color: '#84cc16', width: 2.5 },
      itemStyle: { color: '#84cc16' },
      areaStyle: {
        color: {
          type: 'linear',
          x: 0, y: 0, x2: 0, y2: 1,
          colorStops: [
            { offset: 0, color: 'rgba(132,204,22,0.28)' },
            { offset: 1, color: 'rgba(132,204,22,0.02)' },
          ],
        },
      },
    }],
  }), [revenueData, revenuePeriod]);

  const revenueSummary = REVENUE_SUMMARY[revenuePeriod];

  return (
    <div className={styles.pageContainer}>
      {/* 背景装饰 */}
      <div className={styles.bgOrb1} aria-hidden="true" />
      <div className={styles.bgOrb2} aria-hidden="true" />
      <div className={styles.bgGrid} aria-hidden="true" />

      <main className={styles.contentWrapper}>

        {/* ═══════════════════════════════════════════════════════════
            Hero 横幅：在线人数
        ═══════════════════════════════════════════════════════════ */}
        <div className={styles.heroCard}>
          {/* 左侧：徽章 + 大数字 + 峰值 */}
          <div className={styles.heroLeft}>
            <div className={styles.heroLiveBadge}>
              <span className={styles.heroLiveDot} aria-hidden="true" />
              LIVE
            </div>
            <div className={styles.heroCountWrap}>
              <span className={styles.heroCount}>
                <AnimatedNumber value={ONLINE_COUNT.toLocaleString('zh-CN')} triggerKey="online-count" />
              </span>
              <span className={styles.heroCountUnit}>人在线</span>
            </div>
            <div className={styles.heroMeta}>
              <span className={styles.heroMetaItem}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
                  <polyline points="16 7 22 7 22 13" />
                </svg>
                较昨日 +12%
              </span>
              <span className={styles.heroMetaDivider} aria-hidden="true" />
              <span className={styles.heroMetaItem}>今日峰值 {ONLINE_PEAK.toLocaleString('zh-CN')} 人</span>
            </div>
          </div>

          {/* 右侧：Sparkline */}
          <div className={styles.heroSparkline}>
            <Echarts option={sparklineOption} style={{ width: '100%', height: '100%' }} />
          </div>

          {/* 装饰圆 */}
          <div className={styles.heroDecorCircle} aria-hidden="true" />
        </div>

        {/* ═══════════════════════════════════════════════════════════
            Bento 格：合伙人快览（3 小格）
        ═══════════════════════════════════════════════════════════ */}
        <div className={styles.bentoRow}>

          {/* 格 A：合伙人总数 */}
          <div className={`${styles.bentoCard} ${styles.bentoCardPurple}`}>
            {/* 徽章行：仅左侧合伙人标签 */}
            <div className={styles.bentoBadge} style={{ background: 'rgba(168,85,247,0.12)', color: '#a855f7' }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
              合伙人
            </div>
            <div className={styles.bentoBigNum} style={{ color: '#a855f7' }}>
              <AnimatedNumber value={PARTNER_STATS.total} triggerKey="partner-total" />
            </div>
            <div className={styles.bentoLabel}>总人数</div>
            <div className={styles.bentoTag} style={{ background: 'rgba(168,85,247,0.1)', color: '#a855f7' }}>
              本月 +{PARTNER_STATS.newThisMonth}
            </div>
          </div>

          {/* 格 B：活跃率 */}
          <div className={`${styles.bentoCard} ${styles.bentoCardEmerald}`}>
            <div className={styles.bentoBadge} style={{ background: 'rgba(16,185,129,0.12)', color: '#10b981' }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
              活跃率
            </div>
            <div className={styles.bentoBigNum} style={{ color: '#10b981' }}>
              <AnimatedNumber value={PARTNER_STATS.activeRate} triggerKey="partner-active" />
              <span className={styles.bentoUnit}>%</span>
            </div>
            <div className={styles.bentoLabel}>本月活跃</div>
            {/* 迷你进度环形条 */}
            <div className={styles.bentoRingWrap} aria-hidden="true">
              <svg viewBox="0 0 36 36" className={styles.bentoRingSvg}>
                <circle cx="18" cy="18" r="15.9" fill="none" stroke="rgba(16,185,129,0.12)" strokeWidth="3" />
                <circle
                  cx="18" cy="18" r="15.9" fill="none"
                  stroke="#10b981" strokeWidth="3"
                  strokeLinecap="round"
                  strokeDasharray={`${PARTNER_STATS.activeRate} ${100 - PARTNER_STATS.activeRate}`}
                  strokeDashoffset="25"
                />
              </svg>
            </div>
          </div>

          {/* 格 C：推广总收益 */}
          <div className={`${styles.bentoCard} ${styles.bentoCardBlue}`}>
            <div className={styles.bentoBadge} style={{ background: 'rgba(59,130,246,0.12)', color: '#3b82f6' }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="12" y1="1" x2="12" y2="23" />
                <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
              </svg>
              收益
            </div>
            <div className={styles.bentoBigNum} style={{ color: '#3b82f6', fontSize: '2.6rem' }}>
              ¥<AnimatedNumber value={fmtAmount(PARTNER_STATS.totalRevenue)} triggerKey="partner-revenue" />
            </div>
            <div className={styles.bentoLabel}>推广总收益</div>
            <div className={styles.bentoTag} style={{ background: 'rgba(59,130,246,0.1)', color: '#3b82f6' }}>
              {PARTNER_STATS.totalOrders.toLocaleString('zh-CN')} 单
            </div>
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════
            管理快捷入口：打款 / 申请审核 / 纯利豆 / 积分
        ═══════════════════════════════════════════════════════════ */}
        <div className={styles.quickNavCard}>
          {/* 卡片标题行 */}
          <div className={styles.quickNavHeader}>
            <div className={styles.quickNavHeaderLeft}>
              <div className={styles.quickNavHeaderIcon} aria-hidden="true">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <rect x="3" y="3" width="7" height="7" rx="1.5" />
                  <rect x="14" y="3" width="7" height="7" rx="1.5" />
                  <rect x="3" y="14" width="7" height="7" rx="1.5" />
                  <rect x="14" y="14" width="7" height="7" rx="1.5" />
                </svg>
              </div>
              <span className={styles.quickNavHeaderTitle}>管理入口</span>
            </div>
            <span className={styles.quickNavHeaderSub}>快速跳转</span>
          </div>

          {/* 2×2 入口网格 */}
          <div className={styles.quickNavGrid}>

            {/* 打款管理 */}
            <button
              type="button"
              className={`${styles.quickNavItem} ${styles.quickNavItemGreen}`}
              onClick={() => navigate(ROUTE_PATHS.partnerPayout)}
              aria-label="合伙人打款管理"
            >
              <div className={`${styles.quickNavIconWrap} ${styles.quickNavIconGreen}`} aria-hidden="true">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="2" y="5" width="20" height="14" rx="2.5" />
                  <line x1="2" y1="10" x2="22" y2="10" />
                  <line x1="6" y1="15" x2="10" y2="15" />
                </svg>
              </div>
              <div className={styles.quickNavItemContent}>
                <span className={styles.quickNavItemTitle}>打款管理</span>
                <span className={styles.quickNavItemDesc}>合伙人收益发放</span>
              </div>
              <div className={styles.quickNavArrow} aria-hidden="true">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M9 18l6-6-6-6" />
                </svg>
              </div>
            </button>

            {/* 申请审核 */}
            <button
              type="button"
              className={`${styles.quickNavItem} ${styles.quickNavItemPurple}`}
              onClick={() => navigate(ROUTE_PATHS.partnerReview)}
              aria-label="合伙人申请审核"
            >
              <div className={`${styles.quickNavIconWrap} ${styles.quickNavIconPurple}`} aria-hidden="true">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 11l3 3L22 4" />
                  <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
                </svg>
              </div>
              <div className={styles.quickNavItemContent}>
                <span className={styles.quickNavItemTitle}>申请审核</span>
                <span className={styles.quickNavItemDesc}>合伙人申请处理</span>
              </div>
              {PENDING_APPLICATION_COUNT > 0 && (
                <span className={styles.quickNavBadge} aria-label={`${PENDING_APPLICATION_COUNT}条待处理`}>
                  {PENDING_APPLICATION_COUNT}
                </span>
              )}
              <div className={styles.quickNavArrow} aria-hidden="true">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M9 18l6-6-6-6" />
                </svg>
              </div>
            </button>

            {/* 纯利豆 */}
            <button
              type="button"
              className={`${styles.quickNavItem} ${styles.quickNavItemAmber}`}
              onClick={() => navigate(ROUTE_PATHS.partnerBeans)}
              aria-label="纯利豆管理"
            >
              <div className={`${styles.quickNavIconWrap} ${styles.quickNavIconAmber}`} aria-hidden="true">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="9" />
                  <path d="M8.5 8.5c.8-1 2-1.5 3.5-1.5 2.5 0 4 1.5 4 3.5 0 1.5-.8 2.5-2 3" />
                  <path d="M15.5 15.5c-.8 1-2 1.5-3.5 1.5-2.5 0-4-1.5-4-3.5 0-1.5.8-2.5 2-3" />
                  <line x1="12" y1="6" x2="12" y2="7.5" />
                  <line x1="12" y1="16.5" x2="12" y2="18" />
                </svg>
              </div>
              <div className={styles.quickNavItemContent}>
                <span className={styles.quickNavItemTitle}>纯利豆</span>
                <span className={styles.quickNavItemDesc}>合伙人豆管理</span>
              </div>
              <div className={styles.quickNavArrow} aria-hidden="true">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M9 18l6-6-6-6" />
                </svg>
              </div>
            </button>

            {/* 积分 */}
            <button
              type="button"
              className={`${styles.quickNavItem} ${styles.quickNavItemBlue}`}
              onClick={() => navigate(ROUTE_PATHS.memberPoints)}
              aria-label="会员积分管理"
            >
              <div className={`${styles.quickNavIconWrap} ${styles.quickNavIconBlue}`} aria-hidden="true">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                </svg>
              </div>
              <div className={styles.quickNavItemContent}>
                <span className={styles.quickNavItemTitle}>积分管理</span>
                <span className={styles.quickNavItemDesc}>会员积分增减</span>
              </div>
              <div className={styles.quickNavArrow} aria-hidden="true">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M9 18l6-6-6-6" />
                </svg>
              </div>
            </button>

            {/* 封禁管理 */}
            <button
              type="button"
              className={`${styles.quickNavItem} ${styles.quickNavItemRed}`}
              onClick={() => navigate(ROUTE_PATHS.banManagement)}
              aria-label="用户封禁管理"
            >
              <div className={`${styles.quickNavIconWrap} ${styles.quickNavIconRed}`} aria-hidden="true">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M4.93 4.93l14.14 14.14" />
                </svg>
              </div>
              <div className={styles.quickNavItemContent}>
                <span className={styles.quickNavItemTitle}>封禁管理</span>
                <span className={styles.quickNavItemDesc}>用户封禁与解封</span>
              </div>
              <div className={styles.quickNavArrow} aria-hidden="true">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M9 18l6-6-6-6" />
                </svg>
              </div>
            </button>

            {/* 会员列表 */}
            <button
              type="button"
              className={`${styles.quickNavItem} ${styles.quickNavItemTeal}`}
              onClick={() => navigate(ROUTE_PATHS.memberList)}
              aria-label="会员列表"
            >
              <div className={`${styles.quickNavIconWrap} ${styles.quickNavIconTeal}`} aria-hidden="true">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
              </div>
              <div className={styles.quickNavItemContent}>
                <span className={styles.quickNavItemTitle}>会员列表</span>
                <span className={styles.quickNavItemDesc}>查看与管理全部会员</span>
              </div>
              <div className={styles.quickNavArrow} aria-hidden="true">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M9 18l6-6-6-6" />
                </svg>
              </div>
            </button>

          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════
            充值收入 — 筛选区（卡片外）
        ═══════════════════════════════════════════════════════════ */}
        <div className={styles.revenueFilterBlock}>
          {/* 地区选择 */}
          <CascaderView
            options={REGION_DATA}
            value={rankRegion}
            onChange={setRankRegion}
            placeholder="选择省 / 市 / 区"
            allowClear
            inputStyle={{ height: '4rem', fontSize: '1.3rem' }}
          />

          <SlidingTabBar
            options={REVENUE_TABS}
            value={revenuePeriod}
            onChange={(v) => setRevenuePeriod(v as RevenuePeriod)}
            variant="pill"
          />

          {/* 选择年月日 + 日期范围 */}
          <CustomModeBtnRow
            isCustomDate={isCustomDate}
            isCustomRange={isCustomRange}
            extraBtnText={customDateBtnText}
            onToggleCustomDate={handleToggleCustomDate}
            onToggleCustomRange={handleToggleCustomRange}
          />

          {/* 单日 DayPicker */}
          {isCustomDate && (
            <div className={styles.revenueDayPickerWrap}>
              <DayPicker
                year={customYear}
                month={customMonth}
                day={customDay}
                onChange={(y, m, d) => { setCustomYear(y); setCustomMonth(m); setCustomDay(d); }}
                onClear={handleCustomDayClear}
              />
            </div>
          )}

          {/* 日期范围 */}
          {isCustomRange && (
            <DateRangePicker
              startYear={rangeStartYear}
              startMonth={rangeStartMonth}
              startDay={rangeStartDay}
              endYear={rangeEndYear}
              endMonth={rangeEndMonth}
              endDay={rangeEndDay}
              onStartChange={(y, m, d) => { setRangeStartYear(y); setRangeStartMonth(m); setRangeStartDay(d); }}
              onEndChange={(y, m, d) => { setRangeEndYear(y); setRangeEndMonth(m); setRangeEndDay(d); }}
              onClear={() => setIsCustomRange(false)}
            />
          )}
        </div>

        {/* ═══════════════════════════════════════════════════════════
            充值收入 — 折线图卡片
        ═══════════════════════════════════════════════════════════ */}
        <div className={styles.revenueCard}>
          {/* 头部：标题 */}
          <div className={styles.revenueTitleWrap}>
            <div className={styles.revenueTitleIcon} aria-hidden="true">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
                <polyline points="16 7 22 7 22 13" />
              </svg>
            </div>
            <div style={{ flex: 1 }}>
              <div className={styles.revenueTitle}>充值收入趋势</div>
              <div className={styles.revenueSub}>按时间周期查看收入变化</div>
            </div>
            <button
              className={styles.revenueDetailBtn}
              type="button"
              aria-label="查看充值收入趋势详情"
              onClick={() => navigate('/revenue-detail')}
            >
              详情
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                <path d="M9 18l6-6-6-6" />
              </svg>
            </button>
          </div>

          {/* 汇总指标 3 格 */}
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
              <span className={`${styles.revenueSummaryVal} ${styles.revenueSummaryGreen}`}>
                +<AnimatedNumber value={`${revenueSummary.growth}%`} triggerKey={`rev-growth-${revenuePeriod}`} />
              </span>
              <span className={styles.revenueSummaryLbl}>同比增长</span>
            </div>
          </div>

          {/* 折线图 */}
          <div className={styles.revenueChartWrap}>
            <Echarts option={revenueChartOption} style={{ width: '100%', height: '100%' }} />
          </div>

          {/* 充值类型分布 */}
          <div className={styles.revenueTypeGrid}>
            {[
              { label: '月卡会员', value: 48, color: '#84cc16' },
              { label: '季度会员', value: 28, color: '#10b981' },
              { label: '年卡会员', value: 16, color: '#3b82f6' },
              { label: '其他充值', value: 8, color: '#94a3b8' },
            ].map((item) => (
              <div key={item.label} className={styles.revenueTypeItem}>
                <div className={styles.revenueTypeTop}>
                  <span className={styles.revenueTypeDot} style={{ backgroundColor: item.color }} aria-hidden="true" />
                  <span className={styles.revenueTypeLabel}>{item.label}</span>
                  <span className={styles.revenueTypePct} style={{ color: item.color }}>{item.value}%</span>
                </div>
                <div className={styles.revenueTypeTrack} aria-hidden="true">
                  <div
                    className={styles.revenueTypeFill}
                    style={{ width: `${item.value}%`, backgroundColor: item.color }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════
            合伙人排行 TOP 5
        ═══════════════════════════════════════════════════════════ */}
        <div className={styles.rankCard}>
          <div className={styles.rankCardHeader}>
            <div className={styles.rankCardTitle}>
              <div className={styles.rankTitleIcon} aria-hidden="true">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                </svg>
              </div>
              推广排行 TOP 5
            </div>
            <div className={styles.rankCardHeaderRight}>
              <span className={styles.rankCardSub}>{regionDisplayText}</span>
              <button
                className={styles.rankDetailBtn}
                onClick={() => navigate(ROUTE_PATHS.promotionRankDetail)}
                aria-label="查看推广详情"
              >
                查看详情
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                  <path d="M9 18l6-6-6-6" />
                </svg>
              </button>
            </div>
          </div>

          <div className={styles.rankList}>
            {PARTNER_TOP.map((p, idx) => (
              <div key={p.name} className={styles.rankItem}>
                <div className={`${styles.rankIdx} ${idx < 3 ? styles.rankIdxTop : ''}`}>
                  {idx < 3 ? (
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17 5.8 21.3l2.4-7.4L2 9.4h7.6L12 2z" />
                    </svg>
                  ) : (
                    idx + 1
                  )}
                </div>
                <div className={styles.rankAvatar} aria-hidden="true">
                  {p.name[0]}
                </div>
                <div className={styles.rankInfo}>
                  <span className={styles.rankName}>{p.name}</span>
                  <span className={styles.rankCity}>{p.city}</span>
                </div>
                <div className={styles.rankBarWrap} aria-hidden="true">
                  <div
                    className={styles.rankBarFill}
                    style={{ width: `${(p.orders / PARTNER_TOP[0].orders) * 100}%` }}
                  />
                </div>
                <div className={styles.rankRight}>
                  <span className={styles.rankRevenue}>¥{fmtAmount(p.revenue)}</span>
                  <span className={styles.rankOrders}>{p.orders} 单</span>
                </div>
              </div>
            ))}
          </div>
        </div>


      </main>
    </div>
  );
};

export default Home;
