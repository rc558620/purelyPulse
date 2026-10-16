// partnerBeans 页面共享类型定义。
import type { BeanRecord, BeanSource, PartnerBeansStats, UserSnapshot } from './partnerBeans.shared.types';

export type PartnerBeansFilterTab = 'all' | 'admin' | 'earn' | 'spend';

export interface PartnerBeansTabOption {
  /** Tab 值 */
  value: PartnerBeansFilterTab;
  /** Tab 文案 */
  label: string;
}

/** 纯利豆流水查询条件：Tab 与关键词全部下推后端，前端不再对已加载页做本地过滤。 */
export interface PartnerBeansRecordQuery {
  /** 当前筛选 Tab */
  tab: PartnerBeansFilterTab;
  /** 搜索关键词（合伙人姓名 / 手机号 / 流水说明） */
  keyword: string;
  /** 单合伙人（门店）过滤：余额一览点击进入单合伙人变动记录时下发；null = 全部合伙人 */
  storeId: string | null;
}

/** 合伙人余额一览单页结果（页码分页）。 */
export interface PartnerBeansUserPage {
  /** 本页合伙人快照 */
  users: PartnerBeansPageUser[];
  /** 当前关键词下的合伙人总数（后端口径） */
  total: number;
  /** 是否还有下一页 */
  hasMore: boolean;
  /** 下一页页码，没有更多时为 null */
  nextPage: number | null;
}

/** 拉取单页合伙人余额一览的入参：每页条数由页面常量统一给出。 */
export interface PartnerBeansUserRequestParams {
  /** 搜索关键词（合伙人姓名 / 手机号） */
  keyword: string;
  /** 页码，从 1 开始 */
  page: number;
  /** 取消信号：换条件 / 卸载时作废在途请求 */
  signal?: AbortSignal;
}

/** 纯利豆流水单页结果（游标分页）。 */
export interface PartnerBeansRecordPage {
  /** 本页流水 */
  records: PartnerBeansPageRecord[];
  /** 后端按当前筛选的完整结果集计算的统计（与分页无关） */
  stats: PartnerBeansPageStats;
  /** 是否还有下一页 */
  hasMore: boolean;
  /** 下一页游标，没有更多时为 null */
  nextCursor: string | null;
}

/** 拉取单页流水的入参：每页条数由页面常量统一给出，避免分页口径散落到调用方。 */
export interface PartnerBeansRecordRequestParams {
  /** 查询条件 */
  query: PartnerBeansRecordQuery;
  /** 游标，null 表示拉第一页 */
  cursor: string | null;
  /** 合伙人快照：用于回填流水行的余额与头像 */
  users: PartnerBeansPageUser[];
  /** 取消信号：换条件 / 卸载时作废在途请求，避免旧响应回写与带宽浪费 */
  signal?: AbortSignal;
}

export interface PartnerBeansRecordMeta {
  /** 数量样式类名 */
  amountClassName: string;
  /** 图标样式类名 */
  iconClassName: string;
  /** 图标类型 */
  iconType: 'earn' | 'withdraw' | 'spend';
}

export type PartnerBeansPageRecord = BeanRecord;
export type PartnerBeansPageUser = UserSnapshot;
export type PartnerBeansPageStats = PartnerBeansStats;
export type PartnerBeansPageSource = BeanSource;
