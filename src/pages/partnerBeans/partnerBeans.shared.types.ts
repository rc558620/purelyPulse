// partnerBeans 与 memberList 共享类型定义。
import { safeNum } from '@utils/utils';

/** UI 安全数字类型 */
type SafeNumber = ReturnType<typeof safeNum>;

/** 纯利豆记录变动类型。earn=获得，spend=消耗，withdraw=提现；"消耗/提现"tab 合并展示 spend 和 withdraw */
export type BeanChangeType = 'earn' | 'spend' | 'withdraw';

/** 纯利豆记录来源 */
export type BeanSource = 'promo_reward' | 'deduct_payment' | 'withdrawal' | 'admin_adjust';

/** 通用调整方向 */
export type AdjustDir = 'add' | 'subtract';

/** 纯利豆记录 */
export interface BeanRecord {
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
  /** 变动后纯利豆余额 */
  beanBalance: SafeNumber;
  /** 变动数量：正数=获得，负数=消耗/提现 */
  amount: SafeNumber;
  /** 变动类型 */
  type: BeanChangeType;
  /** 变动来源 */
  source: BeanSource;
  /** 变动说明 */
  description: string;
  /** 关联推广记录 ID */
  relatedPromoId?: string;
  /** 关联被推广用户 */
  relatedUser?: string;
  /** 创建时间戳 */
  createdAt: SafeNumber;
}

/** 管理员调整纯利豆入参 */
export interface AdjustBeanPayload {
  /** 用户 ID */
  userId: string;
  /** 正数=增加，负数=减少 */
  delta: SafeNumber;
  /** 调整原因 */
  reason: string;
}

/** 列表/弹窗用户快照 */
export interface UserSnapshot {
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

/** 纯利豆页面概览统计 */
export interface PartnerBeansStats {
  /** 总记录数 */
  totalRecords: SafeNumber;
  /** 管理员调整次数 */
  adminAdjustCount: SafeNumber;
  /** 提现次数 */
  withdrawCount: SafeNumber;
  /** 推广奖励次数 */
  promoRewardCount: SafeNumber;
}
