// 首页总览类型：统一首页总览接口返回的前端语义模型。
// 前端禁止金额转换和格式化。所有金额展示值由后端直接返回 xxxDisplay 字段。
export type RevenuePeriod = 'today' | 'week' | 'month' | 'season';

export interface HomeRevenuePeriodData {
  dates: string[];
  /** 金额展示值（后端直接返回，前端不再分转元） */
  values: string[];
  /** 期间总额展示值 */
  totalDisplay: string;
  /** 期间日均展示值 */
  avgDisplay: string;
  growth: number;
}

export interface HomePartnerStats {
  total: number;
  newThisMonth: number;
  activeRate: number;
  /** 总收入展示值（后端直接返回，前端不再分转元） */
  totalRevenueDisplay: string;
  totalOrders: number;
  /** 人均收入展示值（后端直接返回，前端不再分转元） */
  avgPerPartnerDisplay: string;
}

export interface HomePartnerRankItem {
  id: string;
  name: string;
  city: string;
  orders: number;
  /** 收入展示值（后端直接返回，前端不再分转元） */
  revenueDisplay: string;
}

export interface HomeRevenueTypeItem {
  label: string;
  value: number;
}

/** 首页总览查询条件。 */
export interface HomeOverviewQuery {
  revenuePeriod: RevenuePeriod;
  /** 地区筛选名称，与 regionCode 同时下发，后端按「名称 OR 编码」匹配 */
  region?: string;
  /** 地区筛选的行政区划编码，兼容库里存编码的合伙人数据 */
  regionCode?: string;
  customDate?: string;
  customRangeStart?: string;
  customRangeEnd?: string;
}

export interface HomeOverviewData {
  onlineCount: number;
  onlinePeak: number;
  onlineTrend: number[];
  onlineGrowthRate: number;
  pendingApplicationCount: number;
  partnerStats: HomePartnerStats;
  revenueByPeriod: Record<RevenuePeriod, HomeRevenuePeriodData>;
  revenueTypes: HomeRevenueTypeItem[];
  partnerTop: HomePartnerRankItem[];
}
