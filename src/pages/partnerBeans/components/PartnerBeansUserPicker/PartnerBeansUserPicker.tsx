// partnerBeans 合伙人选择弹层
import React from 'react';
import { isNonEmptyArray, safeNum } from '@utils/utils';
import { IconPartnerBeansClose } from '../PartnerBeansIcons/PartnerBeansIcons';
import type { PartnerBeansPageUser } from '../../partnerBeans.types';
import styles from './PartnerBeansUserPicker.module.less';

interface PartnerBeansUserPickerProps {
  isSubmitting: boolean;
  searchQuery: string;
  users: PartnerBeansPageUser[];
  onClose: () => void;
  onSearchChange: (value: string) => void;
  onSelect: (user: PartnerBeansPageUser) => void;
}

const PartnerBeansUserPickerComponent: React.FC<PartnerBeansUserPickerProps> = ({
  isSubmitting,
  searchQuery,
  users,
  onClose,
  onSearchChange,
  onSelect,
}) => (
  <div
    className={styles.pickerOverlay}
    onClick={onClose}
    role="dialog"
    aria-modal="true"
    aria-label="选择要调整纯利豆的合伙人"
  >
    <div className={styles.pickerCard} onClick={(event) => event.stopPropagation()}>
      <div className={styles.pickerHeader}>
        <span className={styles.pickerTitle}>选择合伙人</span>
        <button type="button" className={styles.pickerClose} onClick={onClose} aria-label="关闭">
          <IconPartnerBeansClose />
        </button>
      </div>
      <div className={styles.pickerSearch}>
        <input
          className={styles.pickerSearchInput}
          type="text"
          placeholder="搜索姓名或手机号..."
          value={searchQuery}
          onChange={(event) => onSearchChange(event.target.value)}
          autoFocus
          aria-label="搜索合伙人"
        />
      </div>
      <div className={styles.pickerList}>
        {isNonEmptyArray(users) ? (
          users.map((user) => (
            <button
              key={user.id}
              type="button"
              className={styles.pickerUserItem}
              onClick={() => onSelect(user)}
              disabled={isSubmitting}
            >
              <div className={`${styles.pickerAvatar} ${user.avatarUrl ? styles.pickerAvatarWithImage : ''}`} aria-hidden="true">
                {user.avatarUrl ? <img className={styles.pickerAvatarImg} src={user.avatarUrl} alt="" /> : user.name[0]}
              </div>
              <div className={styles.pickerUserInfo}>
                <div className={styles.pickerUserNameRow}>
                  <span className={styles.pickerUserName}>{user.name}</span>
                  <span className={styles.pickerPartnerTag}>合伙人</span>
                </div>
                <span className={styles.pickerUserPhone}>{user.phone}</span>
              </div>
              <div className={styles.pickerBalance}>
                <span className={styles.pickerBalanceVal}>{safeNum(user.beanBalance).toLocaleString('zh-CN')}</span>
                <span className={styles.pickerBalanceLbl}>纯利豆</span>
              </div>
            </button>
          ))
        ) : (
          <div className={styles.emptyState} role="status">
            <span>暂无匹配合伙人</span>
          </div>
        )}
      </div>
    </div>
  </div>
);

const PartnerBeansUserPicker = React.memo(PartnerBeansUserPickerComponent);

export default PartnerBeansUserPicker;
