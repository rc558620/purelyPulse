// 合伙人打款确认弹窗：承载确认打款与拒绝打款的二次确认交互。
import React, { useCallback, useState } from 'react';
import { cx, fenToYuan, safeStr } from '@utils/utils';
import { IconPartnerPayoutApprove, IconPartnerPayoutReject } from '../PartnerPayoutIcons/PartnerPayoutIcons';
import type { PartnerPayoutApplication } from '../../partnerPayout.types';
import styles from './PartnerPayoutConfirmDialog.module.less';

/** 弹窗操作类型 */
export type PartnerPayoutConfirmAction = 'approve' | 'reject';

/** 预设拒绝原因选项 */
const REJECT_REASON_OPTIONS = [
  '信息有误，需核实',
  '账户异常，暂无法打款',
  '金额不符，需重新确认',
  '其他',
] as const;

interface PartnerPayoutConfirmDialogProps {
  /** 当前操作的申请数据 */
  application: PartnerPayoutApplication;
  /** 操作类型：确认打款 / 拒绝 */
  action: PartnerPayoutConfirmAction;
  /** 是否提交中 */
  isSubmitting: boolean;
  /** 确认回调 */
  onConfirm: (action: PartnerPayoutConfirmAction, rejectReason?: string) => Promise<void>;
  /** 取消回调 */
  onCancel: () => void;
}

const PartnerPayoutConfirmDialog: React.FC<PartnerPayoutConfirmDialogProps> = ({
  application,
  action,
  isSubmitting,
  onConfirm,
  onCancel,
}) => {
  const isApprove = action === 'approve';
  const [selectedReason, setSelectedReason] = useState('');
  const [customReason, setCustomReason] = useState('');
  const isOtherSelected = selectedReason === '其他' || selectedReason.startsWith('其他：');
  const effectiveReason = isOtherSelected && customReason.trim()
    ? `其他：${customReason.trim()}`
    : selectedReason;

  const handleCustomReasonChange = useCallback((value: string) => {
    setCustomReason(value);
  }, []);

  const handleConfirm = useCallback(() => {
    void onConfirm(action, isApprove ? undefined : (effectiveReason || selectedReason || '打款申请已拒绝'));
  }, [action, effectiveReason, isApprove, onConfirm, selectedReason]);

  const canConfirm = isApprove || Boolean(selectedReason);

  return (
    <div
      className={styles.dialogOverlay}
      role="dialog"
      aria-modal="true"
      aria-label={isApprove ? '确认打款' : '拒绝打款'}
      onClick={(event) => {
        if (!isSubmitting && event.target === event.currentTarget) {
          onCancel();
        }
      }}
    >
      <div className={styles.dialogCard}>
        <div className={cx(styles.dialogIconWrap, isApprove ? styles.dialogIconApprove : styles.dialogIconReject)} aria-hidden="true">
          {isApprove ? <IconPartnerPayoutApprove /> : <IconPartnerPayoutReject />}
        </div>
        <h2 className={styles.dialogTitle}>
          {isApprove
            ? `确认打款给「${safeStr(application.partnerName, '该合伙人')}」`
            : `拒绝「${safeStr(application.partnerName, '该合伙人')}」的打款申请`}
        </h2>
        <p className={styles.dialogDesc}>
          {isApprove
            ? `确认后将向 ${safeStr(application.accountName, '--')} 的${safeStr(application.accountNo, '--')} 打款 ¥${safeStr(String(fenToYuan(application.amount)), '--')}，此操作不可撤回。`
            : '拒绝后该申请将标记为已拒绝，合伙人可重新发起申请。'}
        </p>

        {!isApprove ? (
          <div className={styles.dialogReasonWrap}>
            <span className={styles.dialogReasonLabel}>拒绝理由</span>
            <div className={styles.dialogReasonList}>
              {REJECT_REASON_OPTIONS.length > 0 ? REJECT_REASON_OPTIONS.map((reasonItem) => (
                <button
                  key={reasonItem}
                  type="button"
                  className={cx(styles.dialogReasonBtn, (selectedReason === reasonItem || (reasonItem === '其他' && isOtherSelected)) && styles.dialogReasonBtnActive)}
                  onClick={() => {
                    setSelectedReason(reasonItem);
                    if (reasonItem !== '其他') {
                      setCustomReason('');
                    }
                  }}
                  disabled={isSubmitting}
                >
                  {reasonItem}
                </button>
              )) : null}
            </div>
            {isOtherSelected ? (
              <input
                className={styles.dialogCustomReasonInput}
                type="text"
                placeholder="请输入具体拒绝原因…"
                value={customReason}
                onChange={(event) => handleCustomReasonChange(event.target.value)}
                disabled={isSubmitting}
                maxLength={50}
              />
            ) : null}
          </div>
        ) : null}

        <div className={styles.dialogActions}>
          <button
            type="button"
            className={styles.dialogCancelBtn}
            onClick={onCancel}
            disabled={isSubmitting}
          >
            取消
          </button>
          <button
            type="button"
            className={cx(styles.dialogConfirmBtn, isApprove ? styles.dialogConfirmBtnApprove : styles.dialogConfirmBtnReject)}
            onClick={handleConfirm}
            disabled={isSubmitting || !canConfirm}
          >
            {isSubmitting
              ? (isApprove ? '处理中...' : '拒绝中...')
              : (isApprove ? '确认打款' : '确认拒绝')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PartnerPayoutConfirmDialog;
