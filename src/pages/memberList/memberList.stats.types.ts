// 会员统计类型：purelyClub C 端会员运营统计与 owner 视角营业详情统计。
// 从 memberList.types.ts 拆出；金额均为后端算好的展示字符串，前端只渲染不换算，
// 数值型字段（计数 / 增幅）进入 UI 前由映射层经 safeNum 归一。

// ─── purelyClub C 端会员运营数据 ──────────────────────────────────────────

/** C 端会员等级（purelyClub 储值会员分层）。 */
export type ClubMemberLevel = 'free' | 'gold' | 'platinum' | 'diamond';

/** C 端各等级会员数量分布。 */
export interface ClubMemberLevelBreakdown {
  /** 免费会员数量。 */
  free: number;
  /** 黄金会员数量。 */
  gold: number;
  /** 铂金会员数量。 */
  platinum: number;
  /** 钻石会员数量。 */
  diamond: number;
}

/** 该商家在 purelyClub 的会员运营统计（owner 视角）。 */
export interface ClubMemberStats {
  /** 顾客在途余额展示值（后端直接返回，前端不再分转元）。 */
  pendingBalanceDisplay: string;
  /** 会员充值总金额展示值（后端直接返回，前端不再分转元）。 */
  totalRechargeDisplay: string;
  /** 会员用户总数。 */
  totalMemberCount: number;
  /** 累计充值笔数。 */
  rechargeCount: number;
  /** 今日储值金额展示值（后端直接返回，前端不再分转元）。 */
  todayRechargeDisplay: string;
  /** 本月储值金额展示值（后端直接返回，前端不再分转元）。 */
  monthRechargeDisplay: string;
  /** 本季储值金额展示值（后端直接返回，前端不再分转元）。 */
  quarterRechargeDisplay: string;
  /** 本年储值金额展示值（后端直接返回，前端不再分转元）。 */
  yearRechargeDisplay: string;
  /** 去年储值金额展示值（后端直接返回，前端不再分转元）。 */
  lastYearRechargeDisplay: string;
  /** 各等级会员数量分布。 */
  levelBreakdown: ClubMemberLevelBreakdown;
}

// ─── 会员营业详情：销售额与利润数据 ────────────────────────────────────────────

/** 单周期销售/利润数据点。 */
export interface SalesPeriodDataPoint {
  /** 时间标签（如"周一"、"1月"等）。 */
  label: string;
  /** 销售额展示值（后端直接返回，前端不再分转元）。 */
  salesDisplay: string;
  /** 利润展示值（后端直接返回，前端不再分转元）。 */
  profitDisplay: string;
}

/** 销售统计时间维度类型。 */
export type SalesPeriodType = 'today' | 'week' | 'month' | 'year' | 'lastYear';

/** 单维度销售汇总。 */
export interface SalesPeriodSummary {
  /** 时间维度。 */
  period: SalesPeriodType;
  /** 销售总额展示值（后端直接返回，前端不再分转元）。 */
  totalSalesDisplay: string;
  /** 利润总额展示值（后端直接返回，前端不再分转元）。 */
  totalProfitDisplay: string;
  /** 销售额环比增幅（百分比，null = 无数据）。 */
  salesGrowthPct: number | null;
  /** 利润环比增幅（百分比，null = 无数据）。 */
  profitGrowthPct: number | null;
  /** 各时间点明细（今日=小时，本周=天，本月=天，今年/去年=月）。 */
  dataPoints: SalesPeriodDataPoint[];
}

/** 该商家的营业详情统计（owner 视角，含 5 个周期）。 */
export interface MemberSalesStats {
  /** 今日数据。 */
  today: SalesPeriodSummary;
  /** 本周数据。 */
  week: SalesPeriodSummary;
  /** 本月数据。 */
  month: SalesPeriodSummary;
  /** 今年数据。 */
  year: SalesPeriodSummary;
  /** 去年数据。 */
  lastYear: SalesPeriodSummary;
}
