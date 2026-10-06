// partnerBeans 合伙人余额总览区块
import React from 'react';
import { cx, isNonEmptyArray, safeNum } from '@utils/utils';
import { IconPartnerBeansSummary } from '../PartnerBeansIcons/PartnerBeansIcons';
import PartnerBeansPageState from '../PartnerBeansPageState/PartnerBeansPageState';
import type { PartnerBeansPageUser } from '../../partnerBeans.types';
import styles from './PartnerBeansSummaryCard.module.less';

interface PartnerBeansSummaryCardProps {
  /** 首屏加载中：合伙人快照先于流水到位，避免短暂闪一下「暂无数据」 */
  isLoading: boolean;
  isSubmitting: boolean;
  users: PartnerBeansPageUser[];
  onAdjust: (user: PartnerBeansPageUser) => void;
}

const PartnerBeansSummaryCardComponent: React.FC<PartnerBeansSummaryCardProps> = ({
  isLoading,
  isSubmitting,
  users,
  onAdjust,
}) => (
  <div className={styles.partnerSummaryCard}>
    <div className={styles.partnerSummaryTitle}>
      <IconPartnerBeansSummary />
      合伙人余额一览
    </div>
    {isLoading ? (
      <PartnerBeansPageState message="合伙人余额加载中..." variant="loading" />
    ) : null}
    {!isLoading && isNonEmptyArray(users) ? (
      <div className={styles.partnerList}>
        {users.map((user) => (
          <div key={user.id} className={styles.partnerItem}>
            <div className={cx(styles.partnerAvatar, user.avatarUrl && styles.partnerAvatarWithImage)} aria-hidden="true">
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
    ) : null}
    {!isLoading && !isNonEmptyArray(users) ? (
      <PartnerBeansPageState message="暂无合伙人余额数据" variant="empty" />
    ) : null}
  </div>
);

const PartnerBeansSummaryCard = React.memo(PartnerBeansSummaryCardComponent);

export default PartnerBeansSummaryCard;
