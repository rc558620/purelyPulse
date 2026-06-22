// 积分调整弹窗：负责积分增减、原因填写与余额预览。
import React, { useCallback, useState } from 'react';
import OperationModalShell from '@components/overlay/OperationModalShell/OperationModalShell';
import { cx, isNonEmptyArray, safeNum } from '@utils/utils';
import {
  IconMemberPointsBadge,
  IconMemberPointsConfirm,
  IconMemberPointsPreviewArrow,
} from '../MemberPointsIcons/MemberPointsIcons';
import type {
  AdjustPointsDirButtonStyle,
  AdjustPointsDirOption,
  AdjustPointsDirSignStyle,
  AdjustPointsModalProps,
} from './AdjustPointsModal.types';
import styles from './AdjustPointsModal.module.less';

const DIR_OPTIONS: AdjustPointsDirOption[] = [
  { value: 'add', label: '增加积分', sign: '+', color: '#84cc16' },
  { value: 'subtract', label: '减少积分', sign: '-', color: '#f97316' },
];

const PRESET_AMOUNTS = [50, 100, 200, 500];

const REASON_PRESETS = [
  '活动奖励积分',
  '老会员回馈积分',
  '补偿用户积分',
  '管理员手动扣减',
  '系统错误修正',
];

const AdjustPointsModal: React.FC<AdjustPointsModalProps> = ({
  user,
  onClose,
  onConfirm,
  isSubmitting = false,
}) => {
  const [dir, setDir] = useState<AdjustPointsDirOption['value']>('add');
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');

  const parsedAmount = Math.max(0, parseInt(amount, 10) || 0);
  const delta = dir === 'add' ? parsedAmount : -parsedAmount;
  const previewBalance = user.availablePoints + delta;
  const isValid = parsedAmount > 0 && reason.trim().length > 0;

  const handleConfirm = useCallback((): void => {
    if (!isValid || isSubmitting) {
      return;
    }

    void onConfirm(user.id, delta, reason.trim());
  }, [delta, isSubmitting, isValid, onConfirm, reason, user.id]);

  const handleAmountChange = useCallback((event: React.ChangeEvent<HTMLInputElement>): void => {
    const nextValue = event.target.value.replace(/\D/g, '');
    setAmount(nextValue);
  }, []);

  const confirmText = isSubmitting
    ? '提交中...'
    : `确认${dir === 'add' ? '增加' : '减少'}${parsedAmount > 0 ? ` ${parsedAmount} ` : ' '}积分`;

  return (
    <OperationModalShell
      ariaLabel="调整用户积分"
      icon={<IconMemberPointsBadge />}
      title="调整积分"
      confirmText={confirmText}
      confirmIcon={<IconMemberPointsConfirm />}
      onClose={onClose}
      onConfirm={handleConfirm}
      confirmDisabled={!isValid || isSubmitting}
      variant="center"
      maxWidth="44rem"
    >
      <div className={styles.body}>
        <div className={styles.userCard}>
          <div className={cx(styles.userAvatar, user.avatarUrl && styles.userAvatarWithImage)} aria-hidden="true">
            {user.avatarUrl ? <img className={styles.userAvatarImg} src={user.avatarUrl} alt="" /> : user.name[0]}
          </div>
          <div className={styles.userInfo}>
            <span className={styles.userName}>{user.name}</span>
            <span className={styles.userPhone}>{user.phone}</span>
          </div>
          <div className={styles.balanceBox}>
            <span className={styles.balanceVal}>{safeNum(user.availablePoints).toLocaleString('zh-CN')}</span>
            <span className={styles.balanceLbl}>当前积分</span>
          </div>
        </div>

        <div className={styles.field}>
          <label className={styles.fieldLabel}>调整方向</label>
          <div className={styles.dirRow}>
            {isNonEmptyArray(DIR_OPTIONS) ? DIR_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                className={cx(styles.dirBtn, dir === option.value && styles.dirBtnActive)}
                style={dir === option.value ? ({
                  '--dir-color': option.color,
                  '--dir-color-bg': `${option.color}15`,
                } as AdjustPointsDirButtonStyle) : undefined}
                onClick={() => setDir(option.value)}
                aria-pressed={dir === option.value}
                disabled={isSubmitting}
              >
                <span
                  className={cx(styles.dirSign, dir === option.value && styles.dirSignActive)}
                  style={dir === option.value ? ({ '--sign-color': option.color } as AdjustPointsDirSignStyle) : undefined}
                >
                  {option.sign}
                </span>
                {option.label}
              </button>
            )) : null}
          </div>
        </div>

        <div className={styles.field}>
          <label className={styles.fieldLabel} htmlFor="adjust-points-amount">
            调整数量
          </label>
          <div className={styles.amountRow}>
            <input
              id="adjust-points-amount"
              className={styles.amountInput}
              type="text"
              inputMode="numeric"
              placeholder="输入积分数量"
              value={amount}
              onChange={handleAmountChange}
              maxLength={6}
              aria-label="积分调整数量"
              disabled={isSubmitting}
            />
          </div>
          <div className={styles.presetRow}>
            {isNonEmptyArray(PRESET_AMOUNTS) ? PRESET_AMOUNTS.map((presetAmount) => (
              <button
                key={presetAmount}
                type="button"
                className={cx(styles.presetBtn, amount === String(presetAmount) && styles.presetBtnActive)}
                onClick={() => setAmount(String(presetAmount))}
                disabled={isSubmitting}
              >
                {presetAmount}
              </button>
            )) : null}
          </div>
        </div>

        <div className={styles.field}>
          <label className={styles.fieldLabel} htmlFor="adjust-points-reason">
            调整原因
          </label>
          <textarea
            id="adjust-points-reason"
            className={styles.reasonInput}
            placeholder="请输入调整原因..."
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            maxLength={100}
            rows={2}
            aria-label="积分调整原因"
            disabled={isSubmitting}
          />
          <div className={styles.reasonPresets}>
            {isNonEmptyArray(REASON_PRESETS) ? REASON_PRESETS.map((presetReason) => (
              <button
                key={presetReason}
                type="button"
                className={cx(styles.reasonPresetBtn, reason === presetReason && styles.reasonPresetBtnActive)}
                onClick={() => setReason(presetReason)}
                disabled={isSubmitting}
              >
                {presetReason}
              </button>
            )) : null}
          </div>
        </div>

        {parsedAmount > 0 ? (
          <div className={styles.previewCard}>
            <span className={styles.previewLabel}>操作后余额预览</span>
            <div className={styles.previewRow}>
              <span className={styles.previewOld}>{safeNum(user.availablePoints).toLocaleString('zh-CN')}</span>
              <IconMemberPointsPreviewArrow color="#94a3b8" />
              <span className={cx(styles.previewNew, dir === 'add' ? styles.previewNewAdd : styles.previewNewSub)}>
                {safeNum(previewBalance).toLocaleString('zh-CN')}
              </span>
              <span className={styles.previewUnit}>积分</span>
            </div>
          </div>
        ) : null}
      </div>
    </OperationModalShell>
  );
};

export default AdjustPointsModal;
