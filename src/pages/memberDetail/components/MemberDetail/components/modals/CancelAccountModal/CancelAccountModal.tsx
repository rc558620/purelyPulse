// 注销账号确认弹窗：二次确认不可逆的账号注销操作，要求输入手机号末四位。
import React, { useEffect, useState } from 'react';
import { cx } from '@utils/utils';
import { IconAlertOctagon, IconUserMinus } from '@pages/memberDetail/components/MemberDetailIcons/MemberDetailIcons';
import pageStyles from '../../../../../memberDetail.module.less';
import styles from './CancelAccountModal.module.less';

/** 注销账号弹窗的后果说明条目。 */
const CANCEL_CONSEQUENCES = [
  '账号所有登录凭证立即失效，无法再次登录',
  '积分、纯利豆余额、充值记录等数据全部清除',
  '会员等级与订阅权益同步终止',
  '注销后该手机号视同从未注册，可重新完整注册',
] as const;

interface CancelAccountModalProps {
  /** 会员姓名，用于弹窗标题展示。 */
  memberName: string;
  /** 会员手机号，用于提取末四位作为确认码。 */
  memberPhone: string;
  /** 是否正在提交注销请求。 */
  isSubmitting: boolean;
  /** 关闭弹窗回调。 */
  onClose: () => void;
  /** 确认注销回调。 */
  onConfirm: () => Promise<void>;
}

const CancelAccountModal: React.FC<CancelAccountModalProps> = ({
  memberName,
  memberPhone,
  isSubmitting,
  onClose,
  onConfirm,
}) => {
  const [confirmInput, setConfirmInput] = useState<string>('');

  // 先过滤所有非数字字符（兼容带空格 / 带连字符等格式），再取末四位
  const digitsOnly = memberPhone.replace(/\D/g, '');
  const lastFour = digitsOnly.length >= 4 ? digitsOnly.slice(-4) : digitsOnly;
  // 当手机号缺失时回退到不要求确认（直接放行），避免阻塞操作
  const isInputValid = lastFour.length === 4 ? confirmInput.trim() === lastFour : confirmInput.trim().length > 0;

  // ESC 键关闭弹窗（提交中禁止关闭）
  useEffect(() => {
    const handler = (event: KeyboardEvent): void => {
      if (event.key === 'Escape' && !isSubmitting) {
        onClose();
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isSubmitting, onClose]);

  const handleOverlayClick = (event: React.MouseEvent<HTMLDivElement>): void => {
    if (!isSubmitting && event.target === event.currentTarget) {
      onClose();
    }
  };

  const handleConfirmClick = (): void => {
    if (!isInputValid || isSubmitting) {
      return;
    }

    void onConfirm();
  };

  return (
    <div className={styles.root}>
      <div
        className={pageStyles.statusModalOverlay}
        role="dialog"
        aria-modal="true"
        aria-label="确认注销账号"
        onClick={handleOverlayClick}
      >
        <div className={pageStyles.statusModalCard}>
          {/* 危险图标 */}
          <div className={cx(pageStyles.statusModalIcon, pageStyles.statusModalIconDanger)} aria-hidden="true">
            <IconAlertOctagon width={24} height={24} strokeWidth={2} />
          </div>

          {/* 标题与副标题 */}
          <h2 className={pageStyles.statusModalTitle}>注销账号</h2>
          <p className={pageStyles.statusModalDesc}>
            即将注销 <strong>{memberName}</strong> 的账号，此操作<strong>不可逆</strong>，注销后该用户视同从未注册过。
          </p>

          {/* 警示横条 */}
          <div className={styles.warningBanner}>
            <span className={styles.warningBannerIcon} aria-hidden="true">
              <IconAlertOctagon width={16} height={16} strokeWidth={2} />
            </span>
            <span className={styles.warningBannerText}>
              注销后所有数据将被永久清除，无法恢复。请在充分确认后再执行。
            </span>
          </div>

          {/* 后果清单 */}
          <ul className={styles.consequenceList}>
            {CANCEL_CONSEQUENCES.map((item) => (
              <li key={item} className={styles.consequenceItem}>
                <span className={styles.consequenceDot} aria-hidden="true" />
                {item}
              </li>
            ))}
          </ul>

          {/* 确认输入区 */}
          <div className={styles.confirmSection}>
            <label htmlFor="cancel-confirm-input" className={styles.confirmLabel}>
              输入手机号末四位 <em>{lastFour}</em> 以确认注销
            </label>
            <input
              id="cancel-confirm-input"
              type="text"
              inputMode="numeric"
              maxLength={4}
              className={cx(styles.confirmInput, isInputValid && styles.confirmInputValid)}
              placeholder="输入末四位数字"
              value={confirmInput}
              onChange={(event) => {
                // 只保留数字字符，防止空格等干扰末四位匹配
                setConfirmInput(event.target.value.replace(/\D/g, ''));
              }}
              disabled={isSubmitting}
              autoComplete="off"
              aria-describedby="cancel-confirm-hint"
            />
          </div>

          {/* 操作按钮 */}
          <div className={styles.actions}>
            <button
              type="button"
              className={styles.cancelBtn}
              onClick={onClose}
              disabled={isSubmitting}
            >
              取消
            </button>
            <button
              type="button"
              className={styles.confirmBtn}
              onClick={handleConfirmClick}
              disabled={!isInputValid || isSubmitting}
              aria-label="确认注销账号"
            >
              <IconUserMinus width={13} height={13} strokeWidth={2.2} />
              {isSubmitting ? '注销中...' : '确认注销'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CancelAccountModal;
