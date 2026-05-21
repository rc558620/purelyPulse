// 会员详情横幅区块：展示身份信息、等级状态与快捷操作。
import React from 'react';
import { cx, safeStr } from '@utils/utils';
import {
  IconBanCircle,
  IconShieldCheck,
  IconStarBadge,
} from '@pages/memberDetail/components/MemberDetailIcons/MemberDetailIcons';
import { LEVEL_LABEL, STATUS_LABEL } from '@pages/memberList/memberList.constants';
import type { MemberDetail, MemberLevel } from '@pages/memberList/memberList.types';
import { formatMemberDate, formatMemberRelativeTime } from '../../../../../memberDetail.utils';
import pageStyles from '../../../../../memberDetail.module.less';
import styles from './MemberDetailHeroSection.module.less';

interface MemberDetailHeroSectionProps {
  member: MemberDetail;
  memberLevel: MemberLevel;
  membershipExpiryText: string | null;
  isBannedMember: boolean;
  isSubmittingAction: boolean;
  isSubmittingMembership: boolean;
  isSubmittingBan: boolean;
  onOpenMembershipModal: () => void;
  onOpenStatusModal: () => void;
}

const STATUS_CLASS_MAP = {
  active: pageStyles.statusActive,
  inactive: pageStyles.statusInactive,
  banned: pageStyles.statusBanned,
} as const;

const MemberDetailHeroSection: React.FC<MemberDetailHeroSectionProps> = React.memo(({
  member,
  memberLevel,
  membershipExpiryText,
  isBannedMember,
  isSubmittingAction,
  isSubmittingMembership,
  isSubmittingBan,
  onOpenMembershipModal,
  onOpenStatusModal,
}) => {
  const heroAvatarColorClassName = pageStyles[`heroAvatarColor_${member.avatarColorIdx % 6}`];

  return (
    <div className={styles.root}>
      <div className={pageStyles.heroBanner}>
        <div className={cx(pageStyles.heroAvatar, heroAvatarColorClassName)} aria-hidden="true">
          {safeStr(member.avatarChar, '会')}
          {member.isPartner ? <span className={pageStyles.heroPartnerDot} aria-label="合伙人" /> : null}
        </div>

        <div className={pageStyles.heroInfo}>
          <div className={pageStyles.heroNameRow}>
            <h1 className={pageStyles.heroName}>{safeStr(member.name, '未命名会员')}</h1>
            <span className={cx(pageStyles.heroLevelBadge, pageStyles[`hlevel_${memberLevel}`])}>
              {LEVEL_LABEL[memberLevel]}
            </span>
            {member.isPartner ? (
              <span className={pageStyles.heroPartnerBadge}>
                {safeStr(member.partnerLevel, '合伙人')}
              </span>
            ) : null}
          </div>
          <div className={pageStyles.heroPhone}>{safeStr(member.phone, '--')}</div>
          <div className={pageStyles.heroBottomRow}>
            <span className={cx(pageStyles.heroStatus, STATUS_CLASS_MAP[member.status])}>
              {STATUS_LABEL[member.status]}
            </span>
            <span className={pageStyles.heroJoined}>加入于 {formatMemberDate(member.registeredAt)}</span>
            <span className={pageStyles.heroActive}>活跃 {formatMemberRelativeTime(member.lastActiveAt)}</span>
            {membershipExpiryText ? (
              <span className={cx(pageStyles.heroMembershipExpiry, memberLevel === 'lifetime' && pageStyles.heroMembershipExpiryLifetime)}>
                {memberLevel === 'lifetime' ? '♾ ' : '📅 '}
                {membershipExpiryText}
              </span>
            ) : null}
          </div>
          <div className={pageStyles.heroActionRow}>
            <button
              type="button"
              className={pageStyles.setMembershipBtn}
              onClick={onOpenMembershipModal}
              aria-label="设置会员等级"
              disabled={isSubmittingAction}
            >
              <IconStarBadge width={13} height={13} strokeWidth={2.5} />
              {isSubmittingMembership ? '设置中...' : '设置会员等级'}
            </button>
            <button
              type="button"
              className={cx(pageStyles.memberStatusBtn, isBannedMember ? pageStyles.memberStatusBtnSafe : pageStyles.memberStatusBtnDanger)}
              onClick={onOpenStatusModal}
              aria-label={isBannedMember ? '解除会员封禁' : '封禁会员'}
              disabled={isSubmittingAction}
            >
              {isBannedMember ? (
                <IconShieldCheck width={13} height={13} strokeWidth={2.3} />
              ) : (
                <IconBanCircle width={13} height={13} strokeWidth={2.3} />
              )}
              {isSubmittingBan ? (isBannedMember ? '解封中...' : '封禁中...') : (isBannedMember ? '解除封禁' : '封禁账号')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
});

MemberDetailHeroSection.displayName = 'MemberDetailHeroSection';

export default MemberDetailHeroSection;
