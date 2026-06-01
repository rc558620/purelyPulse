// SetSubAccountModal：编排子账号配额弹窗状态与提交流程。
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { IconClose, IconSubAccount } from '@pages/memberDetail/components/MemberDetailIcons/MemberDetailIcons';
import SetSubAccountCapabilityCard from './components/SetSubAccountCapabilityCard/SetSubAccountCapabilityCard';
import SetSubAccountChangeBanner from './components/SetSubAccountChangeBanner/SetSubAccountChangeBanner';
import SetSubAccountEligibilityBanner from './components/SetSubAccountEligibilityBanner/SetSubAccountEligibilityBanner';
import SetSubAccountMemberCard from './components/SetSubAccountMemberCard/SetSubAccountMemberCard';
import SetSubAccountQuotaSection from './components/SetSubAccountQuotaSection/SetSubAccountQuotaSection';
import type { SetSubAccountModalProps } from './SetSubAccountModal.types';
import styles from './SetSubAccountModal.module.less';

const QUOTA_MAX = 10;

const SetSubAccountModal: React.FC<SetSubAccountModalProps> = ({
  member,
  currentLevel,
  currentCapability,
  isSubmitting,
  onClose,
  onConfirm,
}) => {
  const isEligible = currentLevel === 'annual' || currentLevel === 'lifetime';
  const initialQuota = isEligible ? (currentCapability?.subAccountQuota ?? 0) : 0;
  const [selectedQuota, setSelectedQuota] = useState<number>(initialQuota);
  const [inputValue, setInputValue] = useState<string>(initialQuota > 0 ? String(initialQuota) : '');
  const lastValidQuotaRef = useRef<number>(initialQuota > 0 ? initialQuota : 1);

  useEffect(() => {
    const handler = (event: KeyboardEvent): void => {
      if (event.key === 'Escape' && !isSubmitting) {
        onClose();
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isSubmitting, onClose]);

  const handleToggleClose = useCallback((): void => {
    if (!isEligible) {
      return;
    }

    if (selectedQuota === 0) {
      const restoreQuota = lastValidQuotaRef.current;
      setSelectedQuota(restoreQuota);
      setInputValue(String(restoreQuota));
      return;
    }

    lastValidQuotaRef.current = selectedQuota;
    setSelectedQuota(0);
    setInputValue('');
  }, [isEligible, selectedQuota]);

  const handleInputChange = useCallback((event: React.ChangeEvent<HTMLInputElement>): void => {
    const rawValue = event.target.value;
    setInputValue(rawValue);

    if (rawValue === '') {
      return;
    }

    const parsedValue = parseInt(rawValue, 10);
    if (!Number.isNaN(parsedValue) && parsedValue >= 1 && parsedValue <= QUOTA_MAX) {
      setSelectedQuota(parsedValue);
      lastValidQuotaRef.current = parsedValue;
    }
  }, []);

  const handleInputBlur = useCallback((): void => {
    const parsedValue = parseInt(inputValue, 10);
    if (Number.isNaN(parsedValue) || parsedValue < 1) {
      setInputValue(selectedQuota > 0 ? String(selectedQuota) : '');
      return;
    }

    const nextQuota = Math.min(QUOTA_MAX, Math.max(1, parsedValue));
    setSelectedQuota(nextQuota);
    setInputValue(String(nextQuota));
    lastValidQuotaRef.current = nextQuota;
  }, [inputValue, selectedQuota]);

  const handleQuotaInputFocus = useCallback((): void => {
    if (!isEligible || selectedQuota !== 0) {
      return;
    }

    const restoreQuota = lastValidQuotaRef.current;
    setSelectedQuota(restoreQuota);
    setInputValue(String(restoreQuota));
  }, [isEligible, selectedQuota]);

  const handleConfirm = useCallback(async (): Promise<void> => {
    if (isSubmitting) {
      return;
    }

    await Promise.resolve(onConfirm(selectedQuota));
  }, [isSubmitting, onConfirm, selectedQuota]);

  const handleOverlayClick = useCallback((event: React.MouseEvent<HTMLDivElement>): void => {
    if (!isSubmitting && event.target === event.currentTarget) {
      onClose();
    }
  }, [isSubmitting, onClose]);

  const hasQuotaChanged = selectedQuota !== initialQuota;
  const isZeroSelected = selectedQuota === 0;
  const isConfirmDisabled = isSubmitting || (!isEligible && selectedQuota > 0);

  return (
    <div
      className={styles.overlay}
      role="dialog"
      aria-modal="true"
      aria-label="配置子账号"
      onClick={handleOverlayClick}
    >
      <div className={styles.sheet}>
        <div className={styles.dragHandle} aria-hidden="true" />

        <div className={styles.sheetHeader}>
          <div className={styles.sheetTitleWrap}>
            <div className={styles.sheetTitleIcon} aria-hidden="true">
              <IconSubAccount width={16} height={16} strokeWidth={2.2} />
            </div>
            <span className={styles.sheetTitle}>子账号配额</span>
          </div>
          <button
            type="button"
            className={styles.closeBtn}
            onClick={onClose}
            aria-label="关闭"
            disabled={isSubmitting}
          >
            <IconClose />
          </button>
        </div>

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
            onToggleClose={handleToggleClose}
            onInputChange={handleInputChange}
            onInputBlur={handleInputBlur}
            onInputFocus={handleQuotaInputFocus}
          />
          <SetSubAccountCapabilityCard />
          {hasQuotaChanged ? (
            <SetSubAccountChangeBanner
              initialQuota={initialQuota}
              selectedQuota={selectedQuota}
            />
          ) : null}
        </div>

        <div className={styles.sheetActions}>
          <button
            type="button"
            className={styles.cancelBtn}
            onClick={onClose}
            disabled={isSubmitting}
          >
            取消
          </button>
          <button
            type="button"
            className={styles.confirmBtn}
            onClick={handleConfirm}
            disabled={isConfirmDisabled}
          >
            {isSubmitting ? '保存中...' : '保存配额'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SetSubAccountModal;
