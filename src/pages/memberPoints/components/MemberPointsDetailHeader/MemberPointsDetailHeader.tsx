// memberPoints 单会员详情头部：头像 / 姓名 / 当前积分 / 快捷调整入口
import React from 'react';
import { cx, safeNum, safeStr } from '@utils/utils';
import type { MemberPointsPageUser } from '../../memberPoints.types';
import styles from './MemberPointsDetailHeader.module.less';

interface MemberPointsDetailHeaderProps {
  user: MemberPointsPageUser;
  isSubmitting: boolean;
  onAdjust: (user: MemberPointsPageUser) => void;
}

const MemberPointsDetailHeaderComponent: React.FC<MemberPointsDetailHeaderProps> = ({
  user,
  isSubmitting,
  onAdjust,
}) => (
  <div className={styles.detailHeaderCard}>
    <div className={cx(styles.detailAvatar, user.avatarUrl && styles.detailAvatarWithImage)} aria-hidden="true">
      {user.avatarUrl ? (
        <img className={styles.detailAvatarImg} src={user.avatarUrl} alt="" />
      ) : (
        safeStr(user.name, '会').slice(0, 1)
      )}
    </div>
    <div className={styles.detailInfo}>
      <div className={styles.detailNameRow}>
        <span className={styles.detailName}>{user.name}</span>
        {user.isPartner ? (
          <span className={styles.detailPartnerTag}>合伙人</span>
        ) : null}
      </div>
      <span className={styles.detailPhone}>{user.phone}</span>
    </div>
    <div className={styles.detailRight}>
      <div className={styles.detailBalance}>
        <span className={styles.detailBalanceVal}>{safeNum(user.availablePoints).toLocaleString('zh-CN')}</span>
        <span className={styles.detailBalanceUnit}>积分</span>
      </div>
      <button
        type="button"
        className={styles.detailAdjustBtn}
        onClick={() => onAdjust(user)}
        aria-label={`调整 ${user.name} 的积分`}
        disabled={isSubmitting}
      >
        调整
      </button>
    </div>
  </div>
);

const MemberPointsDetailHeader = React.memo(MemberPointsDetailHeaderComponent);

export default MemberPointsDetailHeader;
