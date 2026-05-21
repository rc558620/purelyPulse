// 首页总览类型：统一首页总览接口返回的前端语义模型。
export type RevenuePeriod = 'today' | 'week' | 'month' | 'season';

export interface HomeRevenuePeriodData {
  dates: string[];
  values: number[];
  total: number;
  avg: number;
  growth: number;
}

export interface HomePartnerStats {
  total: number;
  newThisMonth: number;
  activeRate: number;
  totalRevenue: number;
  totalOrders: number;
  avgPerPartner: number;
}

export interface HomePartnerRankItem {
  id: string;
  name: string;
  city: string;
  orders: number;
  revenue: number;
}

export interface HomeRevenueTypeItem {
  label: string;
  value: number;
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
