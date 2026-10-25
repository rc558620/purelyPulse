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

// ─── 门店额度变动记录 ─────────────────────────────────────────────────

/** 变动记录筛选 Tab：全部 / 管理员调整 / 充值 / 消耗 */
export type NewCustomerQuotaLogTab = 'all' | 'admin' | 'recharge' | 'consume';

/** 变动记录 Tab 选项 */
export interface NewCustomerQuotaLogTabOption {
  /** Tab 值 */
  value: NewCustomerQuotaLogTab;
  /** Tab 文案 */
  label: string;
}

/**
 * 额度流水类型（后端枚举原义）。
 *
 * `grant`（会员赠送）不单独占 Tab，只在「全部」中出现；
 * `consume` Tab 同时覆盖 `consume` 与 `clear`（清零同样是余额减少）。
 */
export type NewCustomerQuotaLogType = 'recharge' | 'grant' | 'consume' | 'clear' | 'admin_adjust' | 'unknown';

/** 一条额度变动记录 */
export interface NewCustomerQuotaLog {
  /** 流水 ID */
  id: string;
  /** 所属门店 ID */
  storeId: string;
  /** 变动类型 */
  type: NewCustomerQuotaLogType;
  /** 变动数量：正数增加，负数减少 */
  changeAmount: SafeNumber;
  /** 变动后的余额 */
  balanceAfter: SafeNumber;
  /** 充值金额（分），仅充值流水有值 */
  amountFen?: SafeNumber;
  /** 流水说明 */
  description: string;
  /** 变动时间戳（ms），脏值归一为 0 */
  createdAt: SafeNumber;
}

/** 变动记录统计概览（门店全量口径，不随 Tab 变化） */
export interface NewCustomerQuotaLogStats {
  /** 变动记录总条数 */
  totalRecords: SafeNumber;
  /** 管理员调整次数 */
  adminAdjustCount: SafeNumber;
  /** 充值次数 */
  rechargeCount: SafeNumber;
  /** 消耗次数（含额度清零） */
  consumeCount: SafeNumber;
}

/** 变动记录查询条件：门店 + Tab，均由后端权威过滤 */
export interface NewCustomerQuotaLogQuery {
  /** 目标门店 ID */
  storeId: string;
  /** 当前筛选 Tab */
  tab: NewCustomerQuotaLogTab;
}

/** 变动记录单页结果（page / pageSize 真分页） */
export interface NewCustomerQuotaLogPageResult {
  /** 当前页记录 */
  logs: NewCustomerQuotaLog[];
  /** 后端统计概览 */
  stats: NewCustomerQuotaLogStats;
  /** 当前 Tab 下的记录总数（后端口径） */
  total: SafeNumber;
  /** 是否还有下一页 */
  hasMore: boolean;
  /** 后端回显的当前页码，用于校准下一页 */
  page: SafeNumber;
}

/** 拉取单页变动记录的入参：每页条数由页面常量统一给出 */
export interface NewCustomerQuotaLogRequestParams {
  /** 查询条件 */
  query: NewCustomerQuotaLogQuery;
  /** 页码，从 1 开始 */
  page: number;
  /** 取消信号：换 Tab / 卸载时作废在途请求 */
  signal?: AbortSignal;
}
