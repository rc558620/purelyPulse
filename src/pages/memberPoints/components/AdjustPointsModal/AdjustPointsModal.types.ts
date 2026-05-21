// 积分调整弹窗类型：承载弹窗对外 props 与样式变量定义。
import { safeNum } from '@utils/utils';
import type { CSSProperties } from 'react';
import type { MemberPointsAdjustDir, MemberPointsPageUser } from '../../memberPoints.types';

/** UI 安全数字类型 */
type SafeNumber = ReturnType<typeof safeNum>;

export interface AdjustPointsModalProps {
  user: MemberPointsPageUser;
  onClose: () => void;
  onConfirm: (userId: string, delta: SafeNumber, reason: string) => Promise<void> | void;
  /** 外部提交中态（由页面 hook 控制） */
  isSubmitting?: boolean;
}

export interface AdjustPointsDirOption {
  value: MemberPointsAdjustDir;
  label: string;
  sign: string;
  color: string;
}

export interface AdjustPointsDirButtonStyle extends CSSProperties {
  '--dir-color'?: string;
  '--dir-color-bg'?: string;
}

export interface AdjustPointsDirSignStyle extends CSSProperties {
  '--sign-color'?: string;
}
