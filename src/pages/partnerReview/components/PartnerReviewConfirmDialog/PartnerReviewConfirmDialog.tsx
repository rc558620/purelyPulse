// 合伙人审核确认弹窗：承载审核通过与拒绝的二次确认交互。
import React, { useEffect } from 'react';
import { cx, safeStr } from '@utils/utils';
import type { PartnerApplication, ReviewSubmitAction } from '../../partnerReview.types';
import { IconPartnerReviewApprove, IconPartnerReviewReject } from '../PartnerReviewIcons/PartnerReviewIcons';
import styles from './PartnerReviewConfirmDialog.module.less';

interface PartnerReviewConfirmDialogProps {
  /** 目标申请 */
  application: PartnerApplication;
  /** 审核动作 */
  action: ReviewSubmitAction;
  /** 是否提交中 */
  isSubmitting: boolean;
  /** 确认回调 */
  onConfirm: () => Promise<void>;
  /** 取消回调 */
  onCancel: () => void;
}

const PartnerReviewConfirmDialog: React.FC<PartnerReviewConfirmDialogProps> = ({
  application,
  action,
  isSubmitting,
  onConfirm,
  onCancel,
}) => {
  const isApprove = action === 'approve';

  // ESC 关闭
  useEffect(() => {
    const handler = (event: KeyboardEvent): void => {
      if (event.key === 'Escape' && !isSubmitting) {
        onCancel();
      }
    };
    window.addEventListener('keydown', handler);
    return () => {
      window.removeEventListener('keydown', handler);
    };
  }, [isSubmitting, onCancel]);

  return (
    <div
      className={styles.dialogOverlay}
      role="dialog"
      aria-modal="true"
      aria-label={isApprove ? '确认通过' : '确认拒绝'}
      onClick={(event) => {
        if (!isSubmitting && event.target === event.currentTarget) {
          onCancel();
        }
      }}
    >
      <div className={styles.dialogCard}>
        <div
          className={cx(styles.dialogIconWrap, isApprove ? styles.dialogIconApprove : styles.dialogIconReject)}
          aria-hidden="true"
        >
          {isApprove ? <IconPartnerReviewApprove /> : <IconPartnerReviewReject />}
        </div>
        <h2 className={styles.dialogTitle}>
          {isApprove ? `确认通过「${safeStr(application.name, '该合伙人')}」的申请` : `确认拒绝「${safeStr(application.name, '该合伙人')}」的申请`}
        </h2>
        <p className={styles.dialogDesc}>
          {isApprove
            ? '通过后该申请人将成为合伙人，获得合伙人相关权限。'
            : '拒绝后该申请将被标记为未通过，申请人可重新提交申请。'}
        </p>

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
            onClick={() => void onConfirm()}
            disabled={isSubmitting}
          >
            {isSubmitting ? (isApprove ? '审核中...' : '处理中...') : (isApprove ? '确认通过' : '确认拒绝')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PartnerReviewConfirmDialog;
