// SetSubAccountModal 类型定义：收敛弹窗对外契约。
import type { MemberDetail, MemberLevel, SubAccountCapability } from '@pages/memberList/memberList.types';
import type { MemberLockedPrice } from '@pages/memberList/memberList.pricing.types';

export interface SetSubAccountModalProps {
  member: MemberDetail;
  currentLevel: MemberLevel;
  currentCapability: SubAccountCapability | undefined;
  isSubmitting: boolean;
  onClose: () => void;
  onConfirm: (quota: number) => Promise<void> | void;
  /** 是否正在重置成交价快照 */
  isResettingLockedPrice?: boolean;
  /** 重置成交价快照（弹窗内提供二次确认） */
  onResetLockedPrice?: () => Promise<void> | void;
  /** 是否正在补录子账号加价 */
  isBackfillingSubAccount?: boolean;
  /**
   * 补录某档位的子账号加价。返回是否成功——失败时弹窗保留内联表单，不丢运营的输入。
   *
   * 存量门店成交时还没拆分口径，成交总额是对的、缺的只是「子账号那部分值多少」，
   * 不补录的话配置价一旦涨过成交总额，子账号就白送了。
   * 传空字符串即撤销补录；`subAccountCount` 省略表示不动数量。
   */
  onBackfillSubAccountAmount?: (
    item: MemberLockedPrice,
    payload: { subAccountCount?: number; subAccountAmountDisplay: string },
  ) => Promise<boolean> | boolean;
}
