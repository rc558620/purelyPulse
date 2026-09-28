// SetSubAccountLockedPriceItem：单个档位的成交价摘要，含子账号加价状态与内联补录入口。
import React from 'react';
import { safeNum } from '@utils/utils';
import { SUB_ACCOUNT_PRICING_PLAN_IDS } from '../../SetSubAccountModal.constants';
import SetSubAccountBackfillForm from '../SetSubAccountBackfillForm/SetSubAccountBackfillForm';
import styles from '../../SetSubAccountModal.module.less';
import type { SubAccountBackfillForm } from '../../hooks/useSubAccountBackfillForm';
import type { MemberLockedPrice } from '@pages/memberList/memberList.types';

interface SetSubAccountLockedPriceItemProps {
  item: MemberLockedPrice;
  /** 补录表单状态与操作集合，由列表层统一持有以保证同时只展开一个档位 */
  form: SubAccountBackfillForm;
  /** 是否提供补录入口（上层未提供提交回调时为 false） */
  canBackfill: boolean;
  isSubmitting: boolean;
  isBackfillingSubAccount: boolean;
}

const SetSubAccountLockedPriceItem: React.FC<SetSubAccountLockedPriceItemProps> = ({
  item,
  form,
  canBackfill,
  isSubmitting,
  isBackfillingSubAccount,
}) => {
  const isSubAccountSupported = SUB_ACCOUNT_PRICING_PLAN_IDS.has(item.planId);
  const isOtherPlanExpanded = form.expandedPlanId !== item.planId;

  const renderSubAccountStatus = (): React.ReactNode => {
    if (!isSubAccountSupported) {
      return <span className={styles.lockedPriceMeta}>不支持子账号</span>;
    }

    if (item.subAccountAmountDisplay !== null) {
      return (
        <span className={styles.lockedPriceSubAccountTag}>
          含 {safeNum(item.subAccountCount)} 个子账号
          {/* 设置会员等级填的成交价已包含子账号；只有首充后
              单独补录的加价才是额外收的钱，需要展示出来 */}
          {item.source === 'purchase'
            ? ` · 加价 ¥${item.subAccountAmountDisplay} = ¥${item.renewalPriceDisplay}`
            : '（价格已含）'}
        </span>
      );
    }

    return (
      <>
        <span className={styles.lockedPricePendingTag}>子账号加价未补录</span>
        {canBackfill && isOtherPlanExpanded ? (
          <button
            type="button"
            className={styles.lockedPriceBackfillBtn}
            onClick={() => form.onStart(item)}
            disabled={isSubmitting || isBackfillingSubAccount}
          >
            补录子账号加价
          </button>
        ) : null}
        {form.expandedPlanId === item.planId ? (
          <SetSubAccountBackfillForm
            countValue={form.countValue}
            amountValue={form.amountValue}
            isAmountEmpty={form.isAmountEmpty}
            isAmountValid={form.isAmountValid}
            isSubmitting={isSubmitting}
            isBackfillingSubAccount={isBackfillingSubAccount}
            onCountChange={form.onCountChange}
            onAmountChange={form.onAmountChange}
            onSubmit={() => form.onSubmit(item)}
            onCancel={form.onCancel}
          />
        ) : null}
      </>
    );
  };

  return (
    <li className={styles.lockedPriceItem}>
      <span className={styles.lockedPricePlan}>{item.planName}</span>
      <span className={styles.lockedPriceAmount}>¥{item.priceDisplay}</span>
      <span className={styles.lockedPriceMeta}>{item.sourceLabel}</span>
      {renderSubAccountStatus()}
    </li>
  );
};

export default SetSubAccountLockedPriceItem;
