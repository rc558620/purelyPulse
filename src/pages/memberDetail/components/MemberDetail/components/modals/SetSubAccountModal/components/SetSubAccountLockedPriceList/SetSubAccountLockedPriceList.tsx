// SetSubAccountLockedPriceList：成交价快照列表，持有补录表单状态并兜底未锁价空态。
import React from 'react';
import { isNonEmptyArray } from '@utils/utils';
import SetSubAccountLockedPriceItem from '../SetSubAccountLockedPriceItem/SetSubAccountLockedPriceItem';
import styles from '../../SetSubAccountModal.module.less';
import { useSubAccountBackfillForm } from '../../hooks/useSubAccountBackfillForm';
import type { SetSubAccountModalProps } from '../../SetSubAccountModal.types';
import type { MemberLockedPrice } from '@pages/memberList/memberList.pricing.types';

interface SetSubAccountLockedPriceListProps {
  /** 已归一化的成交价快照（未锁价时为空数组） */
  lockedPrices: MemberLockedPrice[];
  isSubmitting: boolean;
  isBackfillingSubAccount: boolean;
  /** 补录提交回调；未提供时列表只读 */
  onBackfillSubAccountAmount?: NonNullable<SetSubAccountModalProps['onBackfillSubAccountAmount']>;
}

const SetSubAccountLockedPriceList: React.FC<SetSubAccountLockedPriceListProps> = ({
  lockedPrices,
  isSubmitting,
  isBackfillingSubAccount,
  onBackfillSubAccountAmount,
}) => {
  const form = useSubAccountBackfillForm({ onBackfillSubAccountAmount });
  const canBackfill = Boolean(onBackfillSubAccountAmount);

  if (!isNonEmptyArray(lockedPrices)) {
    return (
      <span className={styles.lockedPriceDesc}>当前未锁价，下次成交按当时套餐价锁定</span>
    );
  }

  return (
    <ul className={styles.lockedPriceList}>
      {lockedPrices.map((item) => (
        <SetSubAccountLockedPriceItem
          key={item.planId}
          item={item}
          form={form}
          canBackfill={canBackfill}
          isSubmitting={isSubmitting}
          isBackfillingSubAccount={isBackfillingSubAccount}
        />
      ))}
    </ul>
  );
};

export default SetSubAccountLockedPriceList;
