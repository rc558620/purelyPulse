// memberPoints 页头右侧操作按钮
import React from 'react';
import { IconMemberPointsAdd } from '../MemberPointsIcons/MemberPointsIcons';
import styles from './MemberPointsHeaderAction.module.less';

interface MemberPointsHeaderActionProps {
  disabled: boolean;
  onClick: () => void;
  /** 无障碍标签：详情视图按目标会员命名 */
  ariaLabel?: string;
  label?: string;
}

const MemberPointsHeaderAction: React.FC<MemberPointsHeaderActionProps> = ({
  disabled,
  onClick,
  ariaLabel = '调整用户积分',
  label = '调整积分',
}) => (
  <button
    type="button"
    className={styles.actionButton}
    onClick={onClick}
    aria-label={ariaLabel}
    disabled={disabled}
  >
    <IconMemberPointsAdd />
    {label}
  </button>
);

export default MemberPointsHeaderAction;
