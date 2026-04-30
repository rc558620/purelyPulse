// ─── 会员积分 / 纯利豆管理模块 — 类型定义 ────────────────────────────

// ─── 积分体系 ────────────────────────────────────────────────────────

/** 积分变动类型 */
export type PointsChangeType = 'earn' | 'spend' | 'expire';

/** 积分来源 */
export type PointsSource =
  | 'purchase_bonus'  // 充值购买奖励
  | 'deduct_payment'  // 抵扣支付消耗
  | 'admin_adjust'    // 管理员手动调整
  | 'expire';         // 积分过期

/** 积分记录 */
export interface PointsRecord {
  id: string;
  /** 用户 ID */
  userId: string;
  /** 用户姓名（脱敏） */
  userName: string;
  /** 用户手机（脱敏） */
  userPhone: string;
  /** 变动数量：正数=获得，负数=消耗/扣除 */
  amount: number;
  type: PointsChangeType;
  source: PointsSource;
  /** 变动说明 */
  description: string;
  createdAt: number;
  /** 积分过期时间（可选） */
  expireAt?: number;
}

/** 管理员调整积分的入参 */
export interface AdjustPointsPayload {
  userId: string;
  /** 正数=增加，负数=减少 */
  delta: number;
  reason: string;
}

// ─── 纯利豆体系 ──────────────────────────────────────────────────────

/** 纯利豆变动类型 */
export type BeanChangeType = 'earn' | 'spend' | 'withdraw';

/** 纯利豆来源 */
export type BeanSource =
  | 'promo_reward'    // 推广奖励
  | 'deduct_payment'  // 抵扣充值费用
  | 'withdrawal'      // 提现扣除
  | 'admin_adjust';   // 管理员手动调整

/** 纯利豆记录 */
export interface BeanRecord {
  id: string;
  /** 用户 ID */
  userId: string;
  /** 用户姓名（脱敏） */
  userName: string;
  /** 用户手机（脱敏） */
  userPhone: string;
  /** 变动数量：正数=获得，负数=消耗/提现 */
  amount: number;
  type: BeanChangeType;
  source: BeanSource;
  /** 变动说明 */
  description: string;
  /** 关联推广记录 ID */
  relatedPromoId?: string;
  /** 关联被推广用户 */
  relatedUser?: string;
  createdAt: number;
}

/** 管理员调整纯利豆的入参 */
export interface AdjustBeanPayload {
  userId: string;
  /** 正数=增加，负数=减少 */
  delta: number;
  reason: string;
}

// ─── 通用 ─────────────────────────────────────────────────────────────

/** 积分/纯利豆调整方向 */
export type AdjustDir = 'add' | 'subtract';

/** 用户信息快照（列表/弹窗中使用） */
export interface UserSnapshot {
  id: string;
  name: string;
  phone: string;
  /** 当前积分余额 */
  availablePoints: number;
  /** 当前纯利豆余额 */
  beanBalance: number;
  /** 是否是合伙人 */
  isPartner: boolean;
}
