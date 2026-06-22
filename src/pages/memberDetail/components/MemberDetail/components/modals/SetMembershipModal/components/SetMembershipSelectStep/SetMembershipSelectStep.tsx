import React from 'react';
import { cx } from '@utils/utils';
import {
  IconArrowRight,
  IconCheck,
  IconInfoCircle,
  IconMembershipDuration,
  IconWarningTriangle,
} from '@pages/memberDetail/components/MemberDetailIcons/MemberDetailIcons';
import { AVATAR_COLORS } from '@pages/memberList/memberList.constants';
import type { MemberDetail, MemberLevel } from '@pages/memberList/memberList.types';
import type { ModalMembershipSelection } from '../../SetMembershipModal';
import styles from '../../SetMembershipModal.module.less';

interface DurationOption {
  value: ModalMembershipSelection;
  label: string;
  shortLabel: string;
  desc: string;
  daysBase: number;
  color: string;
  gradientFrom: string;
  gradientTo: string;
}

interface MultiplierOption {
  value: number;
  label: string;
}

interface SetMembershipSelectStepProps {
  member: MemberDetail;
  currentLevel: MemberLevel;
  currentExpiry: number | null | undefined;
  currentLevelLabel: string;
  isCurrentLifetime: boolean;
  selectedDuration: ModalMembershipSelection;
  multiplier: number;
  selectedOption: DurationOption;
  isLifetime: boolean;
  isFree: boolean;
  addedDays: number;
  newExpiry: number | null;
  now: number;
  durationOptions: DurationOption[];
  multiplierOptions: MultiplierOption[];
  onDurationChange: (value: ModalMembershipSelection) => void;
  onMultiplierChange: (value: number) => void;
  formatMembershipExpiry: (timestamp: number) => string;
  formatMembershipDaysLeft: (timestamp: number) => string;
  lifetimeMembershipDays: number;
}

const getCurrentLevelBadgeStyle = (currentLevel: MemberLevel): React.CSSProperties => ({
  background: currentLevel === 'free' ? 'rgba(148,163,184,0.15)' :
    currentLevel === 'monthly' ? 'rgba(59,130,246,0.12)' :
    currentLevel === 'quarterly' ? 'rgba(132,204,22,0.14)' :
    currentLevel === 'annual' ? 'rgba(245,158,11,0.14)' :
    'rgba(168,85,247,0.14)',
  color: currentLevel === 'free' ? '#94a3b8' :
    currentLevel === 'monthly' ? '#3b82f6' :
    currentLevel === 'quarterly' ? '#5a9e08' :
    currentLevel === 'annual' ? '#d97706' :
    '#9333ea',
});

const SetMembershipSelectStep: React.FC<SetMembershipSelectStepProps> = ({
  member,
  currentLevel,
  currentExpiry,
  currentLevelLabel,
  isCurrentLifetime,
  selectedDuration,
  multiplier,
  selectedOption,
  isLifetime,
  isFree,
  addedDays,
  newExpiry,
  now,
  durationOptions,
  multiplierOptions,
  onDurationChange,
  onMultiplierChange,
  formatMembershipExpiry,
  formatMembershipDaysLeft,
  lifetimeMembershipDays,
}) => {
  const avatarBg = AVATAR_COLORS[member.avatarColorIdx % AVATAR_COLORS.length];
  // 当前是付费会员，切换到免费会员属于降级
  const isDowngradeToFree = isFree && currentLevel !== 'free';

  return (
  <div className={styles.sheetBody}>
    <div className={styles.userCard}>
      <div className={cx(styles.userAvatar, member.avatarUrl && styles.userAvatarWithImage)} style={member.avatarUrl ? undefined : { background: avatarBg }} aria-hidden="true">
        {member.avatarUrl ? (
          <img className={styles.userAvatarImg} src={member.avatarUrl} alt="" />
        ) : (
          member.avatarChar
        )}
      </div>
      <div className={styles.userInfo}>
        <div className={styles.userNameRow}>
          <span className={styles.userName}>{member.name}</span>
          <span className={styles.currentLevelBadge} style={getCurrentLevelBadgeStyle(currentLevel)}>
            当前：{currentLevelLabel}
          </span>
        </div>
        <span className={styles.userPhone}>{member.phone}</span>
      </div>
      <div className={styles.expiryBox}>
        {currentExpiry ? (
          <>
            <span className={styles.expiryVal}>{formatMembershipExpiry(currentExpiry)}</span>
            <span className={styles.expiryLbl}>{formatMembershipDaysLeft(currentExpiry)}</span>
          </>
        ) : isCurrentLifetime ? (
          <>
            <span className={styles.expiryPermanent}>待写入 {lifetimeMembershipDays} 天有效期</span>
            <span className={styles.expiryLbl}>到期时间</span>
          </>
        ) : (
          <>
            <span className={styles.expiryNone}>暂未设置</span>
            <span className={styles.expiryLbl}>到期时间</span>
          </>
        )}
      </div>
    </div>

    <div className={styles.field}>
      <label className={styles.fieldLabel}>选择会员类型</label>
      <div className={styles.durationGrid}>
        {durationOptions.map((option) => {
          const isActive = selectedDuration === option.value;
          return (
            <button
              key={option.value}
              type="button"
              className={cx(styles.durationCard, isActive && styles.durationCardActive)}
              style={isActive ? ({
                '--dur-color': option.color,
                '--dur-grad-from': option.gradientFrom,
                '--dur-grad-to': option.gradientTo,
                borderColor: `${option.color}55`,
                background: `linear-gradient(135deg, ${option.gradientFrom}, ${option.gradientTo})`,
              } as React.CSSProperties) : undefined}
              onClick={() => onDurationChange(option.value)}
              aria-pressed={isActive}
            >
              {isActive ? (
                <span className={styles.durationCheck} style={{ background: option.color }} aria-hidden="true">
                  <IconCheck width={9} height={9} stroke="#fff" strokeWidth={3.5} />
                </span>
              ) : null}
              <div
                className={styles.durationIcon}
                style={isActive ? { background: `${option.color}22`, color: option.color } : undefined}
                aria-hidden="true"
              >
                <IconMembershipDuration duration={option.value} />
              </div>
              <span className={styles.durationLabel} style={isActive ? { color: option.color } : undefined}>
                {option.label}
              </span>
              <span className={styles.durationDesc}>{option.desc}</span>
            </button>
          );
        })}
      </div>
    </div>

    {!isFree ? (
      <div className={styles.field}>
        <label className={styles.fieldLabel}>
          {isLifetime ? '有效期配置' : '追加期数'}
          <span className={styles.fieldLabelSub}>（每期 {selectedOption.daysBase} 天）</span>
        </label>
        {!isLifetime ? (
          <div className={styles.multiplierRow}>
            {multiplierOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                className={cx(styles.multiplierBtn, multiplier === option.value && styles.multiplierBtnActive)}
                style={multiplier === option.value ? ({
                  borderColor: selectedOption.color,
                  background: `${selectedOption.color}18`,
                  color: selectedOption.color,
                } as React.CSSProperties) : undefined}
                onClick={() => onMultiplierChange(option.value)}
                aria-pressed={multiplier === option.value}
              >
                {option.label}
              </button>
            ))}
          </div>
        ) : null}
        <div className={styles.addedDaysHint}>
          {isLifetime ? '本次写入' : '本次追加'}
          <strong style={{ color: selectedOption.color }}> {addedDays} </strong>
          天
        </div>
      </div>
    ) : null}

    {isLifetime ? (
      <div
        className={styles.lifetimeNotice}
        style={{ borderColor: `${selectedOption.color}40`, background: `${selectedOption.color}0a` }}
      >
        <div className={styles.lifetimeNoticeIcon} style={{ color: selectedOption.color }} aria-hidden="true">
          <IconInfoCircle width={15} height={15} strokeWidth={2.2} />
        </div>
        <p className={styles.lifetimeNoticeText}>
          设置为永久会员后将按<strong>{lifetimeMembershipDays} 天有效期</strong>写入，并在详情页展示真实到期时间。
        </p>
      </div>
    ) : null}

    {isFree ? (
      <div
        className={styles.freeNotice}
        style={{ borderColor: `${selectedOption.color}40`, background: `${selectedOption.color}0a` }}
      >
        <div className={styles.freeNoticeIcon} style={{ color: selectedOption.color }} aria-hidden="true">
          <IconInfoCircle width={15} height={15} strokeWidth={2.2} />
        </div>
        <p className={styles.freeNoticeText}>
          免费会员仅享有<strong>基础权益</strong>，不含订阅特权。可随时升级为付费会员。
        </p>
      </div>
    ) : null}

    {!isFree ? (
      <div
        className={styles.previewCard}
        style={{ borderColor: `${selectedOption.color}33`, background: `${selectedOption.color}08` }}
      >
        <div className={styles.previewRow}>
          <span className={styles.previewLabel}>操作后等级</span>
          <span
            className={styles.previewLevelBadge}
            style={{
              background: `${selectedOption.color}20`,
              color: selectedOption.color,
              borderColor: `${selectedOption.color}40`,
            }}
          >
            {selectedOption.label}
          </span>
        </div>
        <div className={styles.previewDivider} />
        <div className={styles.previewRow}>
          <span className={styles.previewLabel}>到期时间</span>
          {newExpiry ? (
            <div className={styles.previewExpiryWrap}>
              {currentExpiry && currentExpiry > now && !isCurrentLifetime ? (
                <>
                  <span className={styles.previewExpiryOld}>{formatMembershipExpiry(currentExpiry)}</span>
                  <IconArrowRight width={12} height={12} stroke="#94a3b8" />
                </>
              ) : null}
              <span className={styles.previewExpiryNew} style={{ color: selectedOption.color }}>
                {formatMembershipExpiry(newExpiry)}
              </span>
              <span className={styles.previewExpiryDaysLeft}>
                {formatMembershipDaysLeft(newExpiry)}
              </span>
            </div>
          ) : null}
        </div>
        <div className={styles.previewRow}>
          <span className={styles.previewLabel}>{isLifetime ? '有效期天数' : '追加天数'}</span>
          <span className={styles.previewAddedDays} style={{ color: selectedOption.color }}>
            +{addedDays} 天
          </span>
        </div>
      </div>
    ) : null}

    {isCurrentLifetime && !isLifetime ? (
      <div className={styles.downgradeWarning}>
        <IconWarningTriangle width={14} height={14} strokeWidth={2.2} />
        {isFree
          ? '当前为永久会员，本操作将切换为免费会员，订阅权益将立即停止'
          : `当前为永久会员，本操作将切换为${selectedOption.label}，到期后需续期`}
      </div>
    ) : null}

    {isDowngradeToFree && !isCurrentLifetime ? (
      <div className={styles.downgradeWarning}>
        <IconWarningTriangle width={14} height={14} strokeWidth={2.2} />
        降级为免费会员后，当前订阅权益将立即停止
      </div>
    ) : null}
  </div>
  );
};

export default SetMembershipSelectStep;
