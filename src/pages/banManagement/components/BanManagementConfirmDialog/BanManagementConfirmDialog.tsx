// 封禁管理确认弹窗：承载封禁与解封确认交互。
import React from 'react';
import { cx, safeStr } from '@utils/utils';
import type { MemberListItem } from '../../../memberList/memberList.types';
import { BAN_REASONS, type ConfirmAction } from '../../banManagement.types';
import { IconBanCircleSlash, IconShieldCheck } from '../BanManagementIcons/BanManagementIcons';
import styles from './BanManagementConfirmDialog.module.less';

interface BanManagementConfirmDialogProps {
  member: MemberListItem;
  action: ConfirmAction;
  selectedReason: string;
  isSubmitting: boolean;
  onReasonChange: (reason: string) => void;
  onConfirm: () => Promise<void>;
  onCancel: () => void;
}

export const BanManagementConfirmDialog: React.FC<BanManagementConfirmDialogProps> = ({
  member,
  action,
  selectedReason,
  isSubmitting,
  onReasonChange,
  onConfirm,
  onCancel,
}) => {
  const isBan = action === 'ban';

  return (
    <div
      className={styles.dialogOverlay}
      role="dialog"
      aria-modal="true"
      aria-label={isBan ? '确认封禁' : '确认解封'}
      onClick={(event) => {
        if (!isSubmitting && event.target === event.currentTarget) {
          onCancel();
        }
      }}
    >
      <div className={styles.dialogCard}>
        <div className={cx(styles.dialogIconWrap, isBan ? styles.dialogIconBan : styles.dialogIconUnban)} aria-hidden="true">
          {isBan ? <IconBanCircleSlash /> : <IconShieldCheck />}
        </div>
        <h2 className={styles.dialogTitle}>
          {isBan ? `确认封禁「${safeStr(member.name, '会员')}」` : `确认解封「${safeStr(member.name, '会员')}」`}
        </h2>
        <p className={styles.dialogDesc}>
          {isBan
            ? '封禁后该用户将无法登录及使用平台功能，封禁原因会写入会员备注。'
            : '解封后该用户将恢复正常使用权限，并从封禁列表中移除。'}
        </p>

        {isBan ? (
          <div className={styles.dialogReasonWrap}>
            <span className={styles.dialogReasonLabel}>封禁理由</span>
            <div className={styles.dialogReasonList}>
              {BAN_REASONS.length > 0 ? BAN_REASONS.map((reasonItem) => (
                <button
                  key={reasonItem}
                  type="button"
                  className={cx(styles.dialogReasonBtn, selectedReason === reasonItem && styles.dialogReasonBtnActive)}
                  onClick={() => onReasonChange(reasonItem)}
                  disabled={isSubmitting}
                >
                  {reasonItem}
                </button>
              )) : null}
            </div>
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
            className={cx(styles.dialogConfirmBtn, isBan ? styles.dialogConfirmBtnBan : styles.dialogConfirmBtnUnban)}
            onClick={() => void onConfirm()}
            disabled={isSubmitting || (isBan && !selectedReason)}
          >
            {isSubmitting ? (isBan ? '封禁中...' : '解封中...') : (isBan ? '确认封禁' : '确认解封')}
          </button>
        </div>
      </div>
    </div>
  );
};
