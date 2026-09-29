import type { MemberLevel } from '@pages/memberList/memberList.types';
import type {
  MemberRenewalPrice,
  MemberRenewalPriceUpdateItem,
  RenewalPricePlanId,
} from '@pages/memberList/memberList.pricing.types';

export interface RenewalPriceModalProps {
  /** 目标会员 id，用于读写该会员的续费价覆盖。 */
  memberId: string;
  /** 会员姓名，用于标题下的身份提示。 */
  memberName: string;
  /** 当前会员等级，用于高亮「当前档位」。 */
  currentLevel: MemberLevel;
  /** 外部提交中（与其它弹窗动作互斥），用于禁用交互。 */
  isSubmitting: boolean;
  onClose: () => void;
  /**
   * 提交改动。
   *
   * 成功返回后端算好的最新列表（弹窗就地刷新，运营可以接着调别的档位，不必重开）；
   * 失败返回 null，弹窗保留当前草稿，错误提示由调用方弹出。
   */
  onSubmit: (items: MemberRenewalPriceUpdateItem[]) => Promise<MemberRenewalPrice[] | null>;
}

export interface RenewalPriceRowProps {
  /** 该档位的续费价现状。 */
  item: MemberRenewalPrice;
  /** 输入草稿值（空串 = 未覆盖）。 */
  value: string;
  /** 是否当前会员所属档位。 */
  isCurrentPlan: boolean;
  /** 输入格式是否非法。 */
  isInvalid: boolean;
  /** 是否禁用交互（加载中 / 提交中）。 */
  isDisabled: boolean;
  onValueChange: (planId: RenewalPricePlanId, value: string) => void;
  /** 清空该档位覆盖价，恢复按配置价续费。 */
  onClear: (planId: RenewalPricePlanId) => void;
}
