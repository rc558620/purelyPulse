import React from 'react';
import { safeNum } from '@utils/utils';
import pageStyles from '../../../../../../../memberDetail.module.less';

interface MemberDetailRechargeHeaderProps {
  rechargeCount: number;
  fallbackCount: number;
}

const MemberDetailRechargeHeader: React.FC<MemberDetailRechargeHeaderProps> = ({
  rechargeCount,
  fallbackCount,
}) => (
  <div className={pageStyles.rechargeCardHeader}>
    <span className={pageStyles.rechargeCardTitle}>充值记录</span>
    <span className={pageStyles.rechargeCardCount}>{safeNum(rechargeCount || fallbackCount)} 笔</span>
  </div>
);

export default MemberDetailRechargeHeader;
