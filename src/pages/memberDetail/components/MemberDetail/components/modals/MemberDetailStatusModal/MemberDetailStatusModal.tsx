import React from 'react';
import { cx } from '@utils/utils';
import { IconBanCircle, IconShieldCheck } from '@pages/memberDetail/components/MemberDetailIcons/MemberDetailIcons';
import { MEMBER_BAN_REASON_OPTIONS } from '../../../../../memberDetail.constants';
import pageStyles from '../../../../../memberDetail.module.less';
import styles from './MemberDetailStatusModal.module.less';

interface MemberDetailStatusModalProps {
  isBannedMember: boolean;
  isSubmittingBan: boolean;
  banReason: string;
  onBanReasonChange: (value: string) => void;
  onClose: () => void;
  onConfirm: () => Promise<void>;
}

const MemberDetailStatusModal: React.FC<MemberDetailStatusModalProps> = ({
  isBannedMember,
  isSubmittingBan,
  banReason,
  onBanReasonChange,
  onClose,
  onConfirm,
}) => (
  <div className={styles.root}>
    <div
      className={pageStyles.statusModalOverlay}
      role="dialog"
      aria-modal="true"
      aria-label={isBannedMember ? '确认解除封禁' : '确认封禁会员'}
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div className={pageStyles.statusModalCard}>
        <div className={cx(pageStyles.statusModalIcon, isBannedMember ? pageStyles.statusModalIconSafe : pageStyles.statusModalIconDanger)} aria-hidden="true">
          {isBannedMember ? (
            <IconShieldCheck width={24} height={24} strokeWidth={2.2} />
          ) : (
            <IconBanCircle width={24} height={24} strokeWidth={2.2} />
          )}
        </div>
        <h2 className={pageStyles.statusModalTitle}>{isBannedMember ? '确认解除封禁' : '确认封禁会员'}</h2>
        <p className={pageStyles.statusModalDesc}>
          {isBannedMember ? '解封后该会员会恢复正常登录与使用权限。' : '封禁后该会员将无法继续登录和使用平台功能。'}
        </p>
        {!isBannedMember ? (
          <>
            <div className={pageStyles.statusModalReasonRow}>
              {MEMBER_BAN_REASON_OPTIONS.map((reasonItem) => (
                <button
                  key={reasonItem}
                  type="button"
                  className={cx(pageStyles.statusReasonChip, banReason === reasonItem && pageStyles.statusReasonChipActive)}
                  onClick={() => onBanReasonChange(reasonItem)}
                  disabled={isSubmittingBan}
                >
                  {reasonItem}
                </button>
              ))}
            </div>
            <textarea
              className={pageStyles.statusReasonInput}
              placeholder="请输入封禁原因"
              value={banReason}
              onChange={(event) => onBanReasonChange(event.target.value)}
              rows={3}
              disabled={isSubmittingBan}
            />
          </>
        ) : null}
        <div className={pageStyles.statusModalActions}>
          <button type="button" className={pageStyles.statusModalCancelBtn} onClick={onClose} disabled={isSubmittingBan}>
            取消
          </button>
          <button
            type="button"
            className={cx(pageStyles.statusModalConfirmBtn, isBannedMember ? pageStyles.statusModalConfirmBtnSafe : pageStyles.statusModalConfirmBtnDanger)}
            onClick={() => {
              void onConfirm();
            }}
            disabled={isSubmittingBan || (!isBannedMember && !banReason.trim())}
          >
            {isSubmittingBan ? (isBannedMember ? '解封中...' : '封禁中...') : (isBannedMember ? '确认解封' : '确认封禁')}
          </button>
        </div>
      </div>
    </div>
  </div>
);

export default MemberDetailStatusModal;
