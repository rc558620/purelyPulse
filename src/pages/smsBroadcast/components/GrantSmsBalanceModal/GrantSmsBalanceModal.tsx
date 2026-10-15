// 平台赠送 / 回收门店短信余额弹窗。
//
// 💰 单位边界：**表单输入与预览一律用「元」，只有落地到请求体时才转成「分」**。
// 输入框只允许整数元（`replace(/\D/g,'')`），从源头规避小数乘 100 的浮点尾差。
import React, { useCallback, useState } from 'react';
import OperationModalShell from '@components/overlay/OperationModalShell/OperationModalShell';
import { cx, isNonEmptyArray, safeNum } from '@utils/utils';
import {
  SMS_BROADCAST_GRANT_OPTIONS,
  SMS_BROADCAST_DEFAULT_GRANT_DIR,
  SMS_BROADCAST_MAX_GRANT_YUAN,
  SMS_BROADCAST_PRESET_VALUES,
  SMS_BROADCAST_REASON_PRESETS,
} from '../../smsBroadcast.constants';
import { fenToYuan, formatFen, yuanToFen } from '../../smsBroadcast.utils';
import type { SmsAccount, SmsBroadcastGrantDir } from '../../smsBroadcast.types';
import {
  IconSmsBroadcastArrow,
  IconSmsBroadcastBadge,
  IconSmsBroadcastConfirm,
} from '../SmsBroadcastIcons/SmsBroadcastIcons';
import styles from './GrantSmsBalanceModal.module.less';

export interface GrantSmsBalanceModalProps {
  store: SmsAccount;
  onClose: () => void;
  /** amountFen 为**带符号的分**：正数赠送、负数回收 */
  onConfirm: (storeId: string, amountFen: number, reason: string) => Promise<void> | void;
  isSubmitting?: boolean;
}

const GrantSmsBalanceModal: React.FC<GrantSmsBalanceModalProps> = ({
  store,
  onClose,
  onConfirm,
  isSubmitting = false,
}) => {
  const [dir, setDir] = useState<SmsBroadcastGrantDir>(SMS_BROADCAST_DEFAULT_GRANT_DIR);
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');

  const currentBalanceFen = safeNum(store.balanceFen);
  const parsedYuan = Math.max(0, parseInt(amount, 10) || 0);
  const deltaFen = dir === 'grant' ? yuanToFen(parsedYuan) : -yuanToFen(parsedYuan);
  // 余额不会低于 0：回收超出当前余额时按清零处理
  const nextBalanceFen = Math.max(0, currentBalanceFen + deltaFen);
  const isClearToZero = nextBalanceFen === 0 && currentBalanceFen > 0;
  // 余额已是 0 时再回收属于空操作：后端不会写流水，前端必须挡住，
  // 否则会弹出「已回收」的成功提示但实际什么都没发生。
  const isRevokeNoop = dir === 'revoke' && currentBalanceFen <= 0;
  // 上限与后端对齐（¥10,000）：超出就地拦住，别等提交后被 400 打回
  const isOverLimit = parsedYuan > SMS_BROADCAST_MAX_GRANT_YUAN;
  const isValid =
    parsedYuan > 0 && !isSubmitting && !isRevokeNoop && !isOverLimit;

  // 提交参数直接从当前渲染值计算：本弹窗表单简单，
  // 不引入 ref 缓存最新值（渲染期写 ref 违反 React 渲染规则）。
  const handleConfirm = useCallback((): void => {
    if (!isValid) {
      return;
    }
    void onConfirm(store.id, deltaFen, reason.trim());
  }, [deltaFen, isValid, onConfirm, reason, store.id]);

  const handleAmountChange = useCallback((event: React.ChangeEvent<HTMLInputElement>): void => {
    setAmount(event.target.value.replace(/\D/g, ''));
  }, []);

  const confirmText = isSubmitting
    ? '提交中...'
    : `确认${dir === 'grant' ? '赠送' : '回收'}${parsedYuan > 0 ? ` ${formatFen(yuanToFen(parsedYuan))} ` : ' '}`;

  return (
    <OperationModalShell
      ariaLabel="设置门店短信余额"
      icon={<IconSmsBroadcastBadge />}
      title="短信余额调整"
      confirmText={confirmText}
      confirmIcon={<IconSmsBroadcastConfirm />}
      onClose={onClose}
      onConfirm={handleConfirm}
      confirmDisabled={!isValid}
      variant="center"
      maxWidth="44rem"
    >
      <div className={styles.body}>
        <div className={styles.ownerCard}>
          <div
            className={cx(styles.ownerAvatar, store.ownerAvatarUrl && styles.ownerAvatarWithImage)}
            aria-hidden="true"
          >
            {store.ownerAvatarUrl ? (
              <img className={styles.ownerAvatarImg} src={store.ownerAvatarUrl} alt="" />
            ) : (
              store.ownerName[0]
            )}
          </div>
          <div className={styles.ownerInfo}>
            <span className={styles.ownerName}>{store.ownerName}</span>
            <span className={styles.ownerPhone}>{store.ownerPhone || '未绑定手机号'}</span>
          </div>
          <div className={styles.balanceBox}>
            <span className={styles.balanceVal}>{formatFen(currentBalanceFen)}</span>
            <span className={styles.balanceLbl}>当前余额</span>
          </div>
        </div>

        <div className={styles.field}>
          <label className={styles.fieldLabel}>调整方向</label>
          <div className={styles.dirRow}>
            {SMS_BROADCAST_GRANT_OPTIONS.map((option) => (
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
          <label className={styles.fieldLabel} htmlFor="grant-sms-amount">
            调整金额（元）
          </label>
          <input
            id="grant-sms-amount"
            className={styles.amountInput}
            type="text"
            inputMode="numeric"
            placeholder="输入要赠送 / 回收的金额（元）"
            value={amount}
            onChange={handleAmountChange}
            // 上限 ¥10,000（与后端 PULSE_ADMIN_SMS_MAX_GRANT_FEN 对齐），最多 5 位
            maxLength={String(SMS_BROADCAST_MAX_GRANT_YUAN).length}
            aria-label="短信余额调整金额"
            disabled={isSubmitting}
          />
          <div className={styles.presetRow}>
            {isNonEmptyArray(SMS_BROADCAST_PRESET_VALUES)
              ? SMS_BROADCAST_PRESET_VALUES.map((presetValue) => (
                  <button
                    key={presetValue}
                    type="button"
                    className={cx(styles.presetBtn, amount === String(presetValue) && styles.presetBtnActive)}
                    onClick={() => setAmount(String(presetValue))}
                    disabled={isSubmitting}
                  >
                    ¥{presetValue}
                  </button>
                ))
              : null}
          </div>
          {isOverLimit ? (
            <span className={styles.previewWarning}>
              单次调整金额不能超过 ¥
              {SMS_BROADCAST_MAX_GRANT_YUAN.toLocaleString('zh-CN')}
            </span>
          ) : null}
        </div>

        <div className={styles.field}>
          <label className={styles.fieldLabel} htmlFor="grant-sms-reason">
            调整原因（选填）
          </label>
          <textarea
            id="grant-sms-reason"
            className={styles.reasonInput}
            placeholder="请输入调整原因，会写入钱包流水说明..."
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            maxLength={100}
            rows={2}
            aria-label="短信余额调整原因"
            disabled={isSubmitting}
          />
          <div className={styles.reasonPresets}>
            {isNonEmptyArray(SMS_BROADCAST_REASON_PRESETS)
              ? SMS_BROADCAST_REASON_PRESETS.map((presetReason) => (
                  <button
                    key={presetReason}
                    type="button"
                    className={cx(styles.reasonPresetBtn, reason === presetReason && styles.reasonPresetBtnActive)}
                    onClick={() => setReason(presetReason)}
                    disabled={isSubmitting}
                  >
                    {presetReason}
                  </button>
                ))
              : null}
          </div>
        </div>

        {parsedYuan > 0 ? (
          <div className={styles.previewCard}>
            <div className={styles.previewCardRow}>
              <span className={styles.previewLabel}>调整后余额预览</span>
              <div className={styles.previewRow}>
                <span className={styles.previewOld}>{formatFen(currentBalanceFen)}</span>
                <IconSmsBroadcastArrow color="#94a3b8" />
                <span
                  className={cx(
                    styles.previewNew,
                    isClearToZero ? styles.previewNewDanger : styles.previewNewAdd,
                  )}
                >
                  {formatFen(nextBalanceFen)}
                </span>
              </div>
            </div>
            {!isClearToZero && !isRevokeNoop ? (
              <span className={styles.previewHint}>
                约可发送 {Math.floor(fenToYuan(nextBalanceFen) / 0.05).toLocaleString('zh-CN')} 条（按 ¥0.05 / 条估算）
              </span>
            ) : null}
            {isClearToZero ? (
              <span className={styles.previewWarning}>
                余额清零后，本店将无法发送群发短信，直到重新充值或平台赠送
              </span>
            ) : null}
            {isRevokeNoop ? (
              <span className={styles.previewWarning}>
                当前余额已为 0，无法继续回收
              </span>
            ) : null}
          </div>
        ) : null}
      </div>
    </OperationModalShell>
  );
};

export default GrantSmsBalanceModal;
