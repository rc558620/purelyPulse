// SetSubAccountLockedPriceCard：成交价快照卡，编排重置流程并向列表分发快照数据与补录能力。
import React, { useCallback, useState } from 'react';
import SetSubAccountLockedPriceActions from '../SetSubAccountLockedPriceActions/SetSubAccountLockedPriceActions';
import SetSubAccountLockedPriceList from '../SetSubAccountLockedPriceList/SetSubAccountLockedPriceList';
import styles from '../../SetSubAccountModal.module.less';
import { SUB_ACCOUNT_PRICING_PLAN_IDS } from '../../SetSubAccountModal.constants';
import type { SetSubAccountModalProps } from '../../SetSubAccountModal.types';
import type { MemberLockedPrice } from '@pages/memberList/memberList.pricing.types';

interface SetSubAccountLockedPriceCardProps {
  lockedPrices: MemberLockedPrice[];
  /** 年 / 永久会员才存在「补录」的必要 */
  isEligible: boolean;
  isSubmitting: boolean;
  isResettingLockedPrice: boolean;
  isBackfillingSubAccount: boolean;
  /** 重置成交价快照（卡内提供二次确认） */
  onResetLockedPrice?: () => Promise<void> | void;
  /** 补录子账号加价；未提供时列表只读 */
  onBackfillSubAccountAmount?: NonNullable<SetSubAccountModalProps['onBackfillSubAccountAmount']>;
}

const SetSubAccountLockedPriceCard: React.FC<SetSubAccountLockedPriceCardProps> = ({
  lockedPrices,
  isEligible,
  isSubmitting,
  isResettingLockedPrice,
  isBackfillingSubAccount,
  onResetLockedPrice,
  onBackfillSubAccountAmount,
}) => {
  const [isResetConfirming, setIsResetConfirming] = useState<boolean>(false);

  // 有子账号能力但年 / 永久档位缺子账号加价：续费价会按纯配置价收，
  // 子账号部分等于白送，需要显式提示运营（月 / 季开不了子账号，不算待补录）
  const hasPendingBackfill =
    isEligible &&
    lockedPrices.some(
      (item) =>
        SUB_ACCOUNT_PRICING_PLAN_IDS.has(item.planId) &&
        item.subAccountAmountDisplay === null,
    );

  const handleResetRequest = useCallback((): void => {
    if (isSubmitting || isResettingLockedPrice) {
      return;
    }

    setIsResetConfirming(true);
  }, [isResettingLockedPrice, isSubmitting]);

  const handleResetCancel = useCallback((): void => {
    setIsResetConfirming(false);
  }, []);

  const handleResetConfirm = useCallback(async (): Promise<void> => {
    if (isResettingLockedPrice) {
      return;
    }

    setIsResetConfirming(false);
    await Promise.resolve(onResetLockedPrice?.());
  }, [isResettingLockedPrice, onResetLockedPrice]);

  return (
    <div className={styles.lockedPriceCard}>
      <div className={styles.lockedPriceHeader}>
        <span className={styles.lockedPriceTitle}>成交价快照</span>
        <SetSubAccountLockedPriceActions
          isResetConfirming={isResetConfirming}
          isResettingLockedPrice={isResettingLockedPrice}
          isSubmitting={isSubmitting}
          onResetRequest={handleResetRequest}
          onResetCancel={handleResetCancel}
          onResetConfirm={handleResetConfirm}
        />
      </div>
      <div className={styles.lockedPriceText}>
        <SetSubAccountLockedPriceList
          lockedPrices={lockedPrices}
          isSubmitting={isSubmitting}
          isBackfillingSubAccount={isBackfillingSubAccount}
          onBackfillSubAccountAmount={onBackfillSubAccountAmount}
        />
        {hasPendingBackfill ? (
          <span className={styles.lockedPriceWarning}>
            年 / 永久档位尚未补录子账号加价：续费价会按纯配置价收取，
            客户实际拥有子账号权益，这部分等于白送
          </span>
        ) : null}
        <span className={styles.lockedPriceDesc}>
          续费价 = 当前配置价 + 子账号加价；成交价只作记账，不影响续费。
          重置只清除成交记录（下次成交时重新记录），已议定的续费价会保留
        </span>
      </div>
    </div>
  );
};

export default SetSubAccountLockedPriceCard;
