// 合伙人纯利豆调整弹窗
import React, { useCallback, useRef, useState } from 'react';
import OperationModalShell from '@components/overlay/OperationModalShell/OperationModalShell';
import { cx, isNonEmptyArray, safeNum } from '@utils/utils';
import type { AdjustDir, UserSnapshot } from '../../partnerBeans.shared.types';
import {
  PARTNER_BEANS_ADJUST_OPTIONS,
  PARTNER_BEANS_ADJUST_PRESET_AMOUNTS,
  PARTNER_BEANS_REASON_PRESETS,
} from '../../partnerBeans.constants';
import {
  IconPartnerBeansBean,
  IconPartnerBeansConfirm,
  IconPartnerBeansPreviewArrow,
} from '../PartnerBeansIcons/PartnerBeansIcons';
import styles from './AdjustBeanModal.module.less';

export interface AdjustBeanModalProps {
  user: UserSnapshot;
  onClose: () => void;
  onConfirm: (userId: string, delta: number, reason: string) => Promise<void> | void;
  isSubmitting?: boolean;
}

const AdjustBeanModal: React.FC<AdjustBeanModalProps> = ({
  user,
  onClose,
  onConfirm,
  isSubmitting = false,
}) => {
  const [dir, setDir] = useState<AdjustDir>('add');
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');

  const parsedAmount = Math.max(0, parseInt(amount, 10) || 0);
  const delta = dir === 'add' ? parsedAmount : -parsedAmount;
  const previewBalance = user.beanBalance + delta;
  const isBalanceInsufficient = dir === 'subtract' && parsedAmount > user.beanBalance;
  const isValid = parsedAmount > 0 && reason.trim().length > 0 && !isBalanceInsufficient;

  // 使用 ref 保存最新提交参数，避免 useCallback 闭包捕获旧值
  const pendingSubmitRef = useRef({ userId: user.id, delta, reason: reason.trim() });
  pendingSubmitRef.current = { userId: user.id, delta, reason: reason.trim() };

  const handleConfirm = useCallback((): void => {
    if (!isValid || isSubmitting) {
      return;
    }
    const { userId, delta: latestDelta, reason: latestReason } = pendingSubmitRef.current;
    void onConfirm(userId, latestDelta, latestReason);
  }, [isSubmitting, isValid, onConfirm]);

  const handleAmountChange = useCallback((event: React.ChangeEvent<HTMLInputElement>): void => {
    const value = event.target.value.replace(/\D/g, '');
    setAmount(value);
  }, []);

  const confirmText = isSubmitting
    ? '提交中...'
    : `确认${dir === 'add' ? '增加' : '减少'}${parsedAmount > 0 ? ` ${parsedAmount} ` : ' '}纯利豆`;

  return (
    <OperationModalShell
      ariaLabel="调整用户纯利豆"
      icon={<IconPartnerBeansBean />}
      title="调整纯利豆"
      confirmText={confirmText}
      confirmIcon={<IconPartnerBeansConfirm />}
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
            <div className={styles.userNameRow}>
              <span className={styles.userName}>{user.name}</span>
              <span className={styles.partnerBadge}>合伙人</span>
            </div>
            <span className={styles.userPhone}>{user.phone}</span>
          </div>
          <div className={styles.balanceBox}>
            <span className={styles.balanceVal}>{safeNum(user.beanBalance).toLocaleString('zh-CN')}</span>
            <span className={styles.balanceLbl}>纯利豆</span>
          </div>
        </div>

        <div className={styles.field}>
          <label className={styles.fieldLabel}>调整方向</label>
          <div className={styles.dirRow}>
            {PARTNER_BEANS_ADJUST_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                className={cx(styles.dirBtn, dir === option.value && styles.dirBtnActive)}
                style={dir === option.value ? ({
                  '--dir-color': option.color,
                  '--dir-color-bg': `${option.color}18`,
                } as React.CSSProperties) : undefined}
                onClick={() => setDir(option.value)}
                aria-pressed={dir === option.value}
                disabled={isSubmitting}
              >
                <span
                  className={cx(styles.dirSign, dir === option.value && styles.dirSignActive)}
                  style={dir === option.value ? ({ '--sign-color': option.color } as React.CSSProperties) : undefined}
                >
                  {option.sign}
                </span>
                {option.label}
              </button>
            ))}
          </div>
        </div>

        <div className={styles.field}>
          <label className={styles.fieldLabel} htmlFor="adjust-bean-amount">
            调整数量
          </label>
          <input
            id="adjust-bean-amount"
            className={styles.amountInput}
            type="text"
            inputMode="numeric"
            placeholder="输入纯利豆数量"
            value={amount}
            onChange={handleAmountChange}
            maxLength={6}
            aria-label="纯利豆调整数量"
            disabled={isSubmitting}
          />
          <div className={styles.presetRow}>
            {isNonEmptyArray(PARTNER_BEANS_ADJUST_PRESET_AMOUNTS) ? PARTNER_BEANS_ADJUST_PRESET_AMOUNTS.map((presetAmount) => (
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
          <label className={styles.fieldLabel} htmlFor="adjust-bean-reason">
            调整原因
          </label>
          <textarea
            id="adjust-bean-reason"
            className={styles.reasonInput}
            placeholder="请输入调整原因..."
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            maxLength={100}
            rows={2}
            aria-label="纯利豆调整原因"
            disabled={isSubmitting}
          />
          <div className={styles.reasonPresets}>
            {isNonEmptyArray(PARTNER_BEANS_REASON_PRESETS) ? PARTNER_BEANS_REASON_PRESETS.map((presetReason) => (
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
            <div className={styles.previewCardRow}>
              <span className={styles.previewLabel}>操作后余额预览</span>
              <div className={styles.previewRow}>
                <span className={styles.previewOld}>{safeNum(user.beanBalance).toLocaleString('zh-CN')}</span>
                <IconPartnerBeansPreviewArrow color="#94a3b8" />
                <span className={cx(styles.previewNew, dir === 'add' ? styles.previewNewAdd : styles.previewNewSub)}>
                  {safeNum(previewBalance).toLocaleString('zh-CN')}
                </span>
                <span className={styles.previewUnit}>纯利豆</span>
              </div>
            </div>
            {isBalanceInsufficient ? (
              <span className={styles.previewWarning}>减少数量不能超过当前余额</span>
            ) : null}
          </div>
        ) : null}
      </div>
    </OperationModalShell>
  );
};

export default AdjustBeanModal;
