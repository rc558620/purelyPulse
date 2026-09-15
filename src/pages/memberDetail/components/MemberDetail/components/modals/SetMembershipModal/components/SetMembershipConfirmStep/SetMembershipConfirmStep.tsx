import React from 'react';
import { Input } from '@components/form/Input/Input';
import { IconCircleChevronUp, IconWarningTriangle } from '@pages/memberDetail/components/MemberDetailIcons/MemberDetailIcons';
// fenToYuan 已删除：前端不做分转元转换。金额展示值由后端直接返回 xxxDisplay 字段。
import styles from '../../SetMembershipModal.module.less';

interface SelectedOption {
  label: string;
  color: string;
}

interface SetMembershipConfirmStepProps {
  isLifetime: boolean;
  isFree: boolean;
  isCurrentLifetime: boolean;
  selectedOption: SelectedOption;
  multiplier: number;
  addedDays: number;
  newExpiry: number | null;
  /** 是否需要填写自定义价格（年度会员 / 永久会员）。 */
  requiresAmountInput: boolean;
  amountFieldLabel: string;
  amountFieldPlaceholder: string;
  amountDefaultDisplay: string;
  amountInput: string;
  amountError: string;
  onAmountChange: (value: string) => void;
  formatMembershipExpiry: (timestamp: number) => string;
}

const SetMembershipConfirmStep: React.FC<SetMembershipConfirmStepProps> = ({
  isLifetime,
  isFree,
  isCurrentLifetime,
  selectedOption,
  multiplier,
  addedDays,
  newExpiry,
  requiresAmountInput,
  amountFieldLabel,
  amountFieldPlaceholder,
  amountDefaultDisplay,
  amountInput,
  amountError,
  onAmountChange,
  formatMembershipExpiry,
}) => (
  <div className={styles.sheetBody}>
    <div className={styles.confirmContent}>
      <div className={styles.confirmIcon} style={{ color: selectedOption.color }} aria-hidden="true">
        <IconCircleChevronUp width={48} height={48} strokeWidth={1.5} />
      </div>
      <h2 className={styles.confirmTitle}>确认操作</h2>
      <p className={styles.confirmDesc}>您即将设置用户会员等级，请确认以下信息无误：</p>

      <div
        className={styles.confirmSummary}
        style={{ borderColor: `${selectedOption.color}33`, background: `${selectedOption.color}08` }}
      >
        {isFree ? (
          <>
            <div className={styles.summaryRow}>
              <span className={styles.summaryLabel}>设置类型</span>
              <span
                className={styles.summaryValue}
                style={{
                  background: `${selectedOption.color}20`,
                  color: selectedOption.color,
                  borderColor: `${selectedOption.color}40`,
                }}
              >
                {selectedOption.label}
              </span>
            </div>
            <div className={styles.summaryDivider} />
            <div className={styles.summaryRow}>
              <span className={styles.summaryLabel}>会员状态</span>
              <span className={styles.summaryValue} style={{ color: selectedOption.color, fontWeight: 800 }}>
                基础权益
              </span>
            </div>
            <div className={styles.summaryDivider} />
            <div className={styles.summaryRow}>
              <span className={styles.summaryLabel}>到期时间</span>
              <span className={styles.summaryValue}>无到期限制</span>
            </div>
          </>
        ) : isLifetime ? (
          <>
            <div className={styles.summaryRow}>
              <span className={styles.summaryLabel}>设置类型</span>
              <span
                className={styles.summaryValue}
                style={{
                  background: `${selectedOption.color}20`,
                  color: selectedOption.color,
                  borderColor: `${selectedOption.color}40`,
                }}
              >
                {selectedOption.label}
              </span>
            </div>
            <div className={styles.summaryDivider} />
            <div className={styles.summaryRow}>
              <span className={styles.summaryLabel}>有效期天数</span>
              <span className={styles.summaryValue} style={{ color: selectedOption.color, fontWeight: 800 }}>
                +{addedDays} 天
              </span>
            </div>
            <div className={styles.summaryDivider} />
            <div className={styles.summaryRow}>
              <span className={styles.summaryLabel}>新到期日期</span>
              <span className={styles.summaryValue}>{newExpiry ? formatMembershipExpiry(newExpiry) : '—'}</span>
            </div>
          </>
        ) : (
          <>
            <div className={styles.summaryRow}>
              <span className={styles.summaryLabel}>设置类型</span>
              <span
                className={styles.summaryValue}
                style={{
                  background: `${selectedOption.color}20`,
                  color: selectedOption.color,
                  borderColor: `${selectedOption.color}40`,
                }}
              >
                {selectedOption.label} × {multiplier}
              </span>
            </div>
            <div className={styles.summaryDivider} />
            <div className={styles.summaryRow}>
              <span className={styles.summaryLabel}>追加天数</span>
              <span className={styles.summaryValue} style={{ color: selectedOption.color, fontWeight: 800 }}>
                +{addedDays} 天
              </span>
            </div>
            <div className={styles.summaryDivider} />
            <div className={styles.summaryRow}>
              <span className={styles.summaryLabel}>新到期日期</span>
              <span className={styles.summaryValue}>{newExpiry ? formatMembershipExpiry(newExpiry) : '—'}</span>
            </div>
          </>
        )}
      </div>

      {requiresAmountInput ? (
        <div className={styles.confirmAmountField}>
          <label className={styles.fieldLabel} htmlFor="custom-membership-price">
            {amountFieldLabel}
            <span className={styles.fieldLabelSub}>（单位：元，默认取后端配置 ¥{amountDefaultDisplay}）</span>
          </label>
          <Input
            id="custom-membership-price"
            type="text"
            inputMode="decimal"
            placeholder={amountFieldPlaceholder}
            value={amountInput}
            status={amountError ? 'error' : undefined}
            onChange={(event) => onAmountChange(event.target.value.replace(/[^\d.]/g, ''))}
            wrapperClassName={styles.confirmAmountInput}
          />
          <div className={styles.confirmAmountHintRow}>
            <span className={styles.confirmAmountHint}>将按该价格计入充值收入</span>
            {amountError ? <span className={styles.confirmAmountError}>{amountError}</span> : null}
          </div>
        </div>
      ) : null}

      {isFree ? (
        <div className={styles.confirmWarning}>
          <IconWarningTriangle width={16} height={16} strokeWidth={2} />
          <p>设置为免费会员后，当前订阅权益将立即停止，请谨慎操作</p>
        </div>
      ) : isCurrentLifetime && !isLifetime ? (
        <div className={styles.confirmWarning}>
          <IconWarningTriangle width={16} height={16} strokeWidth={2} />
          <p>当前为永久会员，降级后账户到期需要续期</p>
        </div>
      ) : null}
    </div>
  </div>
);

export default SetMembershipConfirmStep;
