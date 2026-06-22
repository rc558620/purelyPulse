// 用户选择弹窗：在调整积分前选择目标会员。
import React from 'react';
import { cx, isNonEmptyArray, safeNum } from '@utils/utils';
import { IconMemberPointsClose } from '../MemberPointsIcons/MemberPointsIcons';
import type { MemberPointsPageUser } from '../../memberPoints.types';
import styles from './UserPickerModal.module.less';

export interface UserPickerModalProps {
  users: MemberPointsPageUser[];
  keyword: string;
  isSubmitting: boolean;
  onKeywordChange: (value: string) => void;
  onClose: () => void;
  onSelect: (user: MemberPointsPageUser) => void;
}

const UserPickerModal: React.FC<UserPickerModalProps> = ({
  users,
  keyword,
  isSubmitting,
  onKeywordChange,
  onClose,
  onSelect,
}) => (
  <div className={styles.bodyOverlay} onClick={onClose} role="dialog" aria-modal="true" aria-label="选择要调整积分的用户">
    <div className={styles.modalCard} onClick={(event) => event.stopPropagation()}>
      <div className={styles.header}>
        <span className={styles.title}>选择用户</span>
        <button type="button" className={styles.closeButton} onClick={onClose} aria-label="关闭">
          <IconMemberPointsClose />
        </button>
      </div>
      <div className={styles.searchSection}>
        <input
          className={styles.searchInput}
          type="text"
          placeholder="搜索姓名或手机号..."
          value={keyword}
          onChange={(event) => onKeywordChange(event.target.value)}
          autoFocus
          aria-label="搜索用户"
        />
      </div>
      <div className={styles.userList}>
        {!isNonEmptyArray(users) ? (
          <div className={styles.emptyState} role="status">
            <span>暂无匹配用户</span>
          </div>
        ) : (
          users.map((user) => (
            <button
              key={user.id}
              type="button"
              className={styles.userButton}
              onClick={() => onSelect(user)}
              disabled={isSubmitting}
            >
              <div className={cx(styles.avatar, user.avatarUrl && styles.avatarWithImage)} aria-hidden="true">
                {user.avatarUrl ? <img className={styles.avatarImg} src={user.avatarUrl} alt="" /> : user.name[0]}
              </div>
              <div className={styles.userInfo}>
                <span className={styles.userName}>{user.name}</span>
                <span className={styles.userPhone}>{user.phone}</span>
              </div>
              <div className={styles.balance}>
                <span className={styles.balanceValue}>{safeNum(user.availablePoints).toLocaleString('zh-CN')}</span>
                <span className={styles.balanceLabel}>积分</span>
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  </div>
);

export default UserPickerModal;
