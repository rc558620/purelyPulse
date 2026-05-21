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
  multiplier: number;
  selectedOption: SelectedOption;
  onCancel: () => void;
  onConfirm: () => void;
}

const SetMembershipActionBar: React.FC<SetMembershipActionBarProps> = ({
  step,
  isSubmitting,
  isSameAsNow,
  isLifetime,
  multiplier,
  selectedOption,
  onCancel,
  onConfirm,
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
      disabled={(step === 'select' && isSameAsNow) || isSubmitting}
    >
      <IconCheck />
      {isSubmitting
        ? '提交中...'
        : step === 'confirm'
          ? `确认设置${isLifetime ? '永久会员' : `${selectedOption.shortLabel} × ${multiplier}`}`
          : `确认选择${isLifetime ? '永久会员' : `${selectedOption.shortLabel} × ${multiplier}`}`}
    </button>
  </div>
);

export default SetMembershipActionBar;
