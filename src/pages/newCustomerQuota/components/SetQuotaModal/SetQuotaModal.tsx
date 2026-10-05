// 设置门店新客额度弹窗：按「增加 / 减少」增减额度，提交后写一条额度流水
import React, { useCallback, useState } from 'react';
import OperationModalShell from '@components/overlay/OperationModalShell/OperationModalShell';
import { cx, isNonEmptyArray, safeNum } from '@utils/utils';
import {
  NEW_CUSTOMER_QUOTA_ADJUST_OPTIONS,
  NEW_CUSTOMER_QUOTA_DEFAULT_ADJUST_DIR,
  NEW_CUSTOMER_QUOTA_PRESET_VALUES,
  NEW_CUSTOMER_QUOTA_REASON_PRESETS,
} from '../../newCustomerQuota.constants';
import type { NewCustomerQuotaAdjustDir, NewCustomerQuotaStore } from '../../newCustomerQuota.types';
import {
  IconNewCustomerQuotaArrow,
  IconNewCustomerQuotaBadge,
  IconNewCustomerQuotaConfirm,
} from '../NewCustomerQuotaIcons/NewCustomerQuotaIcons';
import styles from './SetQuotaModal.module.less';

export interface SetQuotaModalProps {
  store: NewCustomerQuotaStore;
  onClose: () => void;
  onConfirm: (storeId: string, delta: number, reason: string) => Promise<void> | void;
  isSubmitting?: boolean;
}

const SetQuotaModal: React.FC<SetQuotaModalProps> = ({
  store,
  onClose,
  onConfirm,
  isSubmitting = false,
}) => {
  const [dir, setDir] = useState<NewCustomerQuotaAdjustDir>(NEW_CUSTOMER_QUOTA_DEFAULT_ADJUST_DIR);
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');

  const currentQuota = safeNum(store.remaining);
  const parsedAmount = Math.max(0, parseInt(amount, 10) || 0);
  const delta = dir === 'add' ? parsedAmount : -parsedAmount;
  // 余额不会低于 0：减少超出当前额度时按清零处理
  const nextQuota = Math.max(0, currentQuota + delta);
  const isClearToZero = nextQuota === 0 && currentQuota > 0;
  // 余额已是 0 时再减少属于空操作：后端不会写流水，前端必须挡住，
  // 否则会弹出「已回收」的成功提示但实际什么都没发生。
  const isSubtractNoop = dir === 'subtract' && currentQuota <= 0;
  const isValid = parsedAmount > 0 && !isSubmitting && !isSubtractNoop;

  // 提交参数直接从当前渲染值计算：本弹窗表单简单，
  // 不引入 ref 缓存最新值（渲染期写 ref 违反 React 渲染规则）。
  const handleConfirm = useCallback((): void => {
    if (!isValid) {
      return;
    }
    void onConfirm(store.id, delta, reason.trim());
  }, [delta, isValid, onConfirm, reason, store.id]);

  const handleAmountChange = useCallback((event: React.ChangeEvent<HTMLInputElement>): void => {
    setAmount(event.target.value.replace(/\D/g, ''));
  }, []);

  const confirmText = isSubmitting
    ? '提交中...'
    : `确认${dir === 'add' ? '增加' : '减少'}${parsedAmount > 0 ? ` ${parsedAmount} ` : ' '}位新客`;

  return (
    <OperationModalShell
      ariaLabel="设置门店新客额度"
      icon={<IconNewCustomerQuotaBadge />}
      title="设置新客额度"
      confirmText={confirmText}
      confirmIcon={<IconNewCustomerQuotaConfirm />}
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
            <span className={styles.balanceVal}>{currentQuota.toLocaleString('zh-CN')}</span>
            <span className={styles.balanceLbl}>当前额度</span>
          </div>
        </div>

        <div className={styles.field}>
          <label className={styles.fieldLabel}>调整方向</label>
          <div className={styles.dirRow}>
            {NEW_CUSTOMER_QUOTA_ADJUST_OPTIONS.map((option) => (
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
          <label className={styles.fieldLabel} htmlFor="adjust-quota-amount">
            调整数量（位新客）
          </label>
          <input
            id="adjust-quota-amount"
            className={styles.amountInput}
            type="text"
            inputMode="numeric"
            placeholder="输入要增加 / 减少的额度数量"
            value={amount}
            onChange={handleAmountChange}
            maxLength={7}
            aria-label="新客额度调整数量"
            disabled={isSubmitting}
          />
          <div className={styles.presetRow}>
            {isNonEmptyArray(NEW_CUSTOMER_QUOTA_PRESET_VALUES)
              ? NEW_CUSTOMER_QUOTA_PRESET_VALUES.map((presetValue) => (
                  <button
                    key={presetValue}
                    type="button"
                    className={cx(styles.presetBtn, amount === String(presetValue) && styles.presetBtnActive)}
                    onClick={() => setAmount(String(presetValue))}
                    disabled={isSubmitting}
                  >
                    {presetValue}
                  </button>
                ))
              : null}
          </div>
        </div>

        <div className={styles.field}>
          <label className={styles.fieldLabel} htmlFor="adjust-quota-reason">
            调整原因（选填）
          </label>
          <textarea
            id="adjust-quota-reason"
            className={styles.reasonInput}
            placeholder="请输入调整原因，会写入额度流水说明..."
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            maxLength={100}
            rows={2}
            aria-label="新客额度调整原因"
            disabled={isSubmitting}
          />
          <div className={styles.reasonPresets}>
            {isNonEmptyArray(NEW_CUSTOMER_QUOTA_REASON_PRESETS)
              ? NEW_CUSTOMER_QUOTA_REASON_PRESETS.map((presetReason) => (
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

        {parsedAmount > 0 ? (
          <div className={styles.previewCard}>
            <div className={styles.previewCardRow}>
              <span className={styles.previewLabel}>调整后额度预览</span>
              <div className={styles.previewRow}>
                <span className={styles.previewOld}>{currentQuota.toLocaleString('zh-CN')}</span>
                <IconNewCustomerQuotaArrow color="#94a3b8" />
                <span
                  className={cx(
                    styles.previewNew,
                    isClearToZero ? styles.previewNewDanger : styles.previewNewAdd,
                  )}
                >
                  {nextQuota.toLocaleString('zh-CN')}
                </span>
                <span className={styles.previewUnit}>位新客</span>
              </div>
            </div>
            {isClearToZero ? (
              <span className={styles.previewWarning}>
                额度清零后，本店新客将被阻止下单，直到重新发放额度
              </span>
            ) : null}
            {isSubtractNoop ? (
              <span className={styles.previewWarning}>
                当前额度已为 0，无法继续减少
              </span>
            ) : null}
          </div>
        ) : null}
      </div>
    </OperationModalShell>
  );
};

export default SetQuotaModal;
