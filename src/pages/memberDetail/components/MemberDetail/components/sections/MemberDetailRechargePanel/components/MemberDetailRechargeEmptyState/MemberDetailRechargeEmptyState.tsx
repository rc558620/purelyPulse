import React from 'react';
import { IconBankCard } from '@pages/memberDetail/components/MemberDetailIcons/MemberDetailIcons';
import pageStyles from '../../../../../../../memberDetail.module.less';

const MemberDetailRechargeEmptyState: React.FC = () => (
  <div className={pageStyles.rechargeEmpty}>
    <IconBankCard width={36} height={36} strokeWidth={1.3} />
    <span>暂无充值记录</span>
  </div>
);

export default MemberDetailRechargeEmptyState;
