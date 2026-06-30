export type RevenuePeriod = 'today' | 'week' | 'month' | 'season';

export interface RevenueDetailSummary {
  /** 总收入展示值（后端直接返回，前端不再分转元）。 */
  totalDisplay: string;
  /** 日均收入展示值（后端直接返回，前端不再分转元）。 */
  avgDisplay: string;
  /** 同比增长率（百分比数值，前端仅做格式化展示）。 */
  growth: number;
  /** 充值笔数。 */
  orders: number;
  /** 单日峰值展示值（后端直接返回，前端不再分转元）。 */
  peakDisplay: string;
}

export interface RevenueDetailTrend {
  dates: string[];
  /** 趋势金额展示值数组（后端直接返回，前端不再分转元）。 */
  valuesDisplay: string[];
}

export interface RevenueTypeItem {
  label: string;
  value: number;
}

export interface RevenueRecordItem {
  id: string;
  user: string;
  type: string;
  /** 金额展示值（后端直接返回，前端不再分转元）。 */
  amountDisplay: string;
  region: string;
  time: string;
}

export interface RevenueDetailData {
  summary: RevenueDetailSummary;
  trend: RevenueDetailTrend;
  revenueTypes: RevenueTypeItem[];
  records: RevenueRecordItem[];
  totalRecords: number;
}

export interface RevenueDetailQuery {
  period: RevenuePeriod;
  date: string | null;
  startDate: string | null;
  endDate: string | null;
  regionValues: string[];
}
