import React from 'react';
import { cx, safeNum, safeStr } from '@utils/utils';
import { IconPaymentChannel } from '@pages/memberDetail/components/MemberDetailIcons/MemberDetailIcons';
import { MEMBER_RECHARGE_CHANNEL_LABEL } from '../../../../../../../memberDetail.constants';
import { formatMemberAmount, formatMemberDate } from '../../../../../../../memberDetail.utils';
import type { RechargeRecord } from '@pages/memberList/memberList.types';
import pageStyles from '../../../../../../../memberDetail.module.less';

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
        <div className={pageStyles.rechargePlanName}>{safeStr(record.planName, '会员充值')}</div>
        <div className={pageStyles.rechargeMeta}>
          <span className={cx(pageStyles.rechargeChannel, channelClassName)}>
            {MEMBER_RECHARGE_CHANNEL_LABEL[record.channel]}
          </span>
          <span className={pageStyles.rechargeDot} aria-hidden="true" />
          <span className={pageStyles.rechargeDate}>{formatMemberDate(record.createdAt)}</span>
        </div>
      </div>
      <div className={pageStyles.rechargeRight}>
        <span className={pageStyles.rechargeAmtValue}>¥{formatMemberAmount(record.amount)}</span>
        <span className={pageStyles.rechargePoints}>+{safeNum(record.pointsAwarded)} 积分</span>
      </div>
    </div>
  );
};

export default MemberDetailRechargeRow;
