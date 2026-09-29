// SetSubAccountModal：编排子账号配额弹窗状态与提交流程。
import React, { useCallback, useEffect } from 'react';
import SetSubAccountCapabilityCard from './components/SetSubAccountCapabilityCard/SetSubAccountCapabilityCard';
import SetSubAccountChangeBanner from './components/SetSubAccountChangeBanner/SetSubAccountChangeBanner';
import SetSubAccountEligibilityBanner from './components/SetSubAccountEligibilityBanner/SetSubAccountEligibilityBanner';
import SetSubAccountFooter from './components/SetSubAccountFooter/SetSubAccountFooter';
import SetSubAccountHeader from './components/SetSubAccountHeader/SetSubAccountHeader';
import SetSubAccountLockedPriceCard from './components/SetSubAccountLockedPriceCard/SetSubAccountLockedPriceCard';
import SetSubAccountMemberCard from './components/SetSubAccountMemberCard/SetSubAccountMemberCard';
import SetSubAccountQuotaSection from './components/SetSubAccountQuotaSection/SetSubAccountQuotaSection';
import styles from './SetSubAccountModal.module.less';
import { QUOTA_MAX } from './SetSubAccountModal.constants';
import { useSubAccountQuotaEditor } from './hooks/useSubAccountQuotaEditor';
import type { SetSubAccountModalProps } from './SetSubAccountModal.types';

/** ESC 关闭：与 aria-modal 配套的键盘退出通路。 */
const ESCAPE_KEY = 'Escape';

const SetSubAccountModal: React.FC<SetSubAccountModalProps> = ({
  member,
  currentLevel,
  currentCapability,
  isSubmitting,
  onClose,
  onConfirm,
  isResettingLockedPrice = false,
  onResetLockedPrice,
  isBackfillingSubAccount = false,
  onBackfillSubAccountAmount,
}) => {
  const isEligible = currentLevel === 'annual' || currentLevel === 'lifetime';
  const initialQuota = isEligible ? (currentCapability?.subAccountQuota ?? 0) : 0;
  // 成交价快照：让运营看得到「当前是什么价、子账号加价补录了没有」，
  // 而不只是一个重置按钮
  const lockedPrices = member.lockedPrices ?? [];

  const {
    selectedQuota,
    inputValue,
    isZeroSelected,
    isQuotaChanged,
    handleToggleEnabled,
    handleInputChange,
    handleInputBlur,
    handleInputFocus,
  } = useSubAccountQuotaEditor({ initialQuota, isEligible });

  useEffect(() => {
    const handler = (event: KeyboardEvent): void => {
      if (event.key === ESCAPE_KEY && !isSubmitting) {
        onClose();
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isSubmitting, onClose]);

  const handleConfirm = useCallback(async (): Promise<void> => {
    if (isSubmitting) {
      return;
    }

    await Promise.resolve(onConfirm(selectedQuota));
  }, [isSubmitting, onConfirm, selectedQuota]);


  const isConfirmDisabled = isSubmitting || (!isEligible && selectedQuota > 0);

  return (
    <div
      className={styles.overlay}
      role="dialog"
      aria-modal="true"
      aria-label="配置子账号"
    >
      <div className={styles.sheet}>
        <div className={styles.dragHandle} aria-hidden="true" />

        <SetSubAccountHeader isSubmitting={isSubmitting} onClose={onClose} />

        <div className={styles.sheetBody}>
          <SetSubAccountMemberCard
            member={member}
            currentLevel={currentLevel}
            initialQuota={initialQuota}
          />
          {!isEligible ? <SetSubAccountEligibilityBanner /> : null}
          <SetSubAccountQuotaSection
            isEligible={isEligible}
            isZeroSelected={isZeroSelected}
            selectedQuota={selectedQuota}
            inputValue={inputValue}
            quotaMax={QUOTA_MAX}
            onToggleClose={handleToggleEnabled}
            onInputChange={handleInputChange}
            onInputBlur={handleInputBlur}
            onInputFocus={handleInputFocus}
          />
          <SetSubAccountCapabilityCard />

          {onResetLockedPrice ? (
            <SetSubAccountLockedPriceCard
              lockedPrices={lockedPrices}
              isEligible={isEligible}
              isSubmitting={isSubmitting}
              isResettingLockedPrice={isResettingLockedPrice}
              isBackfillingSubAccount={isBackfillingSubAccount}
              onResetLockedPrice={onResetLockedPrice}
              onBackfillSubAccountAmount={onBackfillSubAccountAmount}
            />
          ) : null}

          {isQuotaChanged ? (
            <SetSubAccountChangeBanner
              initialQuota={initialQuota}
              selectedQuota={selectedQuota}
            />
          ) : null}
        </div>

        <SetSubAccountFooter
          isSubmitting={isSubmitting}
          isConfirmDisabled={isConfirmDisabled}
          onClose={onClose}
          onConfirm={handleConfirm}
        />
      </div>
    </div>
  );
};

export default SetSubAccountModal;
