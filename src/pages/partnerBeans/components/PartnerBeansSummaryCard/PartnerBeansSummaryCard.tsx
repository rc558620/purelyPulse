// partnerBeans 合伙人余额总览区块
import React from 'react';
import { isNonEmptyArray, safeNum } from '@utils/utils';
import { IconPartnerBeansSummary } from '../PartnerBeansIcons/PartnerBeansIcons';
import PartnerBeansPageState from '../PartnerBeansPageState/PartnerBeansPageState';
import type { PartnerBeansPageUser } from '../../partnerBeans.types';
import styles from './PartnerBeansSummaryCard.module.less';

interface PartnerBeansSummaryCardProps {
  isSubmitting: boolean;
  users: PartnerBeansPageUser[];
  onAdjust: (user: PartnerBeansPageUser) => void;
}

const PartnerBeansSummaryCardComponent: React.FC<PartnerBeansSummaryCardProps> = ({
  isSubmitting,
  users,
  onAdjust,
}) => (
  <div className={styles.partnerSummaryCard}>
    <div className={styles.partnerSummaryTitle}>
      <IconPartnerBeansSummary />
      合伙人余额一览
    </div>
    {isNonEmptyArray(users) ? (
      <div className={styles.partnerList}>
        {users.map((user) => (
          <div key={user.id} className={styles.partnerItem}>
            <div className={`${styles.partnerAvatar} ${user.avatarUrl ? styles.partnerAvatarWithImage : ''}`} aria-hidden="true">
              {user.avatarUrl ? <img className={styles.partnerAvatarImg} src={user.avatarUrl} alt="" /> : user.name[0]}
            </div>
            <div className={styles.partnerInfo}>
              <span className={styles.partnerName}>{user.name}</span>
              <span className={styles.partnerPhone}>{user.phone}</span>
            </div>
            <div className={styles.partnerBeanBalance}>
              <span className={styles.partnerBeanVal}>{safeNum(user.beanBalance).toLocaleString('zh-CN')}</span>
              <span className={styles.partnerBeanUnit}>豆</span>
            </div>
            <button
              type="button"
              className={styles.quickAdjustBtn}
              onClick={() => onAdjust(user)}
              aria-label={`调整 ${user.name} 的纯利豆`}
              disabled={isSubmitting}
            >
              调整
            </button>
          </div>
        ))}
      </div>
    ) : (
      <PartnerBeansPageState message="暂无合伙人余额数据" variant="empty" />
    )}
  </div>
);

const PartnerBeansSummaryCard = React.memo(PartnerBeansSummaryCardComponent);

export default PartnerBeansSummaryCard;
