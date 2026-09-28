import React from 'react';
import { IconBankCard } from '@pages/memberDetail/components/MemberDetailIcons/MemberDetailIcons';
import pageStyles from '../../../../../../../memberDetail.module.less';

interface MemberDetailRechargeEmptyStateProps {
  /** 空态文案；默认「暂无充值记录」 */
  emptyText?: string;
}

const MemberDetailRechargeEmptyState: React.FC<MemberDetailRechargeEmptyStateProps> = ({
  emptyText = '暂无充值记录',
}) => (
  <div className={pageStyles.rechargeEmpty}>
    <IconBankCard width={36} height={36} strokeWidth={1.3} />
    <span>{emptyText}</span>
  </div>
);

export default MemberDetailRechargeEmptyState;
