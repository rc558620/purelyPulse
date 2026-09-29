// 首页总览默认口径：集中管理周期枚举、默认充值类型与各类空态，
// 保证接口缺字段时页面呈现一致的零值 / 空展示值，避免各组件各自兜底。
import type {
  HomeOverviewData,
  HomePartnerStats,
  HomeRevenuePeriodData,
  HomeRevenueTypeItem,
  RevenuePeriod,
} from './home.types';

/** 后端支持的营收周期，顺序与页面 tab 一致。 */
export const REVENUE_PERIODS: RevenuePeriod[] = ['today', 'week', 'month', 'season'];
/** 充值类型分布缺失时的默认分类。 */
export const REVENUE_TYPE_DEFAULTS = ['月卡会员', '季度会员', '年卡会员', '永久会员', '其他充值'] as const;

export const createEmptyRevenuePeriod = (): HomeRevenuePeriodData => ({
  dates: [],
  values: [],
  totalDisplay: '',
  avgDisplay: '',
  growth: 0,
});

export const createEmptyPartnerStats = (): HomePartnerStats => ({
  total: 0,
  newThisMonth: 0,
  activeRate: 0,
  totalRevenueDisplay: '',
  totalOrders: 0,
  avgPerPartnerDisplay: '',
});

/** 四个周期的空白容器：按 REVENUE_PERIODS 逐个铺开，避免增改周期时漏改某一处。 */
export const createEmptyRevenueByPeriod = (): Record<RevenuePeriod, HomeRevenuePeriodData> => ({
  today: createEmptyRevenuePeriod(),
  week: createEmptyRevenuePeriod(),
  month: createEmptyRevenuePeriod(),
  season: createEmptyRevenuePeriod(),
});

export const createEmptyRevenueTypes = (): HomeRevenueTypeItem[] => (
  REVENUE_TYPE_DEFAULTS.map((label) => ({ label, value: 0 }))
);

export const createEmptyHomeOverview = (): HomeOverviewData => ({
  onlineCount: 0,
  onlinePeak: 0,
  onlineTrend: [],
  onlineGrowthRate: 0,
  pendingApplicationCount: 0,
  partnerStats: createEmptyPartnerStats(),
  revenueByPeriod: createEmptyRevenueByPeriod(),
  revenueTypes: createEmptyRevenueTypes(),
  partnerTop: [],
});
