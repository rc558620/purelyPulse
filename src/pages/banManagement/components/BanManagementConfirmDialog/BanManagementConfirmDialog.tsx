// 封禁管理确认弹窗：承载封禁与解封确认交互。
import React, { useEffect, useState } from 'react';
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
  // Bug #10: 选"其他"时提供自由输入框
  // 注意：当用户输入自定义原因后，selectedReason 会变为 "其他：xxx"，所以用 startsWith 判断
  const isOtherSelected = selectedReason === '其他' || selectedReason.startsWith('其他：');
  const [customReason, setCustomReason] = useState('');
  // 弹窗每次打开时（member 变化），重置自定义输入框
  useEffect(() => {
    setCustomReason('');
  }, [member.id]);
  // 实际提交的原因：选"其他"且输入了内容时用 "其他：xxx"，否则用 selectedReason 本身
  const effectiveReason = isOtherSelected && customReason.trim() ? `其他：${customReason.trim()}` : selectedReason;
  // 当 customReason 变化时实时同步给 controller（通过 onReasonChange）
  const handleCustomReasonChange = React.useCallback(
    (value: string) => {
      setCustomReason(value);
      // 实时同步：如果用户输入了内容则同步合成原因，否则保留 "其他" 占位
      onReasonChange(value.trim() ? `其他：${value.trim()}` : '其他');
    },
    [onReasonChange],
  );

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
                  className={cx(styles.dialogReasonBtn, (selectedReason === reasonItem || (reasonItem === '其他' && isOtherSelected)) && styles.dialogReasonBtnActive)}
                  onClick={() => onReasonChange(reasonItem)}
                  disabled={isSubmitting}
                >
                  {reasonItem}
                </button>
              )) : null}
            </div>
            {/* Bug #10: 选"其他"时显示自由输入框，让用户补充具体原因 */}
            {isOtherSelected ? (
              <input
                className={styles.dialogCustomReasonInput}
                type="text"
                placeholder="请输入具体封禁原因…"
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
            className={cx(styles.dialogConfirmBtn, isBan ? styles.dialogConfirmBtnBan : styles.dialogConfirmBtnUnban)}
            onClick={() => void onConfirm()}
            disabled={isSubmitting || (isBan && !effectiveReason)}
          >
            {isSubmitting ? (isBan ? '封禁中...' : '解封中...') : (isBan ? '确认封禁' : '确认解封')}
          </button>
        </div>
      </div>
    </div>
  );
};
