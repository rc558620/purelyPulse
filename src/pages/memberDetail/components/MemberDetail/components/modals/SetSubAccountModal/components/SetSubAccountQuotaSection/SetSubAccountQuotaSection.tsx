// SetSubAccountQuotaSection：承载配额输入与关闭/恢复交互区块。
import React from 'react';
import { cx, safeNum } from '@utils/utils';
import { Input } from '@components/form/Input/Input';
import {
  IconCheck,
  IconSlotGrid,
} from '@pages/memberDetail/components/MemberDetailIcons/MemberDetailIcons';
import styles from '../../SetSubAccountModal.module.less';

interface SetSubAccountQuotaSectionProps {
  isEligible: boolean;
  isZeroSelected: boolean;
  selectedQuota: number;
  inputValue: string;
  quotaMax: number;
  onToggleClose: () => void;
  onInputChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onInputBlur: () => void;
  onInputFocus: () => void;
}

const getQuotaHintText = (isEligible: boolean, isZeroSelected: boolean, selectedQuota: number): string => {
  if (isZeroSelected) {
    return '当前设置为关闭子账号，员工将只能使用主账号完成交班';
  }

  if (isEligible) {
    return `已选 ${safeNum(selectedQuota)} 个子账号槽位，商家可在 purelyProfit 端为员工分配角色`;
  }

  return '请先升级至年会员或永久会员以开通子账号';
};

const SetSubAccountQuotaSection: React.FC<SetSubAccountQuotaSectionProps> = ({
  isEligible,
  isZeroSelected,
  selectedQuota,
  inputValue,
  quotaMax,
  onToggleClose,
  onInputChange,
  onInputBlur,
  onInputFocus,
}) => (
  <div className={styles.quotaSelector}>
    <div className={styles.sectionLabel}>
      <IconSlotGrid width={14} height={14} />
      子账号数量
      <span className={styles.sectionLabelSub}>
        {isEligible ? `可选 0~${quotaMax} 个` : '需年/永久会员'}
      </span>
    </div>

    <div className={styles.quotaModeRow}>
      <button
        type="button"
        className={cx(
          styles.quotaModeBtn,
          isZeroSelected && styles.quotaModeBtnActiveOff,
          !isZeroSelected && isEligible && styles.quotaModeBtnActiveOn,
        )}
        onClick={onToggleClose}
        aria-pressed={isZeroSelected}
        aria-label={isZeroSelected ? '恢复子账号' : '关闭子账号'}
      >
        {isZeroSelected ? (
          <span className={cx(styles.quotaItemCheck, styles.quotaItemCheckZero)} aria-hidden="true">
            <IconCheck width={9} height={9} strokeWidth={3} />
          </span>
        ) : null}
        <span className={styles.quotaModeBtnLabel}>关闭</span>
      </button>

      <div className={styles.quotaInputWrap}>
        <Input
          type="number"
          min={1}
          max={quotaMax}
          step={1}
          value={inputValue}
          onChange={onInputChange}
          onBlur={onInputBlur}
          onFocus={onInputFocus}
          disabled={!isEligible}
          placeholder={isEligible ? `1 ~ ${quotaMax}` : '—'}
          aria-label="子账号数量"
          suffix={
            <span
              className={cx(
                styles.inputSuffixUnit,
                !isZeroSelected && isEligible && styles.inputSuffixUnitActive,
              )}
            >
              个
            </span>
          }
          wrapperClassName={cx(
            styles.quotaInput,
            !isZeroSelected && isEligible && styles.quotaInputActive,
            isZeroSelected && styles.quotaInputOff,
            !isEligible && styles.quotaInputDisabled,
          )}
        />
      </div>
    </div>

    <p
      className={cx(
        styles.quotaHint,
        !isZeroSelected && isEligible && styles.quotaHintActive,
        isZeroSelected && styles.quotaHintWarning,
      )}
    >
      {getQuotaHintText(isEligible, isZeroSelected, selectedQuota)}
    </p>
  </div>
);

export default SetSubAccountQuotaSection;
