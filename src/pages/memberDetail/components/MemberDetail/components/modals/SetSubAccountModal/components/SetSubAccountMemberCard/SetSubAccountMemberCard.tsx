// SetSubAccountMemberCard：展示会员摘要与当前子账号配额。
import React, { useMemo } from 'react';
import { cx, safeStr } from '@utils/utils';
import { IconSlotGrid } from '@pages/memberDetail/components/MemberDetailIcons/MemberDetailIcons';
import { LEVEL_LABEL } from '@pages/memberList/memberList.constants';
import type { MemberDetail, MemberLevel } from '@pages/memberList/memberList.types';
import styles from '../../SetSubAccountModal.module.less';

interface SetSubAccountMemberCardProps {
  member: MemberDetail;
  currentLevel: MemberLevel;
  initialQuota: number;
}

const getAvatarColorClass = (colorIdx: number): string => styles[`avatarColor_${colorIdx % 6}`] ?? '';

const SetSubAccountMemberCard: React.FC<SetSubAccountMemberCardProps> = ({
  member,
  currentLevel,
  initialQuota,
}) => {
  const levelBadgeClassName = useMemo((): string => {
    if (currentLevel === 'annual') {
      return styles.levelBadgeAnnual;
    }

    if (currentLevel === 'lifetime') {
      return styles.levelBadgeLifetime;
    }

    return styles.levelBadgeOther;
  }, [currentLevel]);

  return (
    <div className={styles.memberCard}>
      <div
        className={cx(styles.memberAvatar, getAvatarColorClass(member.avatarColorIdx), member.avatarUrl && styles.memberAvatarWithImage)}
        aria-hidden="true"
      >
        {member.avatarUrl ? (
          <img className={styles.memberAvatarImg} src={member.avatarUrl} alt="" />
        ) : (
          safeStr(member.avatarChar, '会')
        )}
      </div>
      <div className={styles.memberInfo}>
        <div className={styles.memberNameRow}>
          <span className={styles.memberName}>{safeStr(member.name, '未命名会员')}</span>
          <span className={cx(styles.memberLevelBadge, levelBadgeClassName)}>
            {LEVEL_LABEL[currentLevel]}
          </span>
        </div>
        <div className={styles.memberPhone}>{safeStr(member.phone, '--')}</div>
      </div>
      <div
        className={cx(
          styles.memberQuotaTag,
          initialQuota > 0 ? styles.memberQuotaTagActive : styles.memberQuotaTagNone,
        )}
      >
        <IconSlotGrid width={11} height={11} />
        {initialQuota > 0 ? `${initialQuota} 个子账号` : '未开通'}
      </div>
    </div>
  );
};

export default SetSubAccountMemberCard;
