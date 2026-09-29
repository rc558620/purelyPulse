// 会员运营 / 营业统计请求：purelyClub C 端会员运营统计与 owner 视角营业详情统计。
import { createKeyedInFlightRequest, http } from '@utils/http';
import { safeNum } from '@utils/utils';
import { MEMBER_CLUB_STATS_API_PATH, MEMBER_SALES_STATS_API_PATH, resolveMemberActionPath } from './memberList.apiPaths';
import { isPlainObject, normalizeNumber, pickDisplayField, pickNumberField, pickStringField } from './memberList.normalize';
import type {
  ClubMemberStats,
  MemberSalesStats,
  SalesPeriodDataPoint,
  SalesPeriodSummary,
  SalesPeriodType,
} from './memberList.stats.types';

// ─── purelyClub C 端会员运营统计 ──────────────────────────────────────────

/** 兜底的空运营数据，接口异常时使用。 */
const EMPTY_CLUB_STATS: ClubMemberStats = {
  pendingBalanceDisplay: '',
  totalRechargeDisplay: '',
  totalMemberCount: 0,
  rechargeCount: 0,
  todayRechargeDisplay: '',
  monthRechargeDisplay: '',
  quarterRechargeDisplay: '',
  yearRechargeDisplay: '',
  lastYearRechargeDisplay: '',
  levelBreakdown: { free: 0, gold: 0, platinum: 0, diamond: 0 },
};

const CLUB_STATS_TOTAL_MEMBER_CANDIDATES = ['totalMemberCount', 'memberCount', 'total', 'totalMembers'] as const;
const CLUB_STATS_RECHARGE_COUNT_CANDIDATES = ['rechargeCount', 'rechargeTimes', 'payCount', 'orderCount'] as const;
const CLUB_STATS_LEVEL_BREAKDOWN_CANDIDATES = ['levelBreakdown', 'breakdown', 'levelStats', 'memberLevels'] as const;

/** C 端会员等级分布归一：结构异常时返回全零分布。 */
const normalizeClubMemberLevelBreakdown = (value: unknown): ClubMemberStats['levelBreakdown'] => {
  if (!isPlainObject(value)) {
    return { free: 0, gold: 0, platinum: 0, diamond: 0 };
  }

  return {
    free: safeNum(normalizeNumber(value.free)),
    gold: safeNum(normalizeNumber(value.gold)),
    platinum: safeNum(normalizeNumber(value.platinum)),
    diamond: safeNum(normalizeNumber(value.diamond)),
  };
};

/** C 端会员运营统计归一：金额一律取后端展示字段，前端不换算。 */
const normalizeClubStats = (raw: unknown): ClubMemberStats => {
  if (!isPlainObject(raw)) {
    return EMPTY_CLUB_STATS;
  }

  const pendingBalanceDisplay = pickDisplayField(raw, ['pendingBalanceDisplay', 'pendingBalanceFen', 'pendingBalance', 'inTransitBalance']);
  const totalRechargeDisplay = pickDisplayField(raw, ['totalRechargeDisplay', 'totalRechargeFen', 'totalRecharge', 'totalAmount']);
  const totalMemberCount = pickNumberField(raw, CLUB_STATS_TOTAL_MEMBER_CANDIDATES);
  const rechargeCount = pickNumberField(raw, CLUB_STATS_RECHARGE_COUNT_CANDIDATES);
  const todayRechargeDisplay = pickDisplayField(raw, ['todayRechargeDisplay', 'todayRechargeFen', 'todayRecharge', 'todayAmount']);
  const monthRechargeDisplay = pickDisplayField(raw, ['monthRechargeDisplay', 'monthRechargeFen', 'monthRecharge', 'monthAmount']);
  const quarterRechargeDisplay = pickDisplayField(raw, ['quarterRechargeDisplay', 'quarterRechargeFen', 'quarterRecharge', 'quarterAmount']);
  const yearRechargeDisplay = pickDisplayField(raw, ['yearRechargeDisplay', 'yearRechargeFen', 'yearRecharge', 'yearAmount']);
  const lastYearRechargeDisplay = pickDisplayField(raw, ['lastYearRechargeDisplay', 'lastYearRechargeFen', 'lastYearRecharge', 'lastYearAmount']);

  const levelBreakdownKey = CLUB_STATS_LEVEL_BREAKDOWN_CANDIDATES.find((key) => isPlainObject(raw[key]));
  const levelBreakdownRaw = levelBreakdownKey ? raw[levelBreakdownKey] : undefined;
  const levelBreakdown = normalizeClubMemberLevelBreakdown(levelBreakdownRaw);

  return { pendingBalanceDisplay, totalRechargeDisplay, totalMemberCount, rechargeCount, todayRechargeDisplay, monthRechargeDisplay, quarterRechargeDisplay, yearRechargeDisplay, lastYearRechargeDisplay, levelBreakdown };
};

/** 获取指定商家（会员）的 purelyClub C 端会员运营统计。 */
export const fetchMemberClubStats = createKeyedInFlightRequest(
  (memberId: string) => `club-stats:${memberId}`,
  async (memberId: string): Promise<ClubMemberStats> => {
    const requestTarget = resolveMemberActionPath(MEMBER_CLUB_STATS_API_PATH, memberId);
    const response = await http.get<unknown>(requestTarget.url, {
      params: requestTarget.params,
      skipGlobalErrorHandler: true,
      errorMessage: '获取会员运营情况失败',
    });

    return normalizeClubStats(response);
  },
);

// ─── 会员营业详情统计 ───────────────────────────────────────────────────

/** 所有周期 key 列表。 */
const SALES_PERIOD_KEYS = ['today', 'week', 'month', 'year', 'lastYear'] as const;

/** 增幅字段候选名（后端可能使用的字段名）。 */
const SALES_GROWTH_PCT_CANDIDATES = ['salesGrowthPct', 'salesGrowth', 'salesGrowthRate', 'salesChange'] as const;
const PROFIT_GROWTH_PCT_CANDIDATES = ['profitGrowthPct', 'profitGrowth', 'profitGrowthRate', 'profitChange'] as const;

/** 安全归一化增幅值：仅接受 number 或 null，过滤 NaN / Infinity / 字符串。 */
const normalizeGrowthPct = (value: unknown): number | null => {
  if (value === null || value === undefined) return null;
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  if (typeof value === 'string') {
    const trimmed = value.replace(/%$/, '').trim();
    if (!trimmed || trimmed === '--') return null;
    const parsed = Number(trimmed);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
};

/** 安全归一化单个数据点。 */
const normalizeDataPoint = (raw: unknown): SalesPeriodDataPoint => {
  if (!isPlainObject(raw)) {
    return { label: '', salesDisplay: '', profitDisplay: '' };
  }

  return {
    label: pickStringField(raw, ['label', 'name', 'timeLabel']),
    salesDisplay: pickDisplayField(raw, ['salesDisplay', 'salesFen', 'sales', 'revenueFen', 'amount']),
    profitDisplay: pickDisplayField(raw, ['profitDisplay', 'profitFen', 'profit', 'grossProfitFen']),
  };
};

/** 安全归一化数据点数组，空时返回空数组。 */
const normalizeDataPoints = (value: unknown): SalesPeriodDataPoint[] => {
  if (!Array.isArray(value)) return [];
  return value.map(normalizeDataPoint);
};

/** 从后端响应对象中提取增幅字段（多候选名）。 */
const pickGrowthPct = (raw: Record<string, unknown>, candidates: readonly string[]): number | null => {
  for (const key of candidates) {
    const value = raw[key];
    if (value !== undefined) return normalizeGrowthPct(value);
  }
  return null;
};

/** 安全归一化单个周期的销售汇总。 */
const normalizePeriodSummary = (raw: unknown, fallbackPeriod: SalesPeriodType): SalesPeriodSummary => {
  if (!isPlainObject(raw)) {
    return {
      period: fallbackPeriod,
      totalSalesDisplay: '',
      totalProfitDisplay: '',
      salesGrowthPct: null,
      profitGrowthPct: null,
      dataPoints: [],
    };
  }

  return {
    period: (pickStringField(raw, ['period']) || fallbackPeriod) as SalesPeriodType,
    totalSalesDisplay: pickDisplayField(raw, ['totalSalesDisplay', 'totalSalesFen', 'totalSales', 'salesTotal', 'totalRevenueFen']),
    totalProfitDisplay: pickDisplayField(raw, ['totalProfitDisplay', 'totalProfitFen', 'totalProfit', 'profitTotal', 'grossProfitFen']),
    salesGrowthPct: pickGrowthPct(raw, SALES_GROWTH_PCT_CANDIDATES),
    profitGrowthPct: pickGrowthPct(raw, PROFIT_GROWTH_PCT_CANDIDATES),
    dataPoints: normalizeDataPoints(raw.dataPoints ?? raw.points ?? raw.chartData),
  };
};

/** 构建全零兜底营业统计数据（接口异常时使用）。 */
const buildEmptySalesStats = (): MemberSalesStats => {
  const emptyPeriod = (period: SalesPeriodType): SalesPeriodSummary => ({
    period,
    totalSalesDisplay: '',
    totalProfitDisplay: '',
    salesGrowthPct: null,
    profitGrowthPct: null,
    dataPoints: [],
  });

  return {
    today: emptyPeriod('today'),
    week: emptyPeriod('week'),
    month: emptyPeriod('month'),
    year: emptyPeriod('year'),
    lastYear: emptyPeriod('lastYear'),
  };
};

/** 安全归一化完整营业统计响应。 */
const normalizeSalesStats = (raw: unknown): MemberSalesStats => {
  if (!isPlainObject(raw)) {
    return buildEmptySalesStats();
  }

  const result: Partial<MemberSalesStats> = {};
  for (const key of SALES_PERIOD_KEYS) {
    result[key] = normalizePeriodSummary(raw[key], key);
  }

  return result as MemberSalesStats;
};

/** 获取指定商家（会员）的营业详情统计（owner 视角）。 */
export const fetchMemberSalesStats = createKeyedInFlightRequest(
  (memberId: string) => `sales-stats:${memberId}`,
  async (memberId: string): Promise<MemberSalesStats> => {
    const requestTarget = resolveMemberActionPath(MEMBER_SALES_STATS_API_PATH, memberId);

    const response = await http.get<unknown>(requestTarget.url, {
      params: requestTarget.params,
      skipGlobalErrorHandler: true,
      errorMessage: '获取营业详情失败',
    });

    return normalizeSalesStats(response);
  },
);
