import React from 'react';
import { IconCheck } from '@pages/memberDetail/components/MemberDetailIcons/MemberDetailIcons';
import styles from '../../SetMembershipModal.module.less';

interface SelectedOption {
  shortLabel: string;
  color: string;
}

interface SetMembershipActionBarProps {
  step: 'select' | 'confirm';
  isSubmitting: boolean;
  isSameAsNow: boolean;
  isLifetime: boolean;
  isFree: boolean;
  multiplier: number;
  selectedOption: SelectedOption;
  onCancel: () => void;
  onConfirm: () => void;
  isConfirmDisabled?: boolean;
}

const getConfirmLabel = (
  isSubmitting: boolean,
  step: 'select' | 'confirm',
  isLifetime: boolean,
  isFree: boolean,
  shortLabel: string,
  multiplier: number,
): string => {
  if (isSubmitting) return '提交中...';
  const prefix = step === 'confirm' ? '确认设置' : '确认选择';
  if (isLifetime) return `${prefix}永久会员`;
  if (isFree) return `${prefix}免费会员`;
  return `${prefix}${shortLabel} × ${multiplier}`;
};

const SetMembershipActionBar: React.FC<SetMembershipActionBarProps> = ({
  step,
  isSubmitting,
  isSameAsNow,
  isLifetime,
  isFree,
  multiplier,
  selectedOption,
  onCancel,
  onConfirm,
  isConfirmDisabled = false,
}) => (
  <div className={styles.sheetActions}>
    <button type="button" className={styles.cancelBtn} onClick={onCancel} disabled={isSubmitting}>
      {step === 'confirm' ? '返回编辑' : '取消'}
    </button>
    <button
      type="button"
      className={styles.confirmBtn}
      style={{
        background: `linear-gradient(135deg, ${selectedOption.color}, ${selectedOption.color}cc)`,
        boxShadow: `0 4px 16px ${selectedOption.color}55`,
      }}
      onClick={onConfirm}
      disabled={(step === 'select' && isSameAsNow) || isSubmitting || isConfirmDisabled}
    >
      <IconCheck />
      {getConfirmLabel(isSubmitting, step, isLifetime, isFree, selectedOption.shortLabel, multiplier)}
    </button>
  </div>
);

export default SetMembershipActionBar;
