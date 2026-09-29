// SetMembershipModal 类型定义：收敛弹窗对外契约与内部共享结构。
import type { MemberDetail, MemberLevel, MembershipDuration } from '@pages/memberList/memberList.types';

/** 弹窗内部使用的选择类型，扩展了 free */
export type ModalMembershipSelection = MembershipDuration | 'free';

/** 弹窗步骤：先选档位，再确认信息 */
export type SetMembershipStep = 'select' | 'confirm';

/** 档位卡片选项 */
export interface DurationOption {
  value: ModalMembershipSelection;
  label: string;
  shortLabel: string;
  desc: string;
  /** 新用户额度说明文案，展示在 desc（xxx 天订阅）下一行 */
  quotaText: string;
  /** 每期赠送的新客额度（位），与后端 PLAN_QUOTA_GRANT 对齐 */
  quotaPerPeriod: number;
  daysBase: number;
  color: string;
  gradientFrom: string;
  gradientTo: string;
}

/** 追加期数选项 */
export interface MultiplierOption {
  value: number;
  label: string;
}

/** onConfirm 的附加参数 */
export interface MembershipConfirmOptions {
  amountDisplay?: string;
  subAccountCount?: number;
  subAccountAmountDisplay?: string;
  confirmDowngradePlan?: boolean;
  countAsIncome?: boolean;
  /** 期数：追加时长与新客额度都按它叠加（年度 × 2 = 730 天 / 600 位新客） */
  multiplier?: number;
}

export interface SetMembershipModalProps {
  member: MemberDetail;
  currentLevel: MemberLevel;
  currentExpiry: number | null | undefined;
  lifetimeMembershipDays: number;
  lifetimeMembershipAmountDisplay: string;
  annualMembershipAmountDisplay: string;
  onClose: () => void;
  /** 会员 ID，用于向后端请求成交价预览 */
  memberId: string;
  onConfirm: (
    newLevel: MemberLevel,
    newExpiry: number | null,
    options?: MembershipConfirmOptions,
  ) => Promise<void> | void;
}
