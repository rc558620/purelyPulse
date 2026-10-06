// memberPoints 页面共享类型定义。
import { safeNum } from '@utils/utils';

/** UI 安全数字类型 */
type SafeNumber = ReturnType<typeof safeNum>;

/** 积分记录变动类型 */
export type MemberPointsChangeType = 'earn' | 'spend' | 'expire';

/** 积分记录来源 */
export type MemberPointsSource = 'purchase_bonus' | 'deduct_payment' | 'admin_adjust' | 'expire';

/** 积分调整方向 */
export type MemberPointsAdjustDir = 'add' | 'subtract';

/** 会员积分记录 */
export interface MemberPointsRecord {
  /** 记录 ID */
  id: string;
  /** 用户 ID */
  userId: string;
  /** 用户姓名（脱敏） */
  userName: string;
  /** 用户手机（脱敏） */
  userPhone: string;
  /** 用户头像 URL */
  avatarUrl?: string;
  /** 变动前可用积分余额 */
  availablePoints: SafeNumber;
  /** 变动数量：正数=获得，负数=消耗/扣除 */
  amount: SafeNumber;
  /** 变动类型 */
  type: MemberPointsChangeType;
  /** 变动来源 */
  source: MemberPointsSource;
  /** 变动说明 */
  description: string;
  /** 创建时间戳 */
  createdAt: SafeNumber;
  /** 积分过期时间（可选） */
  expireAt?: SafeNumber;
}

/** 管理员调整积分入参 */
export interface AdjustPointsPayload {
  /** 用户 ID */
  userId: string;
  /** 正数=增加，负数=减少 */
  delta: SafeNumber;
  /** 调整原因 */
  reason: string;
}

/** 用户信息快照（列表/弹窗中使用） */
export interface MemberPointsPageUser {
  /** 用户 ID */
  id: string;
  /** 用户姓名 */
  name: string;
  /** 用户手机号 */
  phone: string;
  /** 当前积分余额 */
  availablePoints: SafeNumber;
  /** 当前纯利豆余额 */
  beanBalance: SafeNumber;
  /** 是否是合伙人 */
  isPartner: boolean;
  /** 用户头像 URL */
  avatarUrl?: string;
}

/** 页面概览统计 */
export interface MemberPointsStats {
  /** 总记录数 */
  totalRecords: SafeNumber;
  /** 管理员调整次数 */
  adminAdjustCount: SafeNumber;
  /** 今日变动次数 */
  todayChangeCount: SafeNumber;
}

/** 页面筛选项值 */
export type MemberPointsFilterTab = 'all' | 'admin' | 'earn' | 'spend';

/** 页面筛选项 */
export interface MemberPointsTabOption {
  /** Tab 值 */
  value: MemberPointsFilterTab;
  /** Tab 文案 */
  label: string;
}

/** 积分流水查询条件：Tab 与关键词全部下推后端，前端不再对已加载页做本地过滤。 */
export interface MemberPointsRecordQuery {
  /** 当前筛选 Tab */
  tab: MemberPointsFilterTab;
  /** 搜索关键词（会员姓名 / 手机号 / 流水说明） */
  keyword: string;
}

/** 积分流水单页结果（游标分页）。 */
export interface MemberPointsRecordPage {
  /** 本页流水 */
  records: MemberPointsRecord[];
  /** 后端按当前筛选的完整结果集计算的统计（与分页无关） */
  stats: MemberPointsStats;
  /** 是否还有下一页 */
  hasMore: boolean;
  /** 下一页游标，没有更多时为 null */
  nextCursor: string | null;
}

/** 拉取单页流水的入参：每页条数由页面常量统一给出，避免分页口径散落到调用方。 */
export interface MemberPointsRecordRequestParams {
  /** 查询条件 */
  query: MemberPointsRecordQuery;
  /** 游标，null 表示拉第一页 */
  cursor: string | null;
  /** 会员快照：用于回填流水行的头像与可用积分 */
  users: MemberPointsPageUser[];
  /** 取消信号：换条件 / 卸载时作废在途请求，避免旧响应回写与带宽浪费 */
  signal?: AbortSignal;
}
