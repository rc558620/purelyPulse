// 首页图表常量：统一管理图表区的固定高度。
export const HOME_CHART_HEIGHTS = {
  onlineBreakdown: 132,
  revenueTrend: 240,
} as const;

/** 在线人数柱状图的分类标签：商家端 / 个人端 / 合计 */
export const HOME_ONLINE_BAR_LABELS = ['purelyProfit', 'purelyClub', '在线人数共计'] as const;
/** 在线人数柱状图的柱子配色：商家端蓝 / 个人端紫 / 合计品牌绿 */
export const HOME_ONLINE_BAR_COLORS = ['#0ea5e9', '#a855f7', '#84cc16'] as const;

export const CHART_ICON_GRADIENTS = {
  revenueTrend: 'linear-gradient(135deg, #f97316 0%, #fb923c 100%)',
} as const;
