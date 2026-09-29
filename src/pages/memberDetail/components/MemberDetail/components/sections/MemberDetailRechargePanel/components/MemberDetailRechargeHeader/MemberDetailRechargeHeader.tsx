import React from 'react';
import { safeNum } from '@utils/utils';
import pageStyles from '../../../../../../../memberDetail.module.less';

interface MemberDetailRechargeHeaderProps {
  rechargeCount: number;
  fallbackCount: number;
  /** 标题；默认「充值记录」，会员等级设置记录 tab 传「会员等级设置记录」 */
  title?: string;
}

const MemberDetailRechargeHeader: React.FC<MemberDetailRechargeHeaderProps> = ({
  rechargeCount,
  fallbackCount,
  title = '充值记录',
}) => (
  <div className={pageStyles.rechargeCardHeader}>
    <span className={pageStyles.rechargeCardTitle}>{title}</span>
    <span className={pageStyles.rechargeCardCount}>{safeNum(rechargeCount || fallbackCount)} 笔</span>
  </div>
);

export default MemberDetailRechargeHeader;
