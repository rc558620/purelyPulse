// memberPoints 页头右侧操作按钮
import React from 'react';
import { IconMemberPointsAdd } from '../MemberPointsIcons/MemberPointsIcons';
import styles from './MemberPointsHeaderAction.module.less';

interface MemberPointsHeaderActionProps {
  disabled: boolean;
  onClick: () => void;
}

const MemberPointsHeaderAction: React.FC<MemberPointsHeaderActionProps> = ({
  disabled,
  onClick,
}) => (
  <button
    type="button"
    className={styles.actionButton}
    onClick={onClick}
    aria-label="调整用户积分"
    disabled={disabled}
  >
    <IconMemberPointsAdd />
    调整积分
  </button>
);

export default MemberPointsHeaderAction;
