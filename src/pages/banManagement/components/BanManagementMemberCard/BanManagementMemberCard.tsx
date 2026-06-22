// 封禁管理会员卡片：展示单个会员概览、详情与操作区。
import React from 'react';
import CollapseTransition from '@components/ui/layout/CollapseTransition/CollapseTransition';
import { cx, safeNum, safeStr } from '@utils/utils';
import {
  AVATAR_COLORS,
  LEVEL_LABEL,
  STATUS_LABEL,
} from '../../../memberList/memberList.constants';
import type { MemberListItem } from '../../../memberList/memberList.types';
import { formatFenAmount, formatRelativeTime } from '../../banManagement.utils';
import { BanManagementStatusBadge } from '../BanManagementStatusBadge/BanManagementStatusBadge';
import {
  IconBanCircleSlash,
  IconCalendar,
  IconChevronDown,
  IconInfoCircle,
  IconShieldCheck,
} from '../BanManagementIcons/BanManagementIcons';
import styles from './BanManagementMemberCard.module.less';

interface BanManagementMemberCardProps {
  member: MemberListItem;
  isExpanded: boolean;
  isRefreshing: boolean;
  isSubmitting: boolean;
  onToggleExpand: (id: string) => void;
  onOpenConfirm: (member: MemberListItem, action: 'ban' | 'unban') => void;
}

const BanManagementMemberCardComponent: React.FC<BanManagementMemberCardProps> = ({
  member,
  isExpanded,
  isRefreshing,
  isSubmitting,
  onToggleExpand,
  onOpenConfirm,
}) => {
  const isBanned = member.status === 'banned';
  const avatarColorClassName = styles[`avatarColor_${safeNum(member.avatarColorIdx) % AVATAR_COLORS.length}`];

  return (
    <div className={cx(styles.memberItem, isBanned && styles.memberItemBanned, isExpanded && styles.memberItemExpanded)}>
      <div
        className={styles.memberMain}
        onClick={() => onToggleExpand(member.id)}
        role="button"
        aria-expanded={isExpanded}
        aria-label={`${safeStr(member.name, '会员')}，${STATUS_LABEL[member.status]}，点击展开详情`}
        tabIndex={0}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            onToggleExpand(member.id);
          }
        }}
      >
        <div className={cx(styles.memberAvatar, avatarColorClassName, isBanned && styles.memberAvatarBanned, member.avatarUrl && styles.memberAvatarWithImage)} aria-hidden="true">
          {member.avatarUrl ? (
            <img className={styles.memberAvatarImg} src={member.avatarUrl} alt="" />
          ) : (
            safeStr(member.avatarChar, '会')
          )}
          {isBanned ? (
            <span className={styles.memberAvatarBanIcon} aria-hidden="true">
              <IconBanCircleSlash width={10} height={10} strokeWidth={3} />
            </span>
          ) : null}
        </div>

        <div className={styles.memberInfo}>
          <div className={styles.memberNameRow}>
            <span className={cx(styles.memberName, isBanned && styles.memberNameBanned)}>{safeStr(member.name, '未命名会员')}</span>
            {member.isPartner ? (
              <span className={styles.partnerBadge}>
                合伙人{member.partnerLevel ? ` ${member.partnerLevel}` : ''}
              </span>
            ) : null}
            <span className={styles.levelBadge}>{LEVEL_LABEL[member.level]}</span>
          </div>
          <div className={styles.memberMeta}>
            <span>{safeStr(member.phone, '--')}</span>
            <span className={styles.memberMetaDot} aria-hidden="true" />
            <span>最近活跃 {formatRelativeTime(member.lastActiveAt)}</span>
            {isRefreshing ? (
              <>
                <span className={styles.memberMetaDot} aria-hidden="true" />
                <span>刷新中</span>
              </>
            ) : null}
          </div>
        </div>

        <div className={styles.memberRight}>
          <BanManagementStatusBadge status={member.status} />
          <IconChevronDown className={cx(styles.expandArrow, isExpanded && styles.expandArrowOpen)} />
        </div>
      </div>

      <CollapseTransition expanded={isExpanded} innerClassName={styles.memberDetail}>
        <div className={styles.detailStats}>
          <div className={styles.detailStatItem}>
            <span className={styles.detailStatVal}>
              {safeNum(member.totalRecharged) > 0 ? `¥${formatFenAmount(member.totalRecharged)}` : '—'}
            </span>
            <span className={styles.detailStatLabel}>累计充值</span>
          </div>
          <div className={styles.detailStatDivider} aria-hidden="true" />
          <div className={styles.detailStatItem}>
            <span className={styles.detailStatVal}>{safeNum(member.availablePoints)}</span>
            <span className={styles.detailStatLabel}>积分余额</span>
          </div>
          <div className={styles.detailStatDivider} aria-hidden="true" />
          <div className={styles.detailStatItem}>
            <span className={styles.detailStatVal}>{safeNum(member.invitedCount)}</span>
            <span className={styles.detailStatLabel}>邀请人数</span>
          </div>
          <div className={styles.detailStatDivider} aria-hidden="true" />
          <div className={styles.detailStatItem}>
            <span className={styles.detailStatVal}>{safeNum(member.rechargeCount)}</span>
            <span className={styles.detailStatLabel}>充值次数</span>
          </div>
        </div>

        <div className={styles.detailMeta}>
          <IconCalendar />
          注册于 {new Date(safeNum(member.registeredAt)).toLocaleDateString('zh-CN')}
        </div>

        {isBanned && member.remark ? (
          <div className={styles.banRemarkWrap}>
            <span className={styles.banRemarkIcon} aria-hidden="true">
              <IconInfoCircle />
            </span>
            <span className={styles.banRemarkText}>{safeStr(member.remark)}</span>
          </div>
        ) : null}

        <div className={styles.actionRow}>
          {isBanned ? (
            <button
              type="button"
              className={styles.unbanBtn}
              onClick={() => onOpenConfirm(member, 'unban')}
              aria-label={`解封 ${safeStr(member.name, '会员')}`}
              disabled={isSubmitting}
            >
              <IconShieldCheck width={15} height={15} strokeWidth={2.2} />
              {isSubmitting ? '处理中...' : '解除封禁'}
            </button>
          ) : (
            <button
              type="button"
              className={styles.banBtn}
              onClick={() => onOpenConfirm(member, 'ban')}
              aria-label={`封禁 ${safeStr(member.name, '会员')}`}
              disabled={isSubmitting}
            >
              <IconBanCircleSlash width={15} height={15} strokeWidth={2.2} />
              {isSubmitting ? '处理中...' : '封禁账号'}
            </button>
          )}
        </div>
      </CollapseTransition>
    </div>
  );
};

export const BanManagementMemberCard = React.memo(BanManagementMemberCardComponent);

BanManagementMemberCard.displayName = 'BanManagementMemberCard';
