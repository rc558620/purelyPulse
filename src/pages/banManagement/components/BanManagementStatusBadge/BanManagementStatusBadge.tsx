// 封禁管理状态标签：负责会员状态的语义化展示。
import React from 'react';
import { cx } from '@utils/utils';
import type { MemberFilterStatus, MemberStatus } from '../../../memberList/memberList.types';
import { IconBanCircleSlash, IconStatusDot } from '../BanManagementIcons/BanManagementIcons';
import styles from './BanManagementStatusBadge.module.less';

interface BanManagementStatusBadgeProps {
  status: MemberFilterStatus | MemberStatus;
}

export const BanManagementStatusBadge: React.FC<BanManagementStatusBadgeProps> = ({ status }) => {
  // Bug #11: 对 'all' 筛选值做显式处理，避免误显示为"正常"
  if (status === 'all') {
    return null;
  }

  if (status === 'banned') {
    return (
      <span className={cx(styles.statusBadge, styles.statusBadgeBanned)}>
        <IconBanCircleSlash width={10} height={10} strokeWidth={3} />
        已封禁
      </span>
    );
  }

  if (status === 'inactive') {
    return <span className={cx(styles.statusBadge, styles.statusBadgeInactive)}>未活跃</span>;
  }

  if (status === 'cancelled') {
    return <span className={cx(styles.statusBadge, styles.statusBadgeCancelled)}>已注销</span>;
  }

  return (
    <span className={cx(styles.statusBadge, styles.statusBadgeActive)}>
      <IconStatusDot />
      正常
    </span>
  );
};
