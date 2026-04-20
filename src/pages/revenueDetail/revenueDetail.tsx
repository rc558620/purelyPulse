import React, { useCallback, useMemo, useState } from 'react';
import PageHeader from '@components/ui/layout/PageHeader';
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
import styles from './revenueDetail.module.less';

// ─── 类型 ──────────────────────────────────────────────────────
type RevenuePeriod = 'today' | 'week' | 'month' | 'season';

const REVENUE_TABS = [
    { value: 'today'  as const, label: '今日' },
    { value: 'week'   as const, label: '本周' },
    { value: 'month'  as const, label: '本月' },
    { value: 'season' as const, label: '本季' },
];

// ─── Mock 数据 ──────────────────────────────────────────────────
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

const REVENUE_SUMMARY: Record<RevenuePeriod, { total: number; avg: number; growth: number; orders: number; peak: number }> = {
    today:  { total: 6730,   avg: 841,  growth: 18.2, orders: 128,  peak: 1380  },
    week:   { total: 32800,  avg: 4686, growth: 12.4, orders: 612,  peak: 6100  },
    month:  { total: 142600, avg: 4753, growth: 8.7,  orders: 2847, peak: 6400  },
    season: { total: 384600, avg: 4273, growth: 15.2, orders: 7630, peak: 40700 },
};

const REVENUE_TYPES = [
    { label: '月卡会员', value: 48, color: '#84cc16', icon: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z' },
    { label: '季度会员', value: 28, color: '#10b981', icon: 'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z' },
    { label: '年卡会员', value: 16, color: '#6366f1', icon: 'M5 3l14 9-14 9V3z' },
    { label: '其他充值', value: 8,  color: '#f59e0b', icon: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z' },
];

const DETAIL_RECORDS = [
    { id: 'R001', user: '用户1839**', type: '月卡会员',  amount: 39,  region: '广东 · 深圳 · 南山', time: '14:32', avatar: 'U' },
    { id: 'R002', user: '用户2047**', type: '年卡会员',  amount: 298, region: '北京 · 海淀',          time: '13:58', avatar: 'U' },
    { id: 'R003', user: '用户5521**', type: '季度会员',  amount: 99,  region: '上海 · 浦东',          time: '13:21', avatar: 'U' },
    { id: 'R004', user: '用户3301**', type: '月卡会员',  amount: 39,  region: '广东 · 广州 · 天河',   time: '12:47', avatar: 'U' },
    { id: 'R005', user: '用户7782**', type: '其他充值',  amount: 100, region: '四川 · 成都 · 武侯',   time: '12:05', avatar: 'U' },
    { id: 'R006', user: '用户4455**', type: '季度会员',  amount: 99,  region: '浙江 · 杭州 · 西湖',   time: '11:30', avatar: 'U' },
    { id: 'R007', user: '用户6610**', type: '月卡会员',  amount: 39,  region: '广东 · 深圳 · 福田',   time: '10:52', avatar: 'U' },
    { id: 'R008', user: '用户1023**', type: '年卡会员',  amount: 298, region: '北京 · 朝阳',          time: '10:14', avatar: 'U' },
];

const TYPE_META: Record<string, { color: string; bg: string }> = {
    '月卡会员': { color: '#84cc16', bg: 'rgba(132,204,22,0.10)' },
    '季度会员': { color: '#10b981', bg: 'rgba(16,185,129,0.10)' },
    '年卡会员': { color: '#6366f1', bg: 'rgba(99,102,241,0.10)' },
    '其他充值': { color: '#f59e0b', bg: 'rgba(245,158,11,0.10)' },
};

// ─── 组件 ──────────────────────────────────────────────────────
const RevenueDetail: React.FC = () => {
    const navigate = useAnimatedNavigate();
    const [revenuePeriod, setRevenuePeriod] = useState<RevenuePeriod>('month');

    // 筛选面板展开/折叠
    const [filterOpen, setFilterOpen] = useState(false);

    // 自定义日期
    const [isCustomDate,  setIsCustomDate]  = useState(false);
    const [isCustomRange, setIsCustomRange] = useState(false);

    const now = new Date();
    const [customYear,  setCustomYear]  = useState(now.getFullYear());
    const [customMonth, setCustomMonth] = useState(now.getMonth() + 1);
    const [customDay,   setCustomDay]   = useState(now.getDate());

    const [rangeStartYear,  setRangeStartYear]  = useState(now.getFullYear());
    const [rangeStartMonth, setRangeStartMonth] = useState(now.getMonth() + 1);
    const [rangeStartDay,   setRangeStartDay]   = useState(1);
    const [rangeEndYear,    setRangeEndYear]    = useState(now.getFullYear());
    const [rangeEndMonth,   setRangeEndMonth]   = useState(now.getMonth() + 1);
    const [rangeEndDay,     setRangeEndDay]     = useState(now.getDate());

    const [region, setRegion] = useState<CascadeValue[]>([]);

    const regionDisplayText = useMemo(() => {
        if (region.length === 0) return '';
        const labels: string[] = [];
        let nodes = REGION_DATA;
        for (const val of region) {
            const node = nodes.find(n => n.value === val);
            if (!node) break;
            labels.push(node.label);
            nodes = node.children ?? [];
        }
        return labels.join(' · ');
    }, [region]);

    const handleToggleCustomDate = useCallback(() => {
        setIsCustomDate(prev => !prev);
        setIsCustomRange(false);
    }, []);

    const handleToggleCustomRange = useCallback(() => {
        setIsCustomRange(prev => !prev);
        setIsCustomDate(false);
    }, []);

    const customDateBtnText = isCustomDate
        ? `${customYear}/${String(customMonth).padStart(2, '0')}/${String(customDay).padStart(2, '0')}`
        : '选择年月日';

    // 当前查询 tag 列表
    const activeTags = useMemo(() => {
        const tags: string[] = [];
        if (isCustomDate) {
            tags.push(`${customYear}/${String(customMonth).padStart(2, '0')}/${String(customDay).padStart(2, '0')}`);
        } else if (isCustomRange) {
            tags.push(
                `${rangeStartYear}/${String(rangeStartMonth).padStart(2, '0')}/${String(rangeStartDay).padStart(2, '0')}` +
                ` → ${rangeEndYear}/${String(rangeEndMonth).padStart(2, '0')}/${String(rangeEndDay).padStart(2, '0')}`,
            );
        } else {
            tags.push(REVENUE_TABS.find(t => t.value === revenuePeriod)?.label ?? '');
        }
        if (regionDisplayText) tags.push(regionDisplayText);
        return tags;
    }, [isCustomDate, isCustomRange, revenuePeriod, customYear, customMonth, customDay,
        rangeStartYear, rangeStartMonth, rangeStartDay, rangeEndYear, rangeEndMonth, rangeEndDay,
        regionDisplayText]);

    // 折线图
    const revenueData = REVENUE_DATA[revenuePeriod];
    const revenueChartOption = useMemo<echarts.EChartsOption>(() => ({
        grid: { top: 20, bottom: 36, left: 56, right: 20 },
        tooltip: {
            trigger: 'axis',
            backgroundColor: 'rgba(15,23,42,0.92)',
            borderColor: 'rgba(249,115,22,0.3)',
            borderWidth: 1,
            textStyle: { color: '#f8fafc', fontSize: 12 },
            formatter: (params: unknown) => {
                const p = (params as { axisValue: string; value: number }[])[0];
                return `<span style="color:#94a3b8;font-size:11px">${p.axisValue}</span><br/><span style="color:#f97316;font-weight:700;font-size:14px">¥${fmtAmount(p.value)}</span>`;
            },
        },
        xAxis: {
            type: 'category',
            data: revenueData.dates,
            axisLine: { lineStyle: { color: 'rgba(226,232,240,0.5)' } },
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
            splitLine: { lineStyle: { color: 'rgba(226,232,240,0.4)', type: 'dashed' } },
            axisLabel: {
                color: '#94a3b8',
                fontSize: 10,
                formatter: (v: number) => v >= 10000 ? `${(v / 10000).toFixed(1)}w` : String(v),
            },
        },
        series: [{
            type: 'line',
            data: revenueData.values,
            smooth: 0.4,
            symbol: 'circle',
            symbolSize: 6,
            showSymbol: false,
            lineStyle: { color: '#f97316', width: 3, shadowColor: 'rgba(249,115,22,0.35)', shadowBlur: 8 },
            itemStyle: {
                color: '#f97316',
                borderColor: '#fff',
                borderWidth: 2,
                shadowColor: 'rgba(249,115,22,0.5)',
                shadowBlur: 6,
            },
            emphasis: { scale: true, focus: 'self' },
            areaStyle: {
                color: {
                    type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
                    colorStops: [
                        { offset: 0, color: 'rgba(249,115,22,0.22)' },
                        { offset: 0.6, color: 'rgba(249,115,22,0.06)' },
                        { offset: 1, color: 'rgba(249,115,22,0)' },
                    ],
                },
            },
        }],
    }), [revenueData, revenuePeriod]);

    // 环形饼图
    const pieOption = useMemo<echarts.EChartsOption>(() => ({
        tooltip: {
            trigger: 'item',
            formatter: '{b}: {c}%',
            backgroundColor: 'rgba(15,23,42,0.92)',
            borderColor: 'rgba(249,115,22,0.3)',
            borderWidth: 1,
            textStyle: { color: '#f8fafc', fontSize: 12 },
        },
        legend: { show: false },
        series: [{
            type: 'pie',
            radius: ['50%', '78%'],
            center: ['50%', '50%'],
            data: REVENUE_TYPES.map(t => ({
                name: t.label,
                value: t.value,
                itemStyle: {
                    color: t.color,
                    shadowColor: `${t.color}40`,
                    shadowBlur: 10,
                },
            })),
            label: { show: false },
            labelLine: { show: false },
            emphasis: {
                itemStyle: { shadowBlur: 20, shadowOffsetX: 0, shadowColor: 'rgba(0,0,0,0.2)' },
                scale: true,
                scaleSize: 6,
            },
        }],
    }), []);

    const summary = REVENUE_SUMMARY[revenuePeriod];
    const hasFilter = isCustomDate || isCustomRange || region.length > 0;

    return (
        <div className={styles.pageContainer}>
            {/* ── 多层背景装饰 ── */}
            <div className={styles.bgMesh}    aria-hidden="true" />
            <div className={styles.bgGlow1}   aria-hidden="true" />
            <div className={styles.bgGlow2}   aria-hidden="true" />
            <div className={styles.bgGlow3}   aria-hidden="true" />

            <PageHeader title="充值收入趋势" />

            <main className={styles.contentWrapper}>

                {/* ══════════════════════════════════════════════════════
                    §1  Hero 收入总览区
                ══════════════════════════════════════════════════════ */}
                <section className={styles.heroSection}>
                    {/* 左：主指标 */}
                    <div className={styles.heroMain}>
                        <div className={styles.heroEyebrow}>
                            <span className={styles.heroLiveDot} aria-hidden="true" />
                            {activeTags[0]}
                            {activeTags[1] && (
                                <span className={styles.heroRegionTag}>{activeTags[1]}</span>
                            )}
                        </div>
                        <div className={styles.heroAmount}>
                            <span className={styles.heroCurrency}>¥</span>
                            <AnimatedNumber value={fmtAmount(summary.total)} triggerKey={`hero-${revenuePeriod}`} />
                        </div>
                        <div className={styles.heroMeta}>
                            <div className={styles.heroMetaItem}>
                                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                                    <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
                                    <polyline points="16 7 22 7 22 13" />
                                </svg>
                                <span>同比增长</span>
                                <strong className={styles.heroGrowthVal}>+{summary.growth}%</strong>
                            </div>
                            <span className={styles.heroMetaSep} aria-hidden="true" />
                            <div className={styles.heroMetaItem}>
                                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                    <polyline points="14 2 14 8 20 8" />
                                </svg>
                                <span>{summary.orders.toLocaleString('zh-CN')} 笔</span>
                            </div>
                        </div>
                    </div>

                    {/* 右：次级指标 2 格 */}
                    <div className={styles.heroSecondary}>
                        <div className={styles.heroSecItem}>
                            <span className={styles.heroSecLabel}>日均收入</span>
                            <span className={styles.heroSecVal}>
                                ¥<AnimatedNumber value={fmtAmount(summary.avg)} triggerKey={`avg-${revenuePeriod}`} />
                            </span>
                        </div>
                        <div className={styles.heroSecDivider} aria-hidden="true" />
                        <div className={styles.heroSecItem}>
                            <span className={styles.heroSecLabel}>单日峰值</span>
                            <span className={styles.heroSecVal}>
                                ¥<AnimatedNumber value={fmtAmount(summary.peak)} triggerKey={`peak-${revenuePeriod}`} />
                            </span>
                        </div>
                    </div>
                </section>

                {/* ══════════════════════════════════════════════════════
                    §2  筛选面板（可折叠）
                ══════════════════════════════════════════════════════ */}
                <section className={styles.filterSection}>
                    {/* 标题栏 + 切换 */}
                    <button
                        className={styles.filterToggle}
                        type="button"
                        onClick={() => setFilterOpen(p => !p)}
                        aria-expanded={filterOpen}
                        aria-controls="filter-panel"
                    >
                        <div className={styles.filterToggleLeft}>
                            <div className={styles.filterToggleIcon} aria-hidden="true">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                    <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
                                </svg>
                            </div>
                            <span className={styles.filterToggleTitle}>筛选条件</span>
                            {hasFilter && (
                                <span className={styles.filterActiveDot} aria-label="已设置筛选条件" />
                            )}
                        </div>
                        <div className={styles.filterToggleRight}>
                            {/* 快捷 tab 摘要（收起状态下显示） */}
                            {!filterOpen && (
                                <div className={styles.filterSummaryTabs}>
                                    <SlidingTabBar
                                        options={REVENUE_TABS}
                                        value={revenuePeriod}
                                        onChange={(v) => {
                                            setRevenuePeriod(v as RevenuePeriod);
                                            setIsCustomDate(false);
                                            setIsCustomRange(false);
                                        }}
                                        variant="pill"
                                    />
                                </div>
                            )}
                            <svg
                                width="16" height="16" viewBox="0 0 24 24"
                                fill="none" stroke="currentColor" strokeWidth="2.5"
                                className={`${styles.filterChevron} ${filterOpen ? styles.filterChevronOpen : ''}`}
                                aria-hidden="true"
                            >
                                <polyline points="6 9 12 15 18 9" />
                            </svg>
                        </div>
                    </button>

                    {/* 展开的筛选面板 */}
                    <div
                        id="filter-panel"
                        className={`${styles.filterPanel} ${filterOpen ? styles.filterPanelOpen : ''}`}
                        aria-hidden={!filterOpen}
                    >
                        <div className={styles.filterPanelInner}>
                            {/* 时间周期 */}
                            <div className={styles.filterGroup}>
                                <span className={styles.filterGroupLabel}>时间周期</span>
                                <SlidingTabBar
                                    options={REVENUE_TABS}
                                    value={revenuePeriod}
                                    onChange={(v) => {
                                        setRevenuePeriod(v as RevenuePeriod);
                                        setIsCustomDate(false);
                                        setIsCustomRange(false);
                                    }}
                                    variant="pill"
                                />
                            </div>

                            {/* 精确日期 */}
                            <div className={styles.filterGroup}>
                                <span className={styles.filterGroupLabel}>精确日期</span>
                                <CustomModeBtnRow
                                    isCustomDate={isCustomDate}
                                    isCustomRange={isCustomRange}
                                    extraBtnText={customDateBtnText}
                                    onToggleCustomDate={handleToggleCustomDate}
                                    onToggleCustomRange={handleToggleCustomRange}
                                />
                                {isCustomDate && (
                                    <DayPicker
                                        year={customYear}
                                        month={customMonth}
                                        day={customDay}
                                        onChange={(y, m, d) => { setCustomYear(y); setCustomMonth(m); setCustomDay(d); }}
                                        onClear={() => setIsCustomDate(false)}
                                    />
                                )}
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

                            {/* 所在地区 */}
                            <div className={styles.filterGroup}>
                                <span className={styles.filterGroupLabel}>所在地区</span>
                                <CascaderView
                                    options={REGION_DATA}
                                    value={region}
                                    onChange={setRegion}
                                    placeholder="选择省 / 市 / 区"
                                    allowClear
                                    inputStyle={{ height: '4rem', fontSize: '1.3rem' }}
                                />
                            </div>
                        </div>
                    </div>
                </section>

                {/* ══════════════════════════════════════════════════════
                    §3  Bento 4 格指标
                ══════════════════════════════════════════════════════ */}
                <section className={styles.bentoGrid}>
                    {[
                        {
                            key: 'total', label: '总充值收入',
                            val: <><span className={styles.bentoValPrefix}>¥</span><AnimatedNumber value={fmtAmount(summary.total)} triggerKey={`b-total-${revenuePeriod}`} /></>,
                            color: '#f97316', bg: 'rgba(249,115,22,0.08)',
                            icon: <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />,
                            badge: `+${summary.growth}%`,
                        },
                        {
                            key: 'avg', label: '日均收入',
                            val: <><span className={styles.bentoValPrefix}>¥</span><AnimatedNumber value={fmtAmount(summary.avg)} triggerKey={`b-avg-${revenuePeriod}`} /></>,
                            color: '#84cc16', bg: 'rgba(132,204,22,0.08)',
                            icon: <><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></>,
                            badge: '平均',
                        },
                        {
                            key: 'orders', label: '充值笔数',
                            val: <AnimatedNumber value={summary.orders.toLocaleString('zh-CN')} triggerKey={`b-orders-${revenuePeriod}`} />,
                            color: '#6366f1', bg: 'rgba(99,102,241,0.08)',
                            icon: <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /></>,
                            badge: '笔',
                        },
                        {
                            key: 'peak', label: '单日峰值',
                            val: <><span className={styles.bentoValPrefix}>¥</span><AnimatedNumber value={fmtAmount(summary.peak)} triggerKey={`b-peak-${revenuePeriod}`} /></>,
                            color: '#10b981', bg: 'rgba(16,185,129,0.08)',
                            icon: <><polyline points="22 7 13.5 15.5 8.5 10.5 2 17" /><polyline points="16 7 22 7 22 13" /></>,
                            badge: '峰值',
                        },
                    ].map(item => (
                        <div key={item.key} className={styles.bentoCard} style={{ '--bento-color': item.color, '--bento-bg': item.bg } as React.CSSProperties}>
                            <div className={styles.bentoDeco} aria-hidden="true" />
                            <div className={styles.bentoIcon} aria-hidden="true">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    {item.icon}
                                </svg>
                            </div>
                            <div className={styles.bentoVal}>{item.val}</div>
                            <div className={styles.bentoBottom}>
                                <span className={styles.bentoLabel}>{item.label}</span>
                                <span className={styles.bentoBadge}>{item.badge}</span>
                            </div>
                        </div>
                    ))}
                </section>

                {/* ══════════════════════════════════════════════════════
                    §4  收入趋势图
                ══════════════════════════════════════════════════════ */}
                <section className={styles.chartSection}>
                    <div className={styles.cardHeader}>
                        <div className={styles.cardHeaderIcon} style={{ '--icon-color': '#f97316', '--icon-bg': 'rgba(249,115,22,0.1)' } as React.CSSProperties} aria-hidden="true">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
                                <polyline points="16 7 22 7 22 13" />
                            </svg>
                        </div>
                        <div>
                            <h2 className={styles.cardTitle}>收入趋势图</h2>
                            <p className={styles.cardSub}>{activeTags.join(' · ')}</p>
                        </div>
                    </div>
                    <div className={styles.chartWrap}>
                        <Echarts option={revenueChartOption} style={{ width: '100%', height: '100%' }} />
                    </div>
                </section>

                {/* ══════════════════════════════════════════════════════
                    §5  充值类型分布（饼图 + 卡片列表）
                ══════════════════════════════════════════════════════ */}
                <section className={styles.typeSection}>
                    <div className={styles.cardHeader}>
                        <div className={styles.cardHeaderIcon} style={{ '--icon-color': '#84cc16', '--icon-bg': 'rgba(132,204,22,0.1)' } as React.CSSProperties} aria-hidden="true">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M21.21 15.89A10 10 0 1 1 8 2.83" />
                                <path d="M22 12A10 10 0 0 0 12 2v10z" />
                            </svg>
                        </div>
                        <h2 className={styles.cardTitle}>充值类型分布</h2>
                    </div>

                    <div className={styles.typeLayout}>
                        {/* 环形饼图 */}
                        <div className={styles.typePieWrap}>
                            <Echarts option={pieOption} style={{ width: '100%', height: '100%' }} />
                            {/* 中心文字 */}
                            <div className={styles.typePieCenter} aria-hidden="true">
                                <span className={styles.typePieCenterVal}>{REVENUE_TYPES.length}</span>
                                <span className={styles.typePieCenterLbl}>类型</span>
                            </div>
                        </div>

                        {/* 类型卡片列表 */}
                        <div className={styles.typeCardList}>
                            {REVENUE_TYPES.map((item) => (
                                <div key={item.label} className={styles.typeItem} style={{ '--type-color': item.color } as React.CSSProperties}>
                                    <div className={styles.typeItemDot} aria-hidden="true" />
                                    <div className={styles.typeItemBody}>
                                        <div className={styles.typeItemTop}>
                                            <span className={styles.typeItemLabel}>{item.label}</span>
                                            <span className={styles.typeItemPct}>{item.value}%</span>
                                        </div>
                                        <div className={styles.typeItemTrack} aria-hidden="true">
                                            <div className={styles.typeItemFill} style={{ width: `${item.value}%` }} />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* ══════════════════════════════════════════════════════
                    §6  充值明细
                ══════════════════════════════════════════════════════ */}
                <section className={styles.detailSection}>
                    <div className={styles.cardHeader}>
                        <div className={styles.cardHeaderIcon} style={{ '--icon-color': '#6366f1', '--icon-bg': 'rgba(99,102,241,0.1)' } as React.CSSProperties} aria-hidden="true">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <line x1="8"  y1="6"  x2="21" y2="6"  />
                                <line x1="8"  y1="12" x2="21" y2="12" />
                                <line x1="8"  y1="18" x2="21" y2="18" />
                                <line x1="3"  y1="6"  x2="3.01" y2="6"  />
                                <line x1="3"  y1="12" x2="3.01" y2="12" />
                                <line x1="3"  y1="18" x2="3.01" y2="18" />
                            </svg>
                        </div>
                        <h2 className={styles.cardTitle}>充值明细</h2>
                        <span className={styles.detailCount}>{DETAIL_RECORDS.length}</span>
                    </div>

                    <div className={styles.detailList}>
                        {DETAIL_RECORDS.map((rec, idx) => {
                            const meta = TYPE_META[rec.type] ?? { color: '#94a3b8', bg: 'rgba(148,163,184,0.1)' };
                            return (
                                <div key={rec.id} className={styles.detailRow} style={{ '--delay': `${idx * 0.04}s` } as React.CSSProperties}>
                                    {/* 序号 */}
                                    <span className={styles.detailIdx}>{String(idx + 1).padStart(2, '0')}</span>

                                    {/* 类型标签 */}
                                    <span
                                        className={styles.detailTag}
                                        style={{ color: meta.color, backgroundColor: meta.bg }}
                                    >
                                        {rec.type}
                                    </span>

                                    {/* 用户信息 */}
                                    <div className={styles.detailInfo}>
                                        <span className={styles.detailUser}>{rec.user}</span>
                                        <span className={styles.detailRegion}>{rec.region}</span>
                                    </div>

                                    {/* 金额 + 时间 */}
                                    <div className={styles.detailRight}>
                                        <span className={styles.detailAmount}>+¥{rec.amount}</span>
                                        <span className={styles.detailTime}>{rec.time}</span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    <button
                        className={styles.loadMoreBtn}
                        type="button"
                        aria-label="加载更多充值记录"
                    >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                            <polyline points="6 9 12 15 18 9" />
                        </svg>
                        加载更多
                    </button>
                </section>

                <div className={styles.bottomSafeArea} aria-hidden="true" />
            </main>
        </div>
    );
};

export default RevenueDetail;
