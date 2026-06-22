import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { cx, safeNum } from '@utils/utils';
import {
  IconArrowRight,
  IconCheck,
  IconClose,
} from '@pages/memberDetail/components/MemberDetailIcons/MemberDetailIcons';
import type { MemberDetail } from '@pages/memberList/memberList.types';
import styles from './MemberAssetAdjustModal.module.less';

export type MemberAssetAdjustDir = 'add' | 'subtract';

interface DirOption {
  value: MemberAssetAdjustDir;
  label: string;
  sign: string;
}

export interface MemberAssetAdjustModalProps {
  member: MemberDetail;
  currentValue: number;
  title: string;
  amountPlaceholder: string;
  amountAriaLabel: string;
  reasonAriaLabel: string;
  balanceLabel: string;
  unitLabel: string;
  confirmVerbLabel: string;
  icon: React.ReactNode;
  reasonPresets: string[];
  presetAmounts: number[];
  dirOptions: DirOption[];
  onClose: () => void;
  onConfirm: (delta: number, reason: string) => Promise<void> | void;
}

const getAvatarClassName = (colorIndex: number): string => {
  switch (colorIndex % 6) {
    case 1:
      return styles.userAvatarBlue;
    case 2:
      return styles.userAvatarPurple;
    case 3:
      return styles.userAvatarAmber;
    case 4:
      return styles.userAvatarEmerald;
    case 5:
      return styles.userAvatarRose;
    default:
      return styles.userAvatarGreen;
  }
};

const MemberAssetAdjustModal: React.FC<MemberAssetAdjustModalProps> = ({
  member,
  currentValue,
  title,
  amountPlaceholder,
  amountAriaLabel,
  reasonAriaLabel,
  balanceLabel,
  unitLabel,
  confirmVerbLabel,
  icon,
  reasonPresets,
  presetAmounts,
  dirOptions,
  onClose,
  onConfirm,
}) => {
  const [dir, setDir] = useState<MemberAssetAdjustDir>('add');
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const parsedAmount = useMemo(() => Math.max(0, parseInt(amount, 10) || 0), [amount]);
  const delta = dir === 'add' ? parsedAmount : -parsedAmount;
  const previewBalance = Math.max(0, safeNum(currentValue) + delta);
  const isValid = parsedAmount > 0 && reason.trim().length > 0;
  const avatarClassName = getAvatarClassName(member.avatarColorIdx);

  useEffect(() => {
    const handler = (event: KeyboardEvent): void => {
      if (event.key === 'Escape' && !isSubmitting) {
        onClose();
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isSubmitting, onClose]);

  const handleConfirm = useCallback(async (): Promise<void> => {
    if (!isValid || isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    try {
      await Promise.resolve(onConfirm(delta, reason.trim()));
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  }, [delta, isSubmitting, isValid, onClose, onConfirm, reason]);

  const handleAmountChange = useCallback((event: React.ChangeEvent<HTMLInputElement>): void => {
    setAmount(event.target.value.replace(/\D/g, ''));
  }, []);

  return (
    <div
      className={styles.overlay}
      role="dialog"
      aria-modal="true"
      aria-label={title}
      onClick={(event) => {
        if (!isSubmitting && event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div className={styles.sheet}>
        <div className={styles.dragHandle} aria-hidden="true" />

        <div className={styles.sheetHeader}>
          <div className={styles.sheetTitleWrap}>
            <div className={styles.sheetTitleIcon} aria-hidden="true">
              {icon}
            </div>
            <span className={styles.sheetTitle}>{title}</span>
          </div>
          <button type="button" className={styles.closeBtn} onClick={onClose} aria-label="关闭" disabled={isSubmitting}>
            <IconClose />
          </button>
        </div>

        <div className={styles.sheetBody}>
          <div className={styles.userCard}>
            <div className={cx(styles.userAvatar, avatarClassName, member.avatarUrl && styles.userAvatarWithImage)} aria-hidden="true">
              {member.avatarUrl ? (
                <img className={styles.userAvatarImg} src={member.avatarUrl} alt="" />
              ) : (
                member.avatarChar
              )}
            </div>
            <div className={styles.userInfo}>
              <div className={styles.userNameRow}>
                <span className={styles.userName}>{member.name}</span>
                {member.isPartner ? (
                  <span className={styles.partnerBadge}>{member.partnerLevel || '合伙人'}</span>
                ) : null}
              </div>
              <span className={styles.userPhone}>{member.phone}</span>
            </div>
            <div className={styles.balanceBox}>
              <span className={styles.balanceVal}>{safeNum(currentValue).toLocaleString('zh-CN')}</span>
              <span className={styles.balanceLbl}>{balanceLabel}</span>
            </div>
          </div>

          <div className={styles.field}>
            <label className={styles.fieldLabel}>调整方向</label>
            <div className={styles.dirRow}>
              {dirOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  className={cx(
                    styles.dirBtn,
                    dir === option.value && styles.dirBtnActive,
                    option.value === 'add' ? styles.dirBtnAdd : styles.dirBtnSubtract,
                  )}
                  onClick={() => setDir(option.value)}
                  aria-pressed={dir === option.value}
                >
                  <span
                    className={cx(
                      styles.dirSign,
                      dir === option.value && styles.dirSignActive,
                      option.value === 'add' ? styles.dirSignAdd : styles.dirSignSubtract,
                    )}
                  >
                    {option.sign}
                  </span>
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          <div className={styles.field}>
            <label className={styles.fieldLabel}>{confirmVerbLabel}数量</label>
            <input
              className={styles.amountInput}
              type="text"
              inputMode="numeric"
              placeholder={amountPlaceholder}
              value={amount}
              onChange={handleAmountChange}
              maxLength={6}
              aria-label={amountAriaLabel}
            />
            <div className={styles.presetRow}>
              {presetAmounts.map((value) => (
                <button
                  key={value}
                  type="button"
                  className={cx(styles.presetBtn, amount === String(value) && styles.presetBtnActive)}
                  onClick={() => setAmount(String(value))}
                >
                  {value}
                </button>
              ))}
            </div>
          </div>

          <div className={styles.field}>
            <label className={styles.fieldLabel}>
              调整原因
              <span className={styles.requiredMark} aria-hidden="true">*</span>
            </label>
            <textarea
              className={styles.reasonInput}
              placeholder="请输入调整原因..."
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              maxLength={100}
              rows={2}
              aria-label={reasonAriaLabel}
            />
            <div className={styles.reasonPresets}>
              {reasonPresets.map((presetReason) => (
                <button
                  key={presetReason}
                  type="button"
                  className={cx(styles.reasonPresetBtn, reason === presetReason && styles.reasonPresetBtnActive)}
                  onClick={() => setReason(presetReason)}
                >
                  {presetReason}
                </button>
              ))}
            </div>
          </div>

          {parsedAmount > 0 ? (
            <div className={styles.previewCard}>
              <span className={styles.previewLabel}>操作后余额预览</span>
              <div className={styles.previewRow}>
                <span className={styles.previewOld}>{safeNum(currentValue).toLocaleString('zh-CN')}</span>
                <IconArrowRight stroke="#94a3b8" />
                <span className={cx(styles.previewNew, dir === 'add' ? styles.previewNewAdd : styles.previewNewSub)}>
                  {safeNum(previewBalance).toLocaleString('zh-CN')}
                </span>
                <span className={styles.previewUnit}>{unitLabel}</span>
              </div>
              <div className={cx(styles.previewDelta, dir === 'add' ? styles.previewDeltaAdd : styles.previewDeltaSub)}>
                {dir === 'add' ? '+' : '-'}{safeNum(parsedAmount)}
              </div>
            </div>
          ) : null}

          {parsedAmount > 0 && reason.trim().length === 0 ? (
            <p className={styles.validationHint}>请填写调整原因后再确认</p>
          ) : null}
        </div>

        <div className={styles.sheetActions}>
          <button type="button" className={styles.cancelBtn} onClick={onClose} disabled={isSubmitting}>
            取消
          </button>
          <button
            type="button"
            className={cx(styles.confirmBtn, dir === 'subtract' && styles.confirmBtnDanger)}
            onClick={handleConfirm}
            disabled={!isValid || isSubmitting}
          >
            <IconCheck />
            {isSubmitting ? '提交中...' : `确认${dir === 'add' ? '增加' : '减少'}${parsedAmount > 0 ? ` ${parsedAmount} ` : ' '}${unitLabel}`}
          </button>
        </div>
      </div>
    </div>
  );
};

export default MemberAssetAdjustModal;
