// 合伙人申请审核卡片：负责单条申请的摘要与审核操作展示。
import React, { memo, useCallback } from 'react';
import { cx, safeStr } from '@utils/utils';
import {
  IconPartnerReviewApprove,
  IconPartnerReviewExpandArrow,
  IconPartnerReviewLocation,
  IconPartnerReviewReject,
} from '../PartnerReviewIcons/PartnerReviewIcons';
import type { ApplicationStatus, PartnerApplication, ReviewSubmitAction } from '../../partnerReview.types';
import styles from './PartnerReviewApplicationCard.module.less';

const PARTNER_REVIEW_STATUS_CONFIG: Record<ApplicationStatus, { label: string; className: string }> = {
  pending: { label: '待审核', className: 'statusPending' },
  approved: { label: '已通过', className: 'statusApproved' },
  rejected: { label: '已拒绝', className: 'statusRejected' },
};

interface PartnerReviewApplicationCardProps {
  /** 申请数据 */
  application: PartnerApplication;
  /** 当前是否展开 */
  expanded: boolean;
  /** 当前是否提交中 */
  isSubmitting: boolean;
  /** 当前提交动作 */
  submittingActionType: ReviewSubmitAction | null;
  /** 切换展开态 */
  onToggleExpand: (id: string) => void;
  /** 审核通过 */
  onApprove: (id: string) => Promise<void>;
  /** 审核拒绝 */
  onReject: (id: string) => Promise<void>;
}

const PartnerReviewApplicationCard: React.FC<PartnerReviewApplicationCardProps> = memo(({
  application,
  expanded,
  isSubmitting,
  submittingActionType,
  onToggleExpand,
  onApprove,
  onReject,
}) => {
  const statusConfig = PARTNER_REVIEW_STATUS_CONFIG[application.status];

  const handleToggle = useCallback((): void => {
    onToggleExpand(application.id);
  }, [application.id, onToggleExpand]);

  const handleKeyDown = useCallback((event: React.KeyboardEvent<HTMLDivElement>): void => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onToggleExpand(application.id);
    }
  }, [application.id, onToggleExpand]);

  const handleRejectClick = useCallback((event: React.MouseEvent<HTMLButtonElement>): void => {
    event.stopPropagation();
    void onReject(application.id);
  }, [application.id, onReject]);

  const handleApproveClick = useCallback((event: React.MouseEvent<HTMLButtonElement>): void => {
    event.stopPropagation();
    void onApprove(application.id);
  }, [application.id, onApprove]);

  return (
    <div className={cx(styles.card, expanded && styles.cardExpanded)}>
      <div
        className={styles.cardMain}
        onClick={handleToggle}
        onKeyDown={handleKeyDown}
        role="button"
        aria-expanded={expanded}
        tabIndex={0}
      >
        <div
          className={cx(
            styles.avatar,
            application.status === 'approved' && styles.avatarApproved,
            application.status === 'rejected' && styles.avatarRejected,
            application.avatarUrl && styles.avatarWithImage,
          )}
          aria-hidden="true"
        >
          {application.avatarUrl ? <img className={styles.avatarImg} src={application.avatarUrl} alt="" /> : safeStr(application.avatar, '合').slice(0, 1)}
        </div>

        <div className={styles.cardInfo}>
          <div className={styles.cardNameRow}>
            <span className={styles.cardName}>{safeStr(application.name, '--')}</span>
            <span className={styles.cardCity}>
              <IconPartnerReviewLocation className={styles.cityIcon} />
              {safeStr(application.city, '--')}
            </span>
          </div>
          <div className={styles.cardMeta}>
            <span>{safeStr(application.phone, '--')}</span>
            <span className={styles.metaDot} aria-hidden="true" />
            <span>{safeStr(application.appliedAt, '--')}</span>
          </div>
        </div>

        <div className={styles.cardRight}>
          <div className={styles[statusConfig.className]}>
            {application.status === 'approved' ? <IconPartnerReviewApprove className={styles.statusIcon} /> : null}
            {application.status === 'rejected' ? <IconPartnerReviewReject className={styles.statusIcon} /> : null}
            {statusConfig.label}
          </div>
          <IconPartnerReviewExpandArrow className={cx(styles.expandArrow, expanded && styles.expandArrowOpen)} />
        </div>
      </div>

      {expanded ? (
        <div className={styles.cardDetail}>
          <div className={styles.reasonLabel}>申请理由</div>
          <p className={styles.reasonText}>{safeStr(application.reason, '暂无申请理由')}</p>

          {application.status === 'pending' ? (
            <div className={styles.actionRow}>
              <button
                type="button"
                className={styles.rejectBtn}
                onClick={handleRejectClick}
                aria-label={`拒绝 ${safeStr(application.name, '该合伙人')} 的申请`}
                disabled={isSubmitting}
              >
                <IconPartnerReviewReject />
                {isSubmitting && submittingActionType === 'reject' ? '处理中...' : '不通过'}
              </button>
              <button
                type="button"
                className={styles.approveBtn}
                onClick={handleApproveClick}
                aria-label={`通过 ${safeStr(application.name, '该合伙人')} 的申请`}
                disabled={isSubmitting}
              >
                <IconPartnerReviewApprove />
                {isSubmitting && submittingActionType === 'approve' ? '处理中...' : '通过'}
              </button>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
});

PartnerReviewApplicationCard.displayName = 'PartnerReviewApplicationCard';

export default PartnerReviewApplicationCard;
