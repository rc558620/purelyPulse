import React from 'react';
import { cx, safeNum, safeStr } from '@utils/utils';
import { IconPaymentChannel } from '@pages/memberDetail/components/MemberDetailIcons/MemberDetailIcons';
import { MEMBER_RECHARGE_CHANNEL_LABEL } from '../../../../../../../memberDetail.constants';
import { formatMemberAmount, formatMemberDate } from '../../../../../../../memberDetail.utils';
import type { RechargeRecord } from '@pages/memberList/memberList.types';
import pageStyles from '../../../../../../../memberDetail.module.less';

/** 根据套餐名称推断时长类型，用于着色。 */
const getPlanColorClass = (planName: string): string => {
  const name = planName ?? '';
  if (name.includes('永久')) return pageStyles.planColorLifetime;
  if (name.includes('年度')) return pageStyles.planColorAnnual;
  if (name.includes('季度')) return pageStyles.planColorQuarterly;
  if (name.includes('月度')) return pageStyles.planColorMonthly;
  return '';
};

interface MemberDetailRechargeRowProps {
  record: RechargeRecord;
  isLast: boolean;
}

const getChannelClassName = (channel: RechargeRecord['channel']): string => (
  pageStyles[`rechargeChannel${channel[0].toUpperCase()}${channel.slice(1)}`]
);

const MemberDetailRechargeRow: React.FC<MemberDetailRechargeRowProps> = ({ record, isLast }) => {
  const channelClassName = getChannelClassName(record.channel);

  return (
    <div className={cx(pageStyles.rechargeRow, isLast && pageStyles.rechargeRowLast)}>
      <div className={cx(pageStyles.rechargeIcon, channelClassName)}>
        <IconPaymentChannel channel={record.channel} />
      </div>
      <div className={pageStyles.rechargeInfo}>
        <div className={cx(pageStyles.rechargePlanName, getPlanColorClass(record.planName))}>{safeStr(record.planName, '会员充值')}</div>
        <div className={pageStyles.rechargeMeta}>
          <span className={cx(pageStyles.rechargeChannel, channelClassName)}>
            {MEMBER_RECHARGE_CHANNEL_LABEL[record.channel]}
          </span>
          <span className={pageStyles.rechargeDot} aria-hidden="true" />
          <span className={pageStyles.rechargeDate}>{formatMemberDate(record.createdAt)}</span>
        </div>
      </div>
      <div className={pageStyles.rechargeRight}>
        <span className={cx(pageStyles.rechargeAmtValue, getPlanColorClass(record.planName))}>¥{formatMemberAmount(record.amount)}</span>
        <span className={pageStyles.rechargePoints}>+{safeNum(record.pointsAwarded)} 积分</span>
      </div>
    </div>
  );
};

export default MemberDetailRechargeRow;
