/**
 * SetMembershipModal —— 设置会员订阅级别弹窗
 *
 * 功能：
 *  - 选择会员类型：免费 / 月度 / 季度 / 年度 / 永久
 *  - 非永久 & 非免费会员：追加时间（多选期数）
 *  - 永久会员可降级回月度/季度/年度（设置具体时长）
 *  - 年度会员 / 永久会员支持自定义价格（默认取后端套餐配置）
 *  - 实时预览到期日期
 *
 * 本文件只负责组合：状态编排见 hooks/useSetMembershipModal，
 * 草稿状态见 hooks/useMembershipDraft，成交价预览见 hooks/useMembershipPricingPreview，
 * 提交流程见 hooks/useMembershipSubmit。
 */
import React from 'react';
import SetMembershipActionBar from './components/SetMembershipActionBar/SetMembershipActionBar';
import SetMembershipConfirmStep from './components/SetMembershipConfirmStep/SetMembershipConfirmStep';
import SetMembershipHeader from './components/SetMembershipHeader/SetMembershipHeader';
import SetMembershipSelectStep from './components/SetMembershipSelectStep/SetMembershipSelectStep';
import { useSetMembershipModal } from './hooks/useSetMembershipModal';
import type { SetMembershipModalProps } from './SetMembershipModal.types';
import styles from './SetMembershipModal.module.less';

const SetMembershipModal: React.FC<SetMembershipModalProps> = ({
  member,
  memberId,
  currentLevel,
  currentExpiry,
  lifetimeMembershipDays,
  lifetimeMembershipAmountDisplay,
  annualMembershipAmountDisplay,
  onClose,
  onConfirm,
}) => {
  const {
    now,
    isCurrentLifetime,
    currentLevelLabel,
    isConfirmStep,
    draft,
    pricing,
    flow,
    isConfirmDisabled,
  } = useSetMembershipModal({
    memberId,
    currentLevel,
    currentExpiry,
    lifetimeMembershipDays,
    lifetimeMembershipAmountDisplay,
    annualMembershipAmountDisplay,
    onClose,
    onConfirm,
  });

  return (
    <div
      className={styles.overlay}
      role="dialog"
      aria-modal="true"
      aria-label="设置会员等级"
    >
      <div className={styles.sheet}>
        <div className={styles.dragHandle} aria-hidden="true" />

        <SetMembershipHeader
          selectedOption={draft.selectedOption}
          isConfirmStep={isConfirmStep}
          isSubmitting={flow.isSubmitting}
          onClose={flow.handleBack}
        />

        {isConfirmStep ? (
          <SetMembershipConfirmStep
            isLifetime={draft.isLifetime}
            isFree={draft.isFree}
            isCurrentLifetime={isCurrentLifetime}
            selectedOption={draft.selectedOption}
            multiplier={draft.multiplier}
            addedDays={draft.addedDays}
            newExpiry={draft.newExpiry}
            requiresAmountInput={draft.requiresAmountInput}
            amountFieldLabel={draft.amountFieldLabel}
            amountFieldPlaceholder={draft.amountFieldPlaceholder}
            amountDefaultDisplay={draft.amountDefaultDisplay}
            amountInput={draft.amountInput}
            amountError={draft.amountError}
            quotaText={draft.confirmQuotaText}
            onAmountChange={draft.handleAmountChange}
            subAccountCountInput={draft.subAccountCountInput}
            subAccountAmountInput={draft.subAccountAmountInput}
            subAccountAmountError={draft.subAccountAmountError}
            onSubAccountCountChange={draft.handleSubAccountCountChange}
            onSubAccountAmountChange={draft.handleSubAccountAmountChange}
            pricingPreview={pricing.pricingPreview}
            isPreviewPending={pricing.isPreviewPending}
            isDowngradePlan={draft.isDowngradePlan}
            confirmDowngradePlan={draft.confirmDowngradePlan}
            onConfirmDowngradePlanChange={draft.setConfirmDowngradePlan}
            countAsIncome={draft.countAsIncome}
            onCountAsIncomeChange={draft.setCountAsIncome}
          />
        ) : (
          <SetMembershipSelectStep
            member={member}
            currentLevel={currentLevel}
            currentExpiry={currentExpiry}
            currentLevelLabel={currentLevelLabel}
            isCurrentLifetime={isCurrentLifetime}
            selectedDuration={draft.selectedDuration}
            multiplier={draft.multiplier}
            selectedOption={draft.selectedOption}
            isLifetime={draft.isLifetime}
            isFree={draft.isFree}
            addedDays={draft.addedDays}
            newExpiry={draft.newExpiry}
            now={now}
            durationOptions={draft.durationOptions}
            onDurationChange={draft.setSelectedDuration}
            onMultiplierChange={draft.setMultiplier}
            lifetimeMembershipDays={lifetimeMembershipDays}
          />
        )}

        <SetMembershipActionBar
          step={flow.step}
          isSubmitting={flow.isSubmitting}
          isSameAsNow={draft.isSameAsNow}
          isLifetime={draft.isLifetime}
          isFree={draft.isFree}
          multiplier={draft.multiplier}
          selectedOption={draft.selectedOption}
          onCancel={flow.handleBack}
          onConfirm={flow.handlePrimaryAction}
          isConfirmDisabled={isConfirmDisabled}
        />
      </div>
    </div>
  );
};

export default SetMembershipModal;
