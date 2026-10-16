// partnerBeans 单合伙人详情头部：头像 / 姓名 / 当前余额 / 快捷调整入口
import React from 'react';
import { cx, safeNum } from '@utils/utils';
import type { PartnerBeansPageUser } from '../../partnerBeans.types';
import styles from './PartnerBeansDetailHeader.module.less';

interface PartnerBeansDetailHeaderProps {
  user: PartnerBeansPageUser;
  isSubmitting: boolean;
  onAdjust: (user: PartnerBeansPageUser) => void;
}

const PartnerBeansDetailHeaderComponent: React.FC<PartnerBeansDetailHeaderProps> = ({
  user,
  isSubmitting,
  onAdjust,
}) => (
  <div className={styles.detailHeaderCard}>
    <div className={cx(styles.detailAvatar, user.avatarUrl && styles.detailAvatarWithImage)} aria-hidden="true">
      {user.avatarUrl ? <img className={styles.detailAvatarImg} src={user.avatarUrl} alt="" /> : user.name[0]}
    </div>
    <div className={styles.detailInfo}>
      <div className={styles.detailNameRow}>
        <span className={styles.detailName}>{user.name}</span>
        <span className={styles.detailPartnerTag}>合伙人</span>
      </div>
      <span className={styles.detailPhone}>{user.phone}</span>
    </div>
    <div className={styles.detailRight}>
      <div className={styles.detailBalance}>
        <span className={styles.detailBalanceVal}>{safeNum(user.beanBalance).toLocaleString('zh-CN')}</span>
        <span className={styles.detailBalanceUnit}>豆</span>
      </div>
      <button
        type="button"
        className={styles.detailAdjustBtn}
        onClick={() => onAdjust(user)}
        aria-label={`调整 ${user.name} 的纯利豆`}
        disabled={isSubmitting}
      >
        调整
      </button>
    </div>
  </div>
);

const PartnerBeansDetailHeader = React.memo(PartnerBeansDetailHeaderComponent);

export default PartnerBeansDetailHeader;
