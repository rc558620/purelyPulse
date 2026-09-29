// 会员定价类型：首购锁定价、续费价、成交价预览与改价审计记录。
// 从 memberList.types.ts 拆出；金额均为后端算好的展示字符串（元），前端只渲染不换算，
// 数值型字段（额度 / 时间戳）进入 UI 前由映射层经 safeNum 归一。

/** 首购锁定价来源：purchase=商家端下单成交，admin=平台侧设置会员等级成交。 */
export type LockedPriceSource = 'purchase' | 'admin';

/**
 * 成交价快照。
 *
 * 续费定价公式为 `max(当前配置价, 议定价) + 子账号加价`：
 * - 议定价由「调整续费价格」弹窗议定，与配置价**取高者**：低于配置价不生效，
 *   配置价涨过它之后也会自动跟着涨
 * - 子账号加价是标准总价的组成部分，只对年 / 永久档位生效
 * - 成交总额（price）仅用于记账回显，**不参与续费定价**
 *
 * 这里展示运营「当前是什么价、子账号加价补录了没有」，配合重置与补录入口使用。
 */
export interface MemberLockedPrice {
  /** 套餐档位标识（后端 Prisma 档位：monthly / quarterly / yearly / lifetime）。 */
  planId: string;
  /** 档位展示名（永久档位统一展示为 AGES会员）。 */
  planName: string;
  /** 成交总额展示值（元，后端已格式化），仅记账参考。 */
  priceDisplay: string;
  /**
   * 子账号加价展示值（元，后端已格式化）。
   *
   * `null` 表示运营尚未补录：该门店续费会漏掉这部分加价（等于白送子账号），
   * 需要提示运营补录。
   */
  subAccountAmountDisplay: string | null;
  /** 该档位包含的子账号数量；null 表示尚未补录。 */
  subAccountCount: number | null;
  /**
   * 续费价展示值（元，后端已格式化）= (覆盖价 ?? 当前配置价) + 子账号加价。
   *
   * 仅当该档位录了子账号加价或议定了覆盖价时下发，供快照展示「加价 ¥100 = ¥498」。
   */
  renewalPriceDisplay: string | null;
  /** 锁价来源。 */
  source: LockedPriceSource;
  /** 锁价来源展示名。 */
  sourceLabel: string;
  /** 锁定时点（ms）。 */
  lockedAt: number;
}

/**
 * 可调整续费价的档位。
 *
 * ⚠️ 与后端 `PLATFORM_MEMBERSHIP_PLAN_IDS` 对齐，年度档位是 `yearly`
 * 而**不是**会员等级（见 memberList.types.ts 的 `MemberLevel`）里的 `annual`；
 * 直接透传 `annual` 会被后端判为非法档位。免费档位没有续费概念，不参与改价。
 */
export type RenewalPricePlanId = 'monthly' | 'quarterly' | 'yearly' | 'lifetime';

/**
 * 单个档位的续费价现状（「调整续费价格」弹窗的一行）。
 *
 * 所有金额都是后端算好的展示字符串（元），前端只渲染不发算，
 * 保证「运营看到的价 = 门店端展示的价 = 实际扣款」。
 */
export interface MemberRenewalPrice {
  /** 套餐档位标识。 */
  planId: RenewalPricePlanId;
  /** 档位展示名。 */
  planName: string;
  /** 当前配置价展示值（该档位的标准价）。 */
  configPriceDisplay: string;
  /**
   * 本门店该档位**存过的**议定价展示值（入库原值，不代表一定生效）。
   *
   * `null` = 未议定，续费按配置价走。有值时与配置价**取高者**作为定价基数
   * （见 `renewalPriceDisplay`）：低于配置价说明该议定价已被配置价涨过、当期不生效，
   * 回显输入框时要用生效基数而不是这里的原值。
   */
  overridePriceDisplay: string | null;
  /** 计入定价的子账号加价展示值（月 / 季档位恒为 0）。 */
  subAccountAmountDisplay: string;
  /** 最终续费价展示值 = max(配置价, 议定价) + 子账号加价。 */
  renewalPriceDisplay: string;
  /**
   * 是否允许编辑。
   *
   * 含子账号权益的门店，门店端只展示年 / 永久档位，月 / 季改价不会生效，
   * 因此为 false。
   */
  editable: boolean;
  /** 不可编辑的原因文案，可直接展示给运营；可编辑时为 null。 */
  editableReason: string | null;
}

/** 「调整续费价格」提交项：priceDisplay 为空串即清除覆盖、恢复配置价。 */
export interface MemberRenewalPriceUpdateItem {
  planId: RenewalPricePlanId;
  priceDisplay: string;
}

/** 会员成交价预览结果；所有金额都是后端算好的展示字符串，前端不做任何运算。 */
export interface MemberPricingPreview {
  /** 目标档位；免费会员为 null */
  targetPlanId: string | null;
  /** 当前配置价（不含子账号） */
  configPriceDisplay: string;
  /** 参与定价的子账号加价 */
  subAccountAmountDisplay: string;
  /** ★ 下次续费价 = max(配置价, 议定价) + 子账号加价 */
  renewalPriceDisplay: string;
  /** 本次填写的成交金额，仅记账回显；成交价不参与续费定价 */
  dealPriceDisplay: string | null;
}

/**
 * 调整续费价格记录（会员详情「调整续费记录」tab 的一行）。
 *
 * 后端取改价审计（`store_membership_price_override_audits`），
 * 每次改价留一条：谁、什么时候、把哪一档从多少改成了多少。
 * 金额都是后端算好的展示字符串（元），前端只渲染不换算。
 */
export interface MemberRenewalPriceAdjustRecord {
  /** 记录 id。 */
  id: string;
  /** 套餐档位标识（monthly / quarterly / yearly / lifetime）。 */
  planId: string;
  /** 档位展示名。 */
  planName: string;
  /** 调整前的议定价展示值；`null` = 此前未议定。 */
  oldPriceDisplay: string | null;
  /** 调整后的议定价展示值；`null` = 已清除覆盖、恢复默认配置价。 */
  newPriceDisplay: string | null;
  /** 操作人名称；历史数据缺失时为 null。 */
  operatorName: string | null;
  /** 调整时间戳（ms）。 */
  createdAt: number;
}
