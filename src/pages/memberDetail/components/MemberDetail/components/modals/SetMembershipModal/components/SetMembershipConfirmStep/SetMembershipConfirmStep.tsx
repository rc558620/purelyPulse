import React from 'react';
import Checkbox from '@components/form/Checkbox/Checkbox';
import { Input } from '@components/form/Input/Input';
import { IconCircleChevronUp, IconWarningTriangle } from '@pages/memberDetail/components/MemberDetailIcons/MemberDetailIcons';
import type { MemberPricingPreview } from '@pages/memberList/memberList.service';
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
  /** 新用户额度说明文案（免费会员为「新用户额度清零」） */
  quotaText: string;
  onAmountChange: (value: string) => void;
  formatMembershipExpiry: (timestamp: number) => string;
  // ─── 子账号与成交价预览 ───
  /** 子账号数量草稿（字符串，不做数值运算） */
  subAccountCountInput: string;
  /** 子账号加价草稿（元字符串） */
  subAccountAmountInput: string;
  /** 子账号加价格式错误文案；空串表示合法 */
  subAccountAmountError?: string;
  onSubAccountCountChange: (value: string) => void;
  onSubAccountAmountChange: (value: string) => void;
  /** 后端算好的成交价预览；未加载完成为 null */
  pricingPreview: MemberPricingPreview | null;
  /** 预览请求是否在途（防抖等待中或请求中） */
  isPreviewPending: boolean;
  /** 所选档位是否低于当前档位 */
  isDowngradePlan: boolean;
  /** 是否勾选「同时降级」 */
  confirmDowngradePlan: boolean;
  onConfirmDowngradePlanChange: (value: boolean) => void;
  /** 是否勾选「计入收入」；不勾选按赠送处理 */
  countAsIncome: boolean;
  onCountAsIncomeChange: (value: boolean) => void;
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
  quotaText,
  onAmountChange,
  formatMembershipExpiry,
  subAccountCountInput,
  subAccountAmountInput,
  subAccountAmountError = '',
  onSubAccountCountChange,
  onSubAccountAmountChange,
  pricingPreview,
  isPreviewPending,
  isDowngradePlan,
  confirmDowngradePlan,
  onConfirmDowngradePlanChange,
  countAsIncome,
  onCountAsIncomeChange,
}) => {
  const downgradeRowEl = isDowngradePlan ? (
    <label className={styles.confirmDowngradeRow}>
      <Checkbox
        checked={confirmDowngradePlan}
        onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
          onConfirmDowngradePlanChange(event.target.checked)
        }
      />
      <span>同时降级为{selectedOption.label}</span>
    </label>
  ) : null;

  const incomeRowEl = !isFree ? (
    <label className={styles.confirmIncomeRow}>
      <Checkbox
        checked={countAsIncome}
        onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
          onCountAsIncomeChange(event.target.checked)
        }
      />
      <span>
        计入收入
        <span className={styles.confirmIncomeHint}>
          {countAsIncome
            ? requiresAmountInput
              ? '按成交价计入平台营收'
              : `按所选${selectedOption.label}的后台配置价计入平台营收`
            : '不计入营收，按赠送处理（记录里标注「赠送」）'}
        </span>
      </span>
    </label>
  ) : null;

  // 无金额输入时两个勾选卡片相邻，并排一行；需要填金额时保持各自独立
  const combineChoiceRow = isDowngradePlan && !isFree && !requiresAmountInput;

  return (
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
        <div className={styles.summaryDivider} />
        <div className={styles.summaryRow}>
          <span className={styles.summaryLabel}>新用户额度</span>
          <span className={styles.summaryValue}>{quotaText}</span>
        </div>
      </div>

      {isDowngradePlan ? (
        <>
          <div className={styles.confirmWarning}>
            <IconWarningTriangle width={16} height={16} strokeWidth={2} />
            <p>
              当前会员档位高于所选档位，默认<strong>保持原档位</strong>，仅追加 {addedDays} 天时长。
              已开通子账号的门店一旦降档，会员将买不回原档位。
            </p>
          </div>
          {combineChoiceRow ? (
            <div className={styles.confirmChoiceRow}>
              {downgradeRowEl}
              {incomeRowEl}
            </div>
          ) : (
            downgradeRowEl
          )}
        </>
      ) : null}

      {requiresAmountInput ? (
        <div className={styles.confirmSubAccountFields}>
          <div className={styles.confirmSubAccountField}>
            <label className={styles.fieldLabel} htmlFor="sub-account-count">
              子账号数量
            </label>
            <Input
              id="sub-account-count"
              type="text"
              inputMode="numeric"
              placeholder="0"
              value={subAccountCountInput}
              onChange={(event) => onSubAccountCountChange(event.target.value.replace(/[^\d]/g, ''))}
              wrapperClassName={styles.confirmSubAccountInput}
            />
          </div>
          <div className={styles.confirmSubAccountField}>
            <label className={styles.fieldLabel} htmlFor="sub-account-amount">
              子账号加价
              <span className={styles.fieldLabelSub}>（单位：元，续费时锁定不随调价变动）</span>
            </label>
            <Input
              id="sub-account-amount"
              type="text"
              inputMode="decimal"
              placeholder="0"
              value={subAccountAmountInput}
              status={subAccountAmountError ? 'error' : undefined}
              onChange={(event) => onSubAccountAmountChange(event.target.value.replace(/[^\d.]/g, ''))}
              wrapperClassName={styles.confirmSubAccountInput}
            />
            {subAccountAmountError ? (
              <span className={styles.confirmAmountError}>{subAccountAmountError}</span>
            ) : null}
          </div>
        </div>
      ) : null}

      {requiresAmountInput ? (
        <div className={styles.confirmAmountField}>
          <label className={styles.fieldLabel} htmlFor="custom-membership-price">
            {amountFieldLabel}
            <span className={styles.fieldLabelSub}>
              （单位：元，默认取后端配置 ¥{amountDefaultDisplay}；仅本次成交记账，续费按后台配置价）
            </span>
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
            <span className={styles.confirmAmountHint}>不影响后续续费价</span>
            {amountError ? <span className={styles.confirmAmountError}>{amountError}</span> : null}
          </div>
        </div>
      ) : null}

      {/* 是否计入收入：不勾选 = 按赠送处理，金额落 0 且不计入平台营收 */}
      {!combineChoiceRow ? incomeRowEl : null}

      {requiresAmountInput ? (
        <div className={styles.confirmPricingPreview}>
          {pricingPreview ? (
            <>
              <div className={styles.pricingPreviewRow}>
                <span className={styles.pricingPreviewLabel}>下次续费价</span>
                <span className={styles.pricingPreviewStrong}>
                  ¥{pricingPreview.renewalPriceDisplay}
                </span>
              </div>
              <div className={styles.pricingPreviewSub}>
                配置价 ¥{pricingPreview.configPriceDisplay} ＋ 子账号加价 ¥
                {pricingPreview.subAccountAmountDisplay}；成交价不参与续费定价
              </div>
            </>
          ) : (
            // 防抖等待 / 请求失败都要有交代：空白会被读成「没有补款」
            <span
              className={
                isPreviewPending
                  ? styles.pricingPreviewPending
                  : styles.pricingPreviewUnavailable
              }
            >
              {isPreviewPending
                ? '价格计算中…'
                : '价格预览暂不可用，请以线下核价为准'}
            </span>
          )}
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
};

export default SetMembershipConfirmStep;
