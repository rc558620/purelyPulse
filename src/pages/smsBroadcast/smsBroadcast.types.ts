// 群发短信管理页面领域类型。
//
// 💰 金额口径铁律：**所有金额字段单位统一为「分」（Int）**，与后端
// `store_sms_accounts.balance_fen` / `sms.prisma` 完全同源。
// 元 ↔ 分的换算只允许发生在「表单输入」和「UI 渲染」两个边界，
// 一律走 @/pages/smsBroadcast/smsBroadcast.utils 的 fenToYuan / formatFen，绝不手写 /100。
import { safeNum } from '@utils/utils';

/** UI 安全数字类型 */
type SafeNumber = ReturnType<typeof safeNum>;

/** 门店列表筛选 Tab */
export type SmsBroadcastFilterTab = 'all' | 'warning' | 'exhausted';

/** 余额健康度筛选值（对应后端 health 查询参数，all 不传参） */
export type SmsBroadcastHealthFilter = Exclude<SmsBroadcastFilterTab, 'all'>;

/** 平台余额调整方向：grant=赠送，revoke=回收 */
export type SmsBroadcastGrantDir = 'grant' | 'revoke';

/**
 * 短信余额健康度。
 * `none` 与 `exhausted` 必须分开：余额为 0 既可能是「发短信用完了」，
 * 也可能是「平台从没赠送过」，混为一谈会把新商家误标成已耗尽。
 */
export type SmsBroadcastHealth = 'none' | 'exhausted' | 'warning' | 'healthy';

export interface SmsBroadcastTabOption {
  /** Tab 值 */
  value: SmsBroadcastFilterTab;
  /** Tab 文案 */
  label: string;
}

export interface SmsBroadcastGrantOption {
  /** 方向值 */
  value: SmsBroadcastGrantDir;
  /** 方向文案 */
  label: string;
  /** 方向符号 */
  sign: string;
  /** 主题色 */
  color: string;
}

/** 门店短信账户快照（身份展示门店主账号，每门店一行） */
export interface SmsAccount {
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
  /** 可用余额（分） */
  balanceFen: SafeNumber;
  /** 累计充值金额（分，不含平台赠送） */
  totalRechargedFen: SafeNumber;
  /** 累计消耗金额（分） */
  totalConsumedFen: SafeNumber;
  /** 累计发送成功短信条数（计费条数口径） */
  sentSmsCount: SafeNumber;
  /** 余额预警阈值（分）；低于此值进入「余额预警」 */
  warningThresholdFen: SafeNumber;
  /** 账户最近更新时间戳（ms）；无账户记录时为 0 */
  updatedAt: SafeNumber;
}

/**
 * 群发短信页面概览统计。
 *
 * ⚠️ 后端刻意只吃 keyword 过滤、**不吃 health 筛选**：顶部「门店数 / 余额合计」是
 * 概览指标，若跟随「已耗尽」Tab 会恒为 0 而失去意义。
 * 因此它不等于列表条数——列表头要用 `SmsBroadcastListPageResult.total`。
 */
export interface SmsBroadcastStats {
  /** 门店总数 */
  storeCount: SafeNumber;
  /** 短信余额合计（分） */
  totalBalanceFen: SafeNumber;
  /** 余额预警门店数（余额低于预警阈值） */
  warningCount: SafeNumber;
  /** 余额已耗尽门店数 */
  exhaustedCount: SafeNumber;
}

/** 门店短信账户列表查询条件（keyword + 健康度，均由后端权威过滤） */
export interface SmsBroadcastListQuery {
  /** 搜索关键词：主账号昵称 / 手机号 / 门店名 */
  keyword: string;
  /** 健康度筛选，null 表示全部门店 */
  health: SmsBroadcastHealthFilter | null;
}

/** 门店短信账户列表单页结果 */
export interface SmsBroadcastListPageResult {
  /** 当前页门店列表 */
  stores: SmsAccount[];
  /** 后端统计概览（只吃 keyword，不随健康度 Tab 变化） */
  stats: SmsBroadcastStats;
  /**
   * 当前筛选条件（keyword + health）命中的门店总数，与分页无关。
   * 列表头的「N 家」必须用这个值：用 stats.storeCount 会在切到「预警 / 已耗尽」
   * Tab 时显示全量门店数，与列表实际条数对不上。
   */
  total: SafeNumber;
  /** 是否还有下一页 */
  hasMore: boolean;
}

// ─── 门店短信钱包变动记录 ─────────────────────────────────────────────

/** 变动记录筛选 Tab：全部 / 平台调整 / 充值 / 消耗 / 退费 */
export type SmsBroadcastLogTab = 'all' | 'admin' | 'recharge' | 'consume' | 'refund';

/** 变动记录 Tab 选项 */
export interface SmsBroadcastLogTabOption {
  /** Tab 值 */
  value: SmsBroadcastLogTab;
  /** Tab 文案 */
  label: string;
}

/**
 * 短信钱包流水类型（后端 SmsWalletLogType 原义）。
 *
 * `grant`（平台赠送）与 `admin_adjust`（平台回收）在「平台调整」Tab 中合并展示，
 * 在「全部」里仍按各自类型文案区分。
 */
export type SmsWalletLogType = 'recharge' | 'consume' | 'refund' | 'grant' | 'admin_adjust' | 'unknown';

/** 一条短信钱包变动记录 */
export interface SmsWalletLog {
  /** 流水 ID */
  id: string;
  /** 所属门店 ID */
  storeId: string;
  /** 变动类型 */
  type: SmsWalletLogType;
  /** 变动金额（分）：正数入账、负数出账 */
  changeFen: SafeNumber;
  /** 变动后的账户余额（分） */
  balanceAfterFen: SafeNumber;
  /** 流水说明 */
  description: string;
  /** 关联充值订单号，仅充值 / 退费有值 */
  orderNo?: string;
  /** 关联群发任务 ID，仅扣费 / 退费有值 */
  broadcastId?: string;
  /** 变动时间戳（ms），脏值归一为 0 */
  createdAt: SafeNumber;
}

/** 变动记录统计概览（与列表同口径，不随分页变化） */
export interface SmsWalletLogStats {
  /** 当前 Tab 下的流水总条数 */
  totalRecords: SafeNumber;
  /** 平台调整次数（赠送 + 回收） */
  adminAdjustCount: SafeNumber;
  /** 商家充值次数 */
  rechargeCount: SafeNumber;
  /** 群发扣费次数 */
  consumeCount: SafeNumber;
  /** 失败退费次数 */
  refundCount: SafeNumber;
}

/** 变动记录查询条件：门店 + Tab，均由后端权威过滤 */
export interface SmsWalletLogQuery {
  /** 目标门店 ID */
  storeId: string;
  /** 当前筛选 Tab */
  tab: SmsBroadcastLogTab;
}

/** 变动记录单页结果（page / pageSize 真分页） */
export interface SmsWalletLogPageResult {
  /** 当前页记录 */
  logs: SmsWalletLog[];
  /** 后端统计概览 */
  stats: SmsWalletLogStats;
  /** 当前 Tab 下的记录总数（后端口径） */
  total: SafeNumber;
  /** 是否还有下一页 */
  hasMore: boolean;
  /** 后端回显的当前页码，用于校准下一页 */
  page: SafeNumber;
}

/** 拉取单页变动记录的入参：每页条数由页面常量统一给出 */
export interface SmsWalletLogRequestParams {
  /** 查询条件 */
  query: SmsWalletLogQuery;
  /** 页码，从 1 开始 */
  page: number;
  /** 取消信号：换 Tab / 卸载时作废在途请求 */
  signal?: AbortSignal;
}
