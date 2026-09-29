// 调整续费记录行：一条改价审计（哪一档、从多少改成多少、谁在什么时候改的）。
import React from 'react';
import { cx, safeStr } from '@utils/utils';
import { IconPriceTag } from '@pages/memberDetail/components/MemberDetailIcons/MemberDetailIcons';
import type { MemberRenewalPriceAdjustRecord } from '@pages/memberList/memberList.pricing.types';
import { formatMemberDateTime } from '../../../../../../../memberDetail.utils';
import pageStyles from '../../../../../../../memberDetail.module.less';

/** 根据套餐名称推断时长类型，用于着色（与充值记录行同一套语义）。 */
const getPlanColorClass = (planName: string): string => {
  const name = planName ?? '';
  if (name.includes('永久')) return pageStyles.planColorLifetime;
  if (name.includes('年度')) return pageStyles.planColorAnnual;
  if (name.includes('季度')) return pageStyles.planColorQuarterly;
  if (name.includes('月度')) return pageStyles.planColorMonthly;
  return '';
};

interface MemberDetailRenewalAdjustRowProps {
  record: MemberRenewalPriceAdjustRecord;
  isLast: boolean;
}

const MemberDetailRenewalAdjustRow: React.FC<MemberDetailRenewalAdjustRowProps> = ({
  record,
  isLast,
}) => {
  const planColorClass = getPlanColorClass(record.planName);
  // newPriceDisplay 为 null 不是「无值」而是业务语义：这次把覆盖清掉了，续费回到配置价
  const newPriceText =
    record.newPriceDisplay === null ? '恢复默认价' : `¥${record.newPriceDisplay}`;
  const previousPriceText =
    record.oldPriceDisplay === null ? '此前未议定' : `此前 ¥${record.oldPriceDisplay}`;

  return (
    <div className={cx(pageStyles.rechargeRow, isLast && pageStyles.rechargeRowLast)}>
      <div className={cx(pageStyles.rechargeIcon, pageStyles.rechargeChannelAdmin)}>
        <IconPriceTag width={18} height={18} />
      </div>
      <div className={pageStyles.rechargeInfo}>
        <div className={cx(pageStyles.rechargePlanName, planColorClass)}>
          {`${safeStr(record.planName, '续费价')}续费价`}
        </div>
        <div className={pageStyles.rechargeMeta}>
          <span className={cx(pageStyles.rechargeChannel, pageStyles.rechargeChannelAdmin)}>
            {safeStr(record.operatorName, '平台操作')}
          </span>
          <span className={pageStyles.rechargeDot} aria-hidden="true" />
          <span className={pageStyles.rechargeDate}>{formatMemberDateTime(record.createdAt)}</span>
        </div>
      </div>
      <div className={pageStyles.rechargeRight}>
        <span className={cx(pageStyles.rechargeAmtValue, planColorClass)}>{newPriceText}</span>
        <span className={pageStyles.rechargeAdjustPrevPrice}>{previousPriceText}</span>
      </div>
    </div>
  );
};

export default MemberDetailRenewalAdjustRow;
