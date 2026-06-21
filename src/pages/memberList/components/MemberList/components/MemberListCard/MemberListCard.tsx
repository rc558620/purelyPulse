// 会员列表卡片：单条会员信息的展示单元。
import React, { memo, useMemo } from 'react';
import { cx, safeNum, safeStr } from '@utils/utils';
import {
  IconBeanCoin,
  IconChevronRight,
  IconStarBadge,
} from '../MemberListIcons/MemberListIcons';
import { LEVEL_LABEL } from '../../../../memberList.constants';
import { formatMemberAmount, formatMemberRelativeTime, formatMemberExpiry } from '../../../../memberList.utils';
import type { MemberListItem } from '../../../../memberList.types';
import styles from '../../../../memberList.module.less';

interface MemberListCardProps {
  /** 会员数据 */
  member: MemberListItem;
  /** 卡片点击回调，参数为会员 id */
  onClick: (id: string) => void;
}

const MemberListCard: React.FC<MemberListCardProps> = ({ member, onClick }) => {
  const avatarColorClassName = useMemo(() => styles[`avatarColor_${member.avatarColorIdx % 6}`], [member.avatarColorIdx]);
  const memberName = useMemo(() => safeStr(member.name, '未命名会员'), [member.name]);
  const memberPhone = useMemo(() => safeStr(member.phone, '--'), [member.phone]);
  const avatarChar = useMemo(() => safeStr(member.avatarChar, '会'), [member.avatarChar]);
  const pointsText = useMemo(() => `${safeNum(member.availablePoints).toLocaleString('zh-CN')} 积分`, [member.availablePoints]);
  const beanText = useMemo(() => `${safeNum(member.beanBalance).toLocaleString('zh-CN')} 豆`, [member.beanBalance]);
  const activeTimeText = useMemo(() => `活跃 ${formatMemberRelativeTime(member.lastActiveAt)}`, [member.lastActiveAt]);
  const rechargeAmountText = useMemo(() => `¥${formatMemberAmount(member.totalRecharged)}`, [member.totalRecharged]);
  const expiryText = useMemo(() => formatMemberExpiry(member.membershipExpiry, member.level), [member.membershipExpiry, member.level]);
  const ariaLabel = useMemo(() => `查看 ${safeStr(member.name, '会员')} 的会员详情`, [member.name]);

  return (
    <button
      type="button"
      className={styles.memberCard}
      onClick={() => onClick(member.id)}
      aria-label={ariaLabel}
    >
      {/* 头像 */}
      <div
        className={cx(styles.memberAvatar, avatarColorClassName)}
        aria-hidden="true"
      >
        {avatarChar}
        {member.isPartner && (
          <span className={styles.partnerDot} aria-label="合伙人" />
        )}
      </div>

      {/* 姓名 / 手机 / 数据摘要 */}
      <div className={styles.memberInfo}>
        <div className={styles.memberNameRow}>
          <span className={styles.memberName}>{memberName}</span>
          <span className={cx(styles.levelBadge, styles[`level_${member.level}`])}>
            {LEVEL_LABEL[member.level]}
          </span>
          {expiryText && (
            <span className={styles.expiryBadge}>{expiryText}</span>
          )}
          {member.isPartner && (
            <span className={styles.partnerBadge}>合伙人</span>
          )}
        </div>
        <div className={styles.memberPhone}>{memberPhone}</div>
        <div className={styles.memberMeta}>
          <span className={styles.metaItem}>
            <IconStarBadge width={11} height={11} strokeWidth={2.5} />
            {pointsText}
          </span>
          {safeNum(member.beanBalance) > 0 && (
            <span className={styles.metaItem}>
              <IconBeanCoin width={11} height={11} strokeWidth={2.5} />
              {beanText}
            </span>
          )}
          <span className={styles.metaItemTime}>
            {activeTimeText}
          </span>
        </div>
      </div>

      {/* 右侧：累计充值 + 箭头 */}
      <div className={styles.memberRight}>
        <div className={styles.memberRecharge}>
          <span className={styles.rechargeAmt}>{rechargeAmountText}</span>
          <span className={styles.rechargeLabel}>累计充值</span>
        </div>
        <IconChevronRight className={styles.memberArrow} />
      </div>
    </button>
  );
};

export default memo(MemberListCard);
