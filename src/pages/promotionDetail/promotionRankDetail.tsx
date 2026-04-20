import React, { useCallback, useMemo, useState } from 'react';
import PageHeader from '@components/ui/layout/PageHeader';
import { Form, FormItem, useForm, type ValidatorRule } from '@components/form';
import { Input } from '@components/form/Input/Input';
import { CascaderView } from '@components/form/CascaderView';
import DayPicker from '@components/form/DayPicker';
import DateRangePicker from '@components/form/DateRangePicker/DateRangePicker';
import { REGION_DATA } from '@constants/regionData';
import type { CascadeValue } from '@components/form/CascaderView/types';
import { useAnimatedNavigate } from '@hooks/useAnimatedNavigate';
import { fmtAmount, cx } from '@utils/utils';
import { showToast } from '@components/ui/feedback/Toast';
import Echarts from '@components/business/Echarts/Echarts';
import * as echarts from 'echarts';
import styles from './promotionRankDetail.module.less';

// ─── 类型 ────────────────────────────────────────────────────────
type QueryMode = 'day' | 'range';
type ViewMode = 'region' | 'partners' | 'detail';
type PeriodTab = 'day' | 'month' | 'year';

interface QueryFormDTO {
  name: string;
}

// ─── Mock 数据 ───────────────────────────────────────────────────
interface RegionData {
  province: string;
  city?: string;
  partnerCount: number;
  totalOrders: number;
  totalRevenue: number;
  growth: number;
}

interface PartnerData {
  id: number;
  name: string;
  province: string;
  city: string;
  district?: string;
  orders: number;
  revenue: number;
  growth: number;
  avatar: string;
  rank: number;
  joinDate: string;
  phone: string;
}

interface PeriodRecord {
  label: string;
  orders: number;
  revenue: number;
}

const MOCK_REGION_DATA: RegionData[] = [
  { province: '广东',   partnerCount: 24, totalOrders: 1240, totalRevenue: 62000, growth: 18.2 },
  { province: '浙江',   partnerCount: 18, totalOrders:  920, totalRevenue: 46000, growth: 12.5 },
  { province: '江苏',   partnerCount: 16, totalOrders:  840, totalRevenue: 42000, growth:  9.8 },
  { province: '上海',   partnerCount: 12, totalOrders:  680, totalRevenue: 34000, growth: 21.4 },
  { province: '北京',   partnerCount: 10, totalOrders:  540, totalRevenue: 27000, growth: 15.7 },
  { province: '四川',   partnerCount:  9, totalOrders:  480, totalRevenue: 24000, growth:  8.1 },
  { province: '湖北',   partnerCount:  7, totalOrders:  360, totalRevenue: 18000, growth: 11.3 },
  { province: '陕西',   partnerCount:  6, totalOrders:  300, totalRevenue: 15000, growth:  6.4 },
  { province: '重庆',   partnerCount:  5, totalOrders:  250, totalRevenue: 12500, growth: 14.2 },
  { province: '福建',   partnerCount:  5, totalOrders:  240, totalRevenue: 12000, growth: 19.6 },
  { province: '湖南',   partnerCount:  4, totalOrders:  200, totalRevenue: 10000, growth:  5.3 },
  { province: '河南',   partnerCount:  3, totalOrders:  140, totalRevenue:  7000, growth:  7.8 },
];

const MOCK_PARTNERS: Record<string, PartnerData[]> = {
  '广东': [
    { id: 1, name: '孙八',   province: '广东', city: '深圳', district: '南山区', orders: 220, revenue: 11000, growth: 14.7, avatar: '孙', rank: 1, joinDate: '2024-03-15', phone: '138****8888' },
    { id: 2, name: '王五',   province: '广东', city: '广州', district: '天河区', orders: 175, revenue:  8750, growth:  8.1, avatar: '王', rank: 2, joinDate: '2024-05-20', phone: '139****7777' },
    { id: 3, name: '何燕',   province: '广东', city: '东莞', district: '南城区', orders: 148, revenue:  7400, growth: 22.5, avatar: '何', rank: 3, joinDate: '2024-07-01', phone: '137****6666' },
    { id: 4, name: '梁志远', province: '广东', city: '佛山', district: '禅城区', orders: 132, revenue:  6600, growth: 16.3, avatar: '梁', rank: 4, joinDate: '2024-08-10', phone: '135****5555' },
    { id: 5, name: '邓小云', province: '广东', city: '珠海', district: '香洲区', orders: 118, revenue:  5900, growth:  9.2, avatar: '邓', rank: 5, joinDate: '2024-09-18', phone: '136****4444' },
  ],
  '浙江': [
    { id: 6, name: '陈七',   province: '浙江', city: '杭州', district: '西湖区', orders: 138, revenue:  6900, growth:  5.3, avatar: '陈', rank: 1, joinDate: '2024-04-12', phone: '158****3333' },
    { id: 7, name: '胡彩玲', province: '浙江', city: '宁波', district: '鄞州区', orders: 115, revenue:  5750, growth: 13.8, avatar: '胡', rank: 2, joinDate: '2024-06-25', phone: '159****2222' },
    { id: 8, name: '童志明', province: '浙江', city: '温州', district: '鹿城区', orders:  98, revenue:  4900, growth: 18.4, avatar: '童', rank: 3, joinDate: '2024-10-05', phone: '156****1111' },
  ],
  '上海': [
    { id: 9, name: '张三',   province: '上海', city: '上海', district: '浦东新区', orders: 240, revenue: 12000, growth: 18.2, avatar: '张', rank: 1, joinDate: '2024-01-10', phone: '135****0000' },
    { id: 10, name: '林晓燕', province: '上海', city: '上海', district: '静安区',   orders:  95, revenue:  4750, growth: 11.6, avatar: '林', rank: 2, joinDate: '2024-06-15', phone: '133****9999' },
  ],
  '北京': [
    { id: 11, name: '李四',   province: '北京', city: '北京', district: '海淀区', orders: 198, revenue:  9900, growth: 12.5, avatar: '李', rank: 1, joinDate: '2024-02-20', phone: '180****8888' },
    { id: 12, name: '吴晓峰', province: '北京', city: '北京', district: '朝阳区', orders: 142, revenue:  7100, growth:  9.7, avatar: '吴', rank: 2, joinDate: '2024-04-08', phone: '181****7777' },
  ],
  // 其他省份给默认数据
  default: [
    { id: 99, name: '合伙人A', province: '', city: '本地', district: '城区', orders: 80, revenue: 4000, growth: 10.0, avatar: 'A', rank: 1, joinDate: '2024-05-01', phone: '130****0000' },
  ],
};

// Mock 某合伙人的时间序列数据
const getMockDayData = (id: number): PeriodRecord[] => {
  const base = (id * 7) % 40 + 5;
  return Array.from({ length: 14 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - 13 + i);
    const label = `${d.getMonth() + 1}/${d.getDate()}`;
    return {
      label,
      orders: Math.round(base + Math.sin(i * 0.8) * base * 0.6 + Math.random() * base * 0.3),
      revenue: Math.round((base + Math.sin(i * 0.8) * base * 0.6 + Math.random() * base * 0.3) * 50),
    };
  });
};

const getMockMonthData = (id: number): PeriodRecord[] => {
  const base = (id * 11) % 100 + 30;
  const months = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];
  return months.map((label, i) => ({
    label,
    orders: Math.round(base + Math.sin(i * 0.5) * base * 0.5 + Math.random() * 20),
    revenue: Math.round((base + Math.sin(i * 0.5) * base * 0.5 + Math.random() * 20) * 50),
  }));
};

const getMockYearData = (id: number): PeriodRecord[] => {
  const base = (id * 13) % 600 + 200;
  return [2022, 2023, 2024, 2025].map((y) => ({
    label: `${y}年`,
    orders: Math.round(base + Math.random() * base * 0.4),
    revenue: Math.round((base + Math.random() * base * 0.4) * 50),
  }));
};

// ─── 图表配置工厂 ──────────────────────────────────────────────
const buildChartOption = (records: PeriodRecord[]): echarts.EChartsOption => ({
  backgroundColor: 'transparent',
  grid: { left: '4%', right: '4%', top: '14%', bottom: '12%', containLabel: true },
  tooltip: {
    trigger: 'axis',
    backgroundColor: 'rgba(255,255,255,0.96)',
    borderColor: '#e2e8f0',
    borderWidth: 1,
    textStyle: { color: '#1e293b', fontSize: 12 },
    formatter: (params: echarts.TooltipComponentFormatterCallbackParams) => {
      if (!Array.isArray(params) || params.length === 0) return '';
      const [ordersParam, revenueParam] = params as Array<{ seriesName: string; value: number; name: string }>;
      return `<div style="font-weight:700;margin-bottom:4px;color:#64748b">${ordersParam?.name ?? ''}</div>
              <div style="display:flex;gap:16px">
                <span>推广单：<b style="color:#84cc16">${ordersParam?.value ?? 0} 单</b></span>
                <span>金额：<b style="color:#10b981">¥${fmtAmount(revenueParam?.value ?? 0)}</b></span>
              </div>`;
    },
  },
  legend: {
    top: 4,
    right: 8,
    icon: 'roundRect',
    itemWidth: 10,
    itemHeight: 6,
    textStyle: { fontSize: 11, color: '#64748b' },
    data: ['推广单数', '推广金额'],
  },
  xAxis: {
    type: 'category',
    data: records.map(r => r.label),
    axisLine: { lineStyle: { color: '#e2e8f0' } },
    axisTick: { show: false },
    axisLabel: { fontSize: 10, color: '#94a3b8', interval: 0, rotate: records.length > 10 ? 30 : 0 },
  },
  yAxis: [
    {
      type: 'value',
      name: '单数',
      nameTextStyle: { fontSize: 10, color: '#94a3b8' },
      axisLabel: { fontSize: 10, color: '#94a3b8' },
      splitLine: { lineStyle: { color: '#f1f5f9', type: 'dashed' } },
      axisLine: { show: false },
      axisTick: { show: false },
    },
    {
      type: 'value',
      name: '金额',
      nameTextStyle: { fontSize: 10, color: '#94a3b8' },
      axisLabel: { fontSize: 10, color: '#94a3b8', formatter: (v: number) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v) },
      splitLine: { show: false },
      axisLine: { show: false },
      axisTick: { show: false },
    },
  ],
  series: [
    {
      name: '推广单数',
      type: 'bar',
      yAxisIndex: 0,
      data: records.map(r => r.orders),
      barMaxWidth: 28,
      itemStyle: {
        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: '#84cc16' },
          { offset: 1, color: '#a3e635' },
        ]),
        borderRadius: [4, 4, 0, 0],
      },
    },
    {
      name: '推广金额',
      type: 'line',
      yAxisIndex: 1,
      data: records.map(r => r.revenue),
      smooth: true,
      symbol: 'circle',
      symbolSize: 5,
      lineStyle: { color: '#10b981', width: 2 },
      itemStyle: { color: '#10b981', borderWidth: 2, borderColor: '#fff' },
      areaStyle: {
        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: 'rgba(16,185,129,0.18)' },
          { offset: 1, color: 'rgba(16,185,129,0.02)' },
        ]),
      },
    },
  ],
});

// ─── 主组件 ──────────────────────────────────────────────────────
const PromotionRankDetail: React.FC = () => {
  const navigate = useAnimatedNavigate();
  const [form] = useForm<QueryFormDTO>();

  // 视图层级
  const [viewMode, setViewMode] = useState<ViewMode>('region');
  const [selectedRegion, setSelectedRegion] = useState<RegionData | null>(null);
  const [selectedPartner, setSelectedPartner] = useState<PartnerData | null>(null);

  // 合伙人详情时间维度
  const [periodTab, setPeriodTab] = useState<PeriodTab>('month');

  // 查询模式：选择年月日 / 日期范围
  const [queryMode, setQueryMode] = useState<QueryMode>('day');

  // 单日
  const now = new Date();
  const [dayYear,  setDayYear]  = useState(now.getFullYear());
  const [dayMonth, setDayMonth] = useState(now.getMonth() + 1);
  const [dayDay,   setDayDay]   = useState(now.getDate());

  // 日期范围
  const [rangeStartYear,  setRangeStartYear]  = useState(now.getFullYear());
  const [rangeStartMonth, setRangeStartMonth] = useState(now.getMonth() + 1);
  const [rangeStartDay,   setRangeStartDay]   = useState(1);
  const [rangeEndYear,    setRangeEndYear]    = useState(now.getFullYear());
  const [rangeEndMonth,   setRangeEndMonth]   = useState(now.getMonth() + 1);
  const [rangeEndDay,     setRangeEndDay]     = useState(now.getDate());

  // 省市区
  const [region, setRegion] = useState<CascadeValue[]>([]);

  // 查询状态
  const [hasSearched, setHasSearched] = useState(false);
  const [nameFilter, setNameFilter] = useState('');

  // 表单校验规则
  const formRules = useMemo<Record<keyof QueryFormDTO, ValidatorRule[]>>(() => ({
    name: [],
  }), []);

  // 校验日期范围是否合法
  const isDateRangeValid = useMemo(() => {
    if (queryMode !== 'range') return true;
    const start = new Date(rangeStartYear, rangeStartMonth - 1, rangeStartDay);
    const end   = new Date(rangeEndYear,   rangeEndMonth - 1,   rangeEndDay);
    return end >= start;
  }, [queryMode, rangeStartYear, rangeStartMonth, rangeStartDay, rangeEndYear, rangeEndMonth, rangeEndDay]);

  // 地区显示文本
  const regionDisplayText = useMemo(() => {
    if (region.length === 0) return '全部地区';
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

  // 日期描述文本
  const dateDisplayText = useMemo(() => {
    if (queryMode === 'day') {
      return `${dayYear}/${String(dayMonth).padStart(2, '0')}/${String(dayDay).padStart(2, '0')}`;
    }
    const start = `${rangeStartYear}/${String(rangeStartMonth).padStart(2, '0')}/${String(rangeStartDay).padStart(2, '0')}`;
    const end   = `${rangeEndYear}/${String(rangeEndMonth).padStart(2, '0')}/${String(rangeEndDay).padStart(2, '0')}`;
    return `${start} ~ ${end}`;
  }, [queryMode, dayYear, dayMonth, dayDay, rangeStartYear, rangeStartMonth, rangeStartDay, rangeEndYear, rangeEndMonth, rangeEndDay]);

  // 过滤后的地区数据（按省份姓名过滤）
  const filteredRegions = useMemo(() => {
    if (!nameFilter.trim()) return MOCK_REGION_DATA;
    return MOCK_REGION_DATA.filter(r => {
      const partners = MOCK_PARTNERS[r.province] ?? MOCK_PARTNERS.default;
      return partners.some(p => p.name.includes(nameFilter.trim()));
    });
  }, [nameFilter]);

  // 汇总
  const totalPartners = useMemo(() => filteredRegions.reduce((s, r) => s + r.partnerCount, 0), [filteredRegions]);
  const totalOrders   = useMemo(() => filteredRegions.reduce((s, r) => s + r.totalOrders, 0), [filteredRegions]);
  const totalRevenue  = useMemo(() => filteredRegions.reduce((s, r) => s + r.totalRevenue, 0), [filteredRegions]);

  // 当前地区的合伙人列表
  const currentPartners = useMemo(() => {
    if (!selectedRegion) return [];
    const list = MOCK_PARTNERS[selectedRegion.province] ?? [...MOCK_PARTNERS.default];
    if (!nameFilter.trim()) return list;
    return list.filter(p => p.name.includes(nameFilter.trim()));
  }, [selectedRegion, nameFilter]);

  // 合伙人详情图表数据
  const periodRecords = useMemo(() => {
    if (!selectedPartner) return [];
    if (periodTab === 'day') return getMockDayData(selectedPartner.id);
    if (periodTab === 'month') return getMockMonthData(selectedPartner.id);
    return getMockYearData(selectedPartner.id);
  }, [selectedPartner, periodTab]);

  const chartOption = useMemo(() => buildChartOption(periodRecords), [periodRecords]);

  // 详情汇总
  const detailTotal = useMemo(() => ({
    orders: periodRecords.reduce((s, r) => s + r.orders, 0),
    revenue: periodRecords.reduce((s, r) => s + r.revenue, 0),
  }), [periodRecords]);

  // 提交查询
  const handleFinish = useCallback((values: QueryFormDTO) => {
    if (!isDateRangeValid) {
      showToast({ message: '结束日期不能早于开始日期', type: 'warning' });
      return;
    }
    setNameFilter(values.name ?? '');
    setHasSearched(true);
    setViewMode('region');
    setSelectedRegion(null);
    setSelectedPartner(null);
    showToast({ message: '查询成功', type: 'success' });
  }, [isDateRangeValid]);

  const handleFinishFailed = useCallback(() => {
    showToast({ message: '请检查查询条件', type: 'warning' });
  }, []);

  // 重置
  const handleReset = useCallback(() => {
    form.reset();
    setRegion([]);
    setQueryMode('day');
    const n = new Date();
    setDayYear(n.getFullYear());
    setDayMonth(n.getMonth() + 1);
    setDayDay(n.getDate());
    setRangeStartYear(n.getFullYear());
    setRangeStartMonth(n.getMonth() + 1);
    setRangeStartDay(1);
    setRangeEndYear(n.getFullYear());
    setRangeEndMonth(n.getMonth() + 1);
    setRangeEndDay(n.getDate());
    setNameFilter('');
    setHasSearched(false);
    setViewMode('region');
    setSelectedRegion(null);
    setSelectedPartner(null);
  }, [form]);

  // 点击地区卡片 → 进入合伙人列表
  const handleRegionClick = useCallback((regionData: RegionData) => {
    setSelectedRegion(regionData);
    setViewMode('partners');
  }, []);

  // 点击合伙人 → 进入详情
  const handlePartnerClick = useCallback((partner: PartnerData) => {
    setSelectedPartner(partner);
    setPeriodTab('month');
    setViewMode('detail');
  }, []);

  // 面包屑导航返回
  const handleBreadcrumbBack = useCallback((target: ViewMode) => {
    if (target === 'region') {
      setViewMode('region');
      setSelectedRegion(null);
      setSelectedPartner(null);
    } else if (target === 'partners') {
      setViewMode('partners');
      setSelectedPartner(null);
    }
  }, []);

  // PageHeader 返回按钮
  const handleBack = useCallback(() => {
    if (viewMode === 'detail') {
      handleBreadcrumbBack('partners');
    } else if (viewMode === 'partners') {
      handleBreadcrumbBack('region');
    } else {
      navigate(-1);
    }
  }, [viewMode, handleBreadcrumbBack, navigate]);

  // 页面标题
  const pageTitle = viewMode === 'detail'
    ? `${selectedPartner?.name ?? ''} 的推广详情`
    : viewMode === 'partners'
    ? `${selectedRegion?.province ?? ''} · 合伙人`
    : '推广详情';

  return (
    <div className={styles.pageContainer}>
      <div className={styles.blurOrb} aria-hidden="true" />

      <PageHeader title={pageTitle} onBack={handleBack} />

      {/* ─── 面包屑导航 ──────────────────────────────────────── */}
      {(viewMode === 'partners' || viewMode === 'detail') && (
        <nav className={styles.breadcrumb} aria-label="面包屑导航">
          <button
            type="button"
            className={styles.breadcrumbItem}
            onClick={() => handleBreadcrumbBack('region')}
            aria-label="返回地区总览"
          >
            地区总览
          </button>
          <svg className={styles.breadcrumbSep} width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <path d="M9 18l6-6-6-6" />
          </svg>
          {viewMode === 'detail' ? (
            <>
              <button
                type="button"
                className={styles.breadcrumbItem}
                onClick={() => handleBreadcrumbBack('partners')}
                aria-label={`返回${selectedRegion?.province}合伙人列表`}
              >
                {selectedRegion?.province}
              </button>
              <svg className={styles.breadcrumbSep} width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path d="M9 18l6-6-6-6" />
              </svg>
              <span className={styles.breadcrumbCurrent}>{selectedPartner?.name}</span>
            </>
          ) : (
            <span className={styles.breadcrumbCurrent}>{selectedRegion?.province}</span>
          )}
        </nav>
      )}

      <main className={styles.contentWrapper}>

        {/* ─── 查询表单卡片（仅地区视图展示） ──────────────── */}
        {viewMode === 'region' && (
          <div className={styles.formCard}>
            <div className={styles.formCardHeader}>
              <div className={styles.formCardIcon} aria-hidden="true">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
              </div>
              <span className={styles.formCardTitle}>筛选查询</span>
            </div>

            <Form<QueryFormDTO>
              form={form}
              onFinish={handleFinish}
              onFinishFailed={handleFinishFailed}
            >
              {/* 姓名查询 */}
              <div className={styles.fieldGroup}>
                <div className={styles.fieldLabel}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                  姓名查询
                </div>
                <FormItem name="name" rules={formRules.name}>
                  <Input
                    placeholder="请输入合伙人姓名（可选）"
                    maxLength={20}
                  />
                </FormItem>
              </div>

              {/* 省市区选择 */}
              <div className={styles.fieldGroup}>
                <div className={styles.fieldLabel}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
                    <circle cx="12" cy="9" r="2.5" />
                  </svg>
                  选择省市区
                </div>
                <CascaderView
                  options={REGION_DATA}
                  value={region}
                  onChange={setRegion}
                  placeholder="请选择省 / 市 / 区（可选）"
                  allowClear
                  inputStyle={{ height: '4.4rem', fontSize: '1.4rem' }}
                />
              </div>

              {/* 日期查询模式切换 */}
              <div className={styles.fieldGroup}>
                <div className={styles.fieldLabel}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                    <line x1="16" y1="2" x2="16" y2="6" />
                    <line x1="8" y1="2" x2="8" y2="6" />
                    <line x1="3" y1="10" x2="21" y2="10" />
                  </svg>
                  日期筛选方式
                </div>
                <div className={styles.modeSwitchRow}>
                  <button
                    type="button"
                    className={cx(styles.modeBtn, queryMode === 'day' && styles.modeBtnActive)}
                    onClick={() => setQueryMode('day')}
                    aria-pressed={queryMode === 'day'}
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                      <line x1="16" y1="2" x2="16" y2="6" />
                      <line x1="8" y1="2" x2="8" y2="6" />
                      <line x1="3" y1="10" x2="21" y2="10" />
                    </svg>
                    选择年月日
                  </button>
                  <button
                    type="button"
                    className={cx(styles.modeBtn, queryMode === 'range' && styles.modeBtnActive)}
                    onClick={() => setQueryMode('range')}
                    aria-pressed={queryMode === 'range'}
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                      <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
                      <polyline points="16 7 22 7 22 13" />
                    </svg>
                    日期范围
                  </button>
                </div>
              </div>

              {/* 单日选择 */}
              {queryMode === 'day' && (
                <div className={styles.fieldGroup}>
                  <div className={styles.fieldSubLabel}>选择年月日</div>
                  <DayPicker
                    year={dayYear}
                    month={dayMonth}
                    day={dayDay}
                    onChange={(y, m, d) => { setDayYear(y); setDayMonth(m); setDayDay(d); }}
                    onClear={() => {
                      const n = new Date();
                      setDayYear(n.getFullYear());
                      setDayMonth(n.getMonth() + 1);
                      setDayDay(n.getDate());
                    }}
                  />
                </div>
              )}

              {/* 日期范围 */}
              {queryMode === 'range' && (
                <div className={styles.fieldGroup}>
                  <div className={styles.fieldSubLabel}>选择日期范围</div>
                  {!isDateRangeValid && (
                    <div className={styles.dateRangeError}>
                      ⚠️ 结束日期不能早于开始日期
                    </div>
                  )}
                  <DateRangePicker
                    startYear={rangeStartYear}
                    startMonth={rangeStartMonth}
                    startDay={rangeStartDay}
                    endYear={rangeEndYear}
                    endMonth={rangeEndMonth}
                    endDay={rangeEndDay}
                    onStartChange={(y, m, d) => { setRangeStartYear(y); setRangeStartMonth(m); setRangeStartDay(d); }}
                    onEndChange={(y, m, d) => { setRangeEndYear(y); setRangeEndMonth(m); setRangeEndDay(d); }}
                    onClear={() => {
                      const n = new Date();
                      setRangeStartYear(n.getFullYear());
                      setRangeStartMonth(n.getMonth() + 1);
                      setRangeStartDay(1);
                      setRangeEndYear(n.getFullYear());
                      setRangeEndMonth(n.getMonth() + 1);
                      setRangeEndDay(n.getDate());
                    }}
                  />
                </div>
              )}

              {/* 操作按钮行 */}
              <div className={styles.formActions}>
                <button
                  type="button"
                  className={styles.resetBtn}
                  onClick={handleReset}
                  aria-label="重置查询条件"
                >
                  重置
                </button>
                <button
                  type="submit"
                  className={styles.searchBtn}
                  aria-label="开始查询"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                    <circle cx="11" cy="11" r="8" />
                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                  </svg>
                  查询
                </button>
              </div>
            </Form>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════ */}
        {/* 视图一：地区合伙人分布 */}
        {/* ═══════════════════════════════════════════════════════ */}
        {viewMode === 'region' && hasSearched && (
          <>
            {/* 结果摘要条 */}
            <div className={styles.resultSummary}>
              <div className={styles.resultSummaryLeft}>
                <span className={styles.resultSummaryTitle}>地区合伙人分布</span>
                <span className={styles.resultSummaryMeta}>
                  {regionDisplayText} · {dateDisplayText}
                </span>
              </div>
              <span className={styles.resultCount}>{filteredRegions.length} 个地区</span>
            </div>

            {/* 汇总统计 */}
            <div className={styles.statsRow}>
              <div className={styles.statItem}>
                <span className={styles.statNum}>{totalPartners}</span>
                <span className={styles.statLabel}>总合伙人</span>
              </div>
              <div className={styles.statDivider} aria-hidden="true" />
              <div className={styles.statItem}>
                <span className={cx(styles.statNum, styles.statNumOrders)}>{totalOrders.toLocaleString('zh-CN')}</span>
                <span className={styles.statLabel}>总推广单</span>
              </div>
              <div className={styles.statDivider} aria-hidden="true" />
              <div className={styles.statItem}>
                <span className={cx(styles.statNum, styles.statNumRevenue)}>¥{fmtAmount(totalRevenue)}</span>
                <span className={styles.statLabel}>总收益</span>
              </div>
            </div>

            {/* 地区卡片网格 */}
            <div className={styles.regionSectionTitle}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
                <circle cx="12" cy="9" r="2.5" />
              </svg>
              点击地区查看合伙人详情
            </div>

            <div className={styles.regionGrid}>
              {filteredRegions.map((r, idx) => {
                const isTop = idx < 3;
                return (
                  <button
                    key={r.province}
                    type="button"
                    className={cx(styles.regionCard, isTop && styles.regionCardTop)}
                    onClick={() => handleRegionClick(r)}
                    aria-label={`查看${r.province}合伙人详情`}
                  >
                    {/* 排名标记 */}
                    {isTop && (
                      <span className={cx(
                        styles.regionRankBadge,
                        idx === 0 && styles.regionRankGold,
                        idx === 1 && styles.regionRankSilver,
                        idx === 2 && styles.regionRankBronze,
                      )} aria-label={`第${idx + 1}名`}>
                        #{idx + 1}
                      </span>
                    )}

                    {/* 省份名 */}
                    <div className={styles.regionCardHeader}>
                      <div className={styles.regionIconWrap} aria-hidden="true">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
                          <circle cx="12" cy="9" r="2.5" />
                        </svg>
                      </div>
                      <span className={styles.regionProvince}>{r.province}</span>
                      <svg className={styles.regionArrow} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                        <path d="M9 18l6-6-6-6" />
                      </svg>
                    </div>

                    {/* 合伙人数 */}
                    <div className={styles.regionPartnerCount}>
                      <span className={styles.regionPartnerNum}>{r.partnerCount}</span>
                      <span className={styles.regionPartnerLabel}>位合伙人</span>
                    </div>

                    {/* 底部数据行 */}
                    <div className={styles.regionStatsRow}>
                      <div className={styles.regionStatItem}>
                        <span className={styles.regionStatVal}>{r.totalOrders}</span>
                        <span className={styles.regionStatLbl}>推广单</span>
                      </div>
                      <div className={styles.regionStatDivider} aria-hidden="true" />
                      <div className={styles.regionStatItem}>
                        <span className={cx(styles.regionStatVal, styles.regionStatRevenue)}>¥{fmtAmount(r.totalRevenue)}</span>
                        <span className={styles.regionStatLbl}>收益</span>
                      </div>
                      <div className={styles.regionStatDivider} aria-hidden="true" />
                      <div className={styles.regionStatItem}>
                        <span className={cx(styles.regionStatVal, r.growth >= 15 ? styles.regionGrowthHigh : styles.regionGrowthNormal)}>
                          +{r.growth}%
                        </span>
                        <span className={styles.regionStatLbl}>增长</span>
                      </div>
                    </div>

                    {/* 进度条（相对最大值） */}
                    <div className={styles.regionProgressWrap} aria-hidden="true">
                      <div
                        className={styles.regionProgressBar}
                        style={{ width: `${(r.partnerCount / (MOCK_REGION_DATA[0]?.partnerCount || 1)) * 100}%` }}
                      />
                    </div>
                  </button>
                );
              })}
            </div>
          </>
        )}

        {/* 未查询时的占位提示 */}
        {viewMode === 'region' && !hasSearched && (
          <div className={styles.hintCard}>
            <div className={styles.hintIcon} aria-hidden="true">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
                <circle cx="12" cy="9" r="2.5" />
              </svg>
            </div>
            <p className={styles.hintText}>设置筛选条件后点击查询，即可查看各地区合伙人分布</p>
            <ul className={styles.hintList}>
              <li>可按姓名精确查找合伙人</li>
              <li>可选择省市区缩小查询范围</li>
              <li>点击地区卡片查看该地区合伙人列表</li>
              <li>点击合伙人查看每日 / 月 / 年推广数据</li>
            </ul>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════ */}
        {/* 视图二：合伙人列表 */}
        {/* ═══════════════════════════════════════════════════════ */}
        {viewMode === 'partners' && selectedRegion && (
          <>
            {/* 地区概况卡片 */}
            <div className={styles.regionSummaryCard}>
              <div className={styles.regionSummaryLeft}>
                <div className={styles.regionSummaryIcon} aria-hidden="true">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
                    <circle cx="12" cy="9" r="2.5" />
                  </svg>
                </div>
                <div className={styles.regionSummaryInfo}>
                  <span className={styles.regionSummaryName}>{selectedRegion.province}</span>
                  <span className={styles.regionSummaryDate}>{dateDisplayText}</span>
                </div>
              </div>
              <div className={styles.regionSummaryStats}>
                <div className={styles.regionSummaryStatItem}>
                  <span className={styles.regionSummaryNum}>{selectedRegion.partnerCount}</span>
                  <span className={styles.regionSummaryLbl}>合伙人</span>
                </div>
                <div className={styles.regionSummaryStatItem}>
                  <span className={cx(styles.regionSummaryNum, styles.colorGreen)}>{selectedRegion.totalOrders}</span>
                  <span className={styles.regionSummaryLbl}>推广单</span>
                </div>
                <div className={styles.regionSummaryStatItem}>
                  <span className={cx(styles.regionSummaryNum, styles.colorEmerald)}>¥{fmtAmount(selectedRegion.totalRevenue)}</span>
                  <span className={styles.regionSummaryLbl}>总收益</span>
                </div>
              </div>
            </div>

            {/* 合伙人列表提示 */}
            <div className={styles.partnerListHint}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
              点击合伙人可查看推广详情
            </div>

            {/* 合伙人列表 */}
            {currentPartners.length === 0 ? (
              <div className={styles.emptyState}>
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
                <span>该地区暂无合伙人数据</span>
              </div>
            ) : (
              <div className={styles.partnerList}>
                {currentPartners.map((partner) => (
                  <button
                    key={partner.id}
                    type="button"
                    className={cx(styles.partnerCard, partner.rank <= 3 && styles.partnerCardTop)}
                    onClick={() => handlePartnerClick(partner)}
                    aria-label={`查看${partner.name}的推广详情`}
                  >
                    {/* 排名 */}
                    <div className={cx(
                      styles.partnerRankBadge,
                      partner.rank === 1 && styles.partnerRankGold,
                      partner.rank === 2 && styles.partnerRankSilver,
                      partner.rank === 3 && styles.partnerRankBronze,
                    )}>
                      {partner.rank <= 3 ? (
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                          <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17 5.8 21.3l2.4-7.4L2 9.4h7.6L12 2z" />
                        </svg>
                      ) : partner.rank}
                    </div>

                    {/* 头像 */}
                    <div className={cx(
                      styles.partnerAvatar,
                      partner.rank === 1 && styles.partnerAvatarGold,
                      partner.rank === 2 && styles.partnerAvatarSilver,
                      partner.rank === 3 && styles.partnerAvatarBronze,
                    )} aria-hidden="true">
                      {partner.avatar}
                    </div>

                    {/* 信息 */}
                    <div className={styles.partnerInfo}>
                      <div className={styles.partnerInfoTop}>
                        <span className={styles.partnerName}>{partner.name}</span>
                        <span className={cx(styles.partnerGrowth, partner.growth >= 15 && styles.partnerGrowthHigh)}>
                          +{partner.growth}%
                        </span>
                      </div>
                      <span className={styles.partnerLocation}>
                        📍 {partner.city}{partner.district ? ` · ${partner.district}` : ''}
                      </span>
                      <div className={styles.partnerStats}>
                        <span className={styles.partnerStatItem}>
                          <span className={styles.partnerStatNum}>{partner.orders}</span>
                          <span className={styles.partnerStatLbl}> 单</span>
                        </span>
                        <span className={styles.partnerStatSep} aria-hidden="true">·</span>
                        <span className={styles.partnerStatItem}>
                          <span className={cx(styles.partnerStatNum, styles.colorEmerald)}>¥{fmtAmount(partner.revenue)}</span>
                        </span>
                      </div>
                    </div>

                    {/* 进度条 */}
                    <div className={styles.partnerBarWrap} aria-hidden="true">
                      <div
                        className={styles.partnerBar}
                        style={{ width: `${(partner.orders / (currentPartners[0]?.orders || 1)) * 100}%` }}
                      />
                    </div>

                    {/* 箭头 */}
                    <svg className={styles.partnerArrow} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                      <path d="M9 18l6-6-6-6" />
                    </svg>
                  </button>
                ))}
              </div>
            )}
          </>
        )}

        {/* ═══════════════════════════════════════════════════════ */}
        {/* 视图三：合伙人推广详情 */}
        {/* ═══════════════════════════════════════════════════════ */}
        {viewMode === 'detail' && selectedPartner && (
          <>
            {/* 合伙人信息卡 */}
            <div className={styles.partnerHeroCard}>
              <div className={styles.partnerHeroBg} aria-hidden="true" />
              <div className={styles.partnerHeroContent}>
                <div className={cx(
                  styles.partnerHeroAvatar,
                  selectedPartner.rank === 1 && styles.partnerAvatarGold,
                  selectedPartner.rank === 2 && styles.partnerAvatarSilver,
                  selectedPartner.rank === 3 && styles.partnerAvatarBronze,
                )} aria-hidden="true">
                  {selectedPartner.avatar}
                </div>
                <div className={styles.partnerHeroInfo}>
                  <div className={styles.partnerHeroName}>{selectedPartner.name}</div>
                  <div className={styles.partnerHeroMeta}>
                    <span>📍 {selectedPartner.city}{selectedPartner.district ? ` · ${selectedPartner.district}` : ''}</span>
                    <span>加入：{selectedPartner.joinDate}</span>
                  </div>
                </div>
                <div className={styles.partnerHeroGrowthBadge}>
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                    <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
                    <polyline points="16 7 22 7 22 13" />
                  </svg>
                  +{selectedPartner.growth}%
                </div>
              </div>
            </div>

            {/* 时间维度 Tab */}
            <div className={styles.periodTabRow} role="tablist" aria-label="时间维度选择">
              {([
                { key: 'day',   label: '每日', icon: '📅' },
                { key: 'month', label: '每月', icon: '📆' },
                { key: 'year',  label: '每年', icon: '🗓️' },
              ] as { key: PeriodTab; label: string; icon: string }[]).map(tab => (
                <button
                  key={tab.key}
                  type="button"
                  role="tab"
                  aria-selected={periodTab === tab.key}
                  className={cx(styles.periodTab, periodTab === tab.key && styles.periodTabActive)}
                  onClick={() => setPeriodTab(tab.key)}
                >
                  <span aria-hidden="true">{tab.icon}</span>
                  {tab.label}
                </button>
              ))}
            </div>

            {/* 汇总统计卡 */}
            <div className={styles.detailStatsRow}>
              <div className={styles.detailStatCard}>
                <div className={styles.detailStatIcon} aria-hidden="true">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                  </svg>
                </div>
                <div className={styles.detailStatBody}>
                  <span className={styles.detailStatNum}>{detailTotal.orders.toLocaleString('zh-CN')}</span>
                  <span className={styles.detailStatLbl}>
                    {periodTab === 'day' ? '近14日' : periodTab === 'month' ? '本年' : '历年'} 推广单数
                  </span>
                </div>
              </div>
              <div className={styles.detailStatCard}>
                <div className={cx(styles.detailStatIcon, styles.detailStatIconGreen)} aria-hidden="true">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="12" y1="1" x2="12" y2="23" />
                    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                  </svg>
                </div>
                <div className={styles.detailStatBody}>
                  <span className={cx(styles.detailStatNum, styles.colorEmerald)}>¥{fmtAmount(detailTotal.revenue)}</span>
                  <span className={styles.detailStatLbl}>
                    {periodTab === 'day' ? '近14日' : periodTab === 'month' ? '本年' : '历年'} 推广金额
                  </span>
                </div>
              </div>
            </div>

            {/* ECharts 图表 */}
            <div className={styles.chartCard}>
              <div className={styles.chartCardHeader}>
                <div className={styles.chartCardTitleWrap}>
                  <div className={styles.chartCardIcon} aria-hidden="true">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="18" y1="20" x2="18" y2="10" />
                      <line x1="12" y1="20" x2="12" y2="4" />
                      <line x1="6" y1="20" x2="6" y2="14" />
                    </svg>
                  </div>
                  <span className={styles.chartCardTitle}>
                    {periodTab === 'day' ? '每日' : periodTab === 'month' ? '每月' : '每年'}推广趋势
                  </span>
                </div>
              </div>
              <Echarts
                option={chartOption}
                style={{ height: '22rem', width: '100%' }}
              />
            </div>

            {/* 明细列表 */}
            <div className={styles.detailListCard}>
              <div className={styles.detailListHeader}>
                <span className={styles.detailListTitle}>推广明细</span>
                <span className={styles.detailListCount}>{periodRecords.length} 条</span>
              </div>
              <div className={styles.detailListTableHead}>
                <span className={styles.detailThPeriod}>
                  {periodTab === 'day' ? '日期' : periodTab === 'month' ? '月份' : '年份'}
                </span>
                <span className={styles.detailThOrders}>推广单数</span>
                <span className={styles.detailThRevenue}>推广金额</span>
              </div>
              <div className={styles.detailList}>
                {periodRecords.map((record, idx) => (
                  <div key={idx} className={styles.detailListItem}>
                    <span className={styles.detailItemPeriod}>{record.label}</span>
                    <span className={styles.detailItemOrders}>{record.orders} 单</span>
                    <span className={cx(styles.detailItemRevenue, styles.colorEmerald)}>¥{fmtAmount(record.revenue)}</span>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

      </main>
    </div>
  );
};

export default PromotionRankDetail;
