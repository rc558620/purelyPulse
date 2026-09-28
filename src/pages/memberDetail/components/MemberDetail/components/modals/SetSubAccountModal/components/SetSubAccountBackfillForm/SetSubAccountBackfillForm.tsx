// SetSubAccountBackfillForm：补录子账号加价的内联表单（数量 + 加价 + 确认 / 取消）。
import React from 'react';
import { cx } from '@utils/utils';
import styles from '../../SetSubAccountModal.module.less';

interface SetSubAccountBackfillFormProps {
  /** 子账号数量输入值；留空表示本次不动数量 */
  countValue: string;
  /** 子账号加价输入值；留空提交表示撤销补录 */
  amountValue: string;
  isAmountEmpty: boolean;
  /** 加价是否通过后端格式校验，非法时禁用提交 */
  isAmountValid: boolean;
  isSubmitting: boolean;
  isBackfillingSubAccount: boolean;
  onCountChange: (value: string) => void;
  onAmountChange: (value: string) => void;
  onSubmit: () => void;
  onCancel: () => void;
}

const SetSubAccountBackfillForm: React.FC<SetSubAccountBackfillFormProps> = ({
  countValue,
  amountValue,
  isAmountEmpty,
  isAmountValid,
  isSubmitting,
  isBackfillingSubAccount,
  onCountChange,
  onAmountChange,
  onSubmit,
  onCancel,
}) => {
  // 留空 = 撤销操作，用次级按钮样式；有值才是绿色主操作
  const submitBtnClassName = cx(
    isAmountEmpty && styles.lockedPriceMiniCancel,
    !isAmountEmpty && styles.lockedPriceMiniConfirm,
  );

  return (
    <div className={styles.lockedPriceBackfillForm}>
      <input
        type="text"
        inputMode="numeric"
        className={styles.lockedPriceBackfillInput}
        placeholder="数量"
        aria-label="子账号数量"
        value={countValue}
        onChange={(event) => onCountChange(event.target.value)}
      />
      <input
        type="text"
        inputMode="decimal"
        className={styles.lockedPriceBackfillInput}
        placeholder="加价（元）"
        aria-label="子账号加价"
        value={amountValue}
        onChange={(event) => onAmountChange(event.target.value)}
      />
      <button
        type="button"
        className={submitBtnClassName}
        onClick={onSubmit}
        disabled={isSubmitting || isBackfillingSubAccount || !isAmountValid}
      >
        {isBackfillingSubAccount ? '提交中...' : isAmountEmpty ? '撤销补录' : '确认'}
      </button>
      <button
        type="button"
        className={styles.lockedPriceMiniCancel}
        onClick={onCancel}
        disabled={isBackfillingSubAccount}
      >
        取消
      </button>
    </div>
  );
};

export default SetSubAccountBackfillForm;
