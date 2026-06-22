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
