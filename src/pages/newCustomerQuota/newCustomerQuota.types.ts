// 新客额度管理页面领域类型（单位统一为「位新客」）
// 所有数字字段进入 UI 渲染前必须经 safeNum 处理，避免脏数据直出。
import { safeNum } from '@utils/utils';

/** UI 安全数字类型 */
type SafeNumber = ReturnType<typeof safeNum>;

/** 门店列表筛选 Tab */
export type NewCustomerQuotaFilterTab = 'all' | 'warning' | 'exhausted';

/** 健康度筛选值（对应后端 health 查询参数，all 不传参） */
export type NewCustomerQuotaHealthFilter = Exclude<NewCustomerQuotaFilterTab, 'all'>;

/** 额度调整方向：add=发放，subtract=回收 */
export type NewCustomerQuotaAdjustDir = 'add' | 'subtract';

/**
 * 门店额度健康度。
 * `none` 与 `exhausted` 必须分开：remaining 为 0 既可能是「用完了」，
 * 也可能是「平台从没发过」，混为一谈会把新商家误标成已耗尽。
 */
export type NewCustomerQuotaHealth = 'none' | 'exhausted' | 'warning' | 'healthy';

export interface NewCustomerQuotaTabOption {
  /** Tab 值 */
  value: NewCustomerQuotaFilterTab;
  /** Tab 文案 */
  label: string;
}

export interface NewCustomerQuotaAdjustOption {
  /** 方向值 */
  value: NewCustomerQuotaAdjustDir;
  /** 方向文案 */
  label: string;
  /** 方向符号 */
  sign: string;
  /** 主题色 */
  color: string;
}

/** 门店新客额度快照（身份展示门店主账号） */
export interface NewCustomerQuotaStore {
  /** 门店 ID（后端为数字，前端统一按字符串使用） */
  id: string;
  /** 门店名称 */
  storeName: string;
  /** 主账号昵称 */
  ownerName: string;
  /** 主账号手机号，取不到时为空串 */
  ownerPhone: string;
  /** 主账号头像 URL */
  ownerAvatarUrl: string;
  /** 剩余新客额度 */
  remaining: SafeNumber;
  /** 累计已服务新客数 */
  consumed: SafeNumber;
  /** 额度预警阈值 */
  warningThreshold: SafeNumber;
  /** 额度最近更新时间戳（ms）；无档案时为 0 */
  updatedAt: SafeNumber;
}

/**
 * 新客额度页面概览统计。
 *
 * ⚠️ 后端刻意只吃 keyword 过滤、**不吃 health 筛选**：顶部「门店数 / 额度合计」是
 * 概览指标，若跟随「已耗尽」Tab 会恒为 0 而失去意义。
 * 因此它不等于列表条数——列表头要用 `NewCustomerQuotaListPageResult.total`。
 */
export interface NewCustomerQuotaStats {
  /** 门店总数 */
  storeCount: SafeNumber;
  /** 剩余额度合计 */
  totalRemaining: SafeNumber;
  /** 额度预警门店数（剩余额度低于预警阈值） */
  warningCount: SafeNumber;
  /** 额度已耗尽门店数 */
  exhaustedCount: SafeNumber;
}

/** 门店额度列表查询条件（keyword + 健康度，均由后端权威过滤） */
export interface NewCustomerQuotaListQuery {
  /** 搜索关键词：主账号昵称 / 手机号 / 门店名 */
  keyword: string;
  /** 健康度筛选，null 表示全部门店 */
  health: NewCustomerQuotaHealthFilter | null;
}

/** 门店额度列表单页结果 */
export interface NewCustomerQuotaListPageResult {
  /** 当前页门店列表 */
  stores: NewCustomerQuotaStore[];
  /** 后端统计概览（只吃 keyword，不随健康度 Tab 变化） */
  stats: NewCustomerQuotaStats;
  /**
   * 当前筛选条件（keyword + health）命中的门店总数，与分页无关。
   * 列表头的「N 家」必须用这个值：用 stats.storeCount 会在切到「预警 / 已耗尽」
   * Tab 时显示全量门店数，与列表实际条数对不上。
   */
  total: SafeNumber;
  /** 是否还有下一页 */
  hasMore: boolean;
}
