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
}
