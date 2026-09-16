// SetSubAccountModal 类型定义：收敛弹窗对外契约。
import type {
  MemberDetail,
  MemberLevel,
  SubAccountCapability,
} from '@pages/memberList/memberList.types';

export interface SetSubAccountModalProps {
  member: MemberDetail;
  currentLevel: MemberLevel;
  currentCapability: SubAccountCapability | undefined;
  isSubmitting: boolean;
  onClose: () => void;
  onConfirm: (quota: number) => Promise<void> | void;
  /** 是否正在重置首购锁定价 */
  isResettingLockedPrice?: boolean;
  /** 重置首购锁定价（弹窗内提供二次确认） */
  onResetLockedPrice?: () => Promise<void> | void;
}
