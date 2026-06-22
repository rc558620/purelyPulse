// 合伙人打款申请卡片
import React from 'react';
import { cx, fmtAmount, safeStr } from '@utils/utils';
import {
  IconPartnerPayoutApprove,
  IconPartnerPayoutExpandArrow,
  IconPartnerPayoutInfo,
  IconPartnerPayoutLocation,
  IconPartnerPayoutReject,
} from '../PartnerPayoutIcons/PartnerPayoutIcons';
import type {
  PartnerPayoutAccountType,
  PartnerPayoutApplication,
  PartnerPayoutStatus,
} from '../../partnerPayout.types';
import styles from './PartnerPayoutApplicationCard.module.less';

const PARTNER_PAYOUT_ACCOUNT_LABEL_MAP: Record<PartnerPayoutAccountType, string> = {
  wechat: '微信',
  alipay: '支付宝',
  bank: '银行卡',
};

const PARTNER_PAYOUT_STATUS_CONFIG: Record<PartnerPayoutStatus, { label: string; className: string }> = {
  pending: { label: '待处理', className: 'statusPending' },
  approved: { label: '审核中', className: 'statusApproved' },
  paid: { label: '已打款', className: 'statusPaid' },
  rejected: { label: '已拒绝', className: 'statusRejected' },
};

interface PartnerPayoutApplicationCardProps {
  /** 打款申请数据 */
  application: PartnerPayoutApplication;
  /** 当前是否展开 */
  expanded: boolean;
  /** 当前是否提交中 */
  isSubmitting: boolean;
  /** 切换展开态 */
  onToggle: (id: string) => void;
  /** 确认打款 */
  onApprove: (id: string) => Promise<void>;
  /** 拒绝打款 */
  onReject: (id: string) => Promise<void>;
}

const PartnerPayoutApplicationCard: React.FC<PartnerPayoutApplicationCardProps> = React.memo(({
  application,
  expanded,
  isSubmitting,
  onToggle,
  onApprove,
  onReject,
}) => {
  const statusConfig = PARTNER_PAYOUT_STATUS_CONFIG[application.status];

  return (
    <div className={cx(styles.card, expanded && styles.cardExpanded)}>
      <div
        className={styles.cardMain}
        onClick={() => onToggle(application.id)}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            onToggle(application.id);
          }
        }}
        role="button"
        aria-expanded={expanded}
        tabIndex={0}
      >
        <div className={cx(styles.avatar, styles[`avatar_${application.status}`], application.partnerAvatarUrl && styles.avatarWithImage)} aria-hidden="true">
          {application.partnerAvatarUrl ? <img className={styles.avatarImg} src={application.partnerAvatarUrl} alt="" /> : safeStr(application.partnerName).slice(0, 1)}
        </div>

        <div className={styles.cardInfo}>
          <div className={styles.cardNameRow}>
            <span className={styles.cardName}>{safeStr(application.partnerName, '--')}</span>
            <span className={styles.cardCity}>
              <IconPartnerPayoutLocation className={styles.cityIcon} />
              {safeStr(application.partnerCity, '--')}
            </span>
          </div>
          <div className={styles.cardMeta}>
            <span>{safeStr(application.partnerPhone, '--')}</span>
            <span className={styles.metaDot} aria-hidden="true" />
            <span>{safeStr(application.appliedAt, '--')}</span>
          </div>
        </div>

        <div className={styles.cardRight}>
          <div className={styles.cardAmount}>¥{fmtAmount(application.amount / 100)}</div>
          <div className={styles[statusConfig.className]}>{statusConfig.label}</div>
          <IconPartnerPayoutExpandArrow className={cx(styles.expandArrow, expanded && styles.expandArrowOpen)} />
        </div>
      </div>

      {expanded ? (
        <div className={styles.cardDetail}>
          <div className={styles.detailDivider} aria-hidden="true" />

          <div className={styles.detailGrid}>
            <div className={styles.detailItem}>
              <span className={styles.detailLabel}>收款方式</span>
              <span className={styles.detailVal}>{PARTNER_PAYOUT_ACCOUNT_LABEL_MAP[application.accountType]}</span>
            </div>
            <div className={styles.detailItem}>
              <span className={styles.detailLabel}>收款账号</span>
              <span className={styles.detailVal}>{safeStr(application.accountNo, '--')}</span>
            </div>
            <div className={styles.detailItem}>
              <span className={styles.detailLabel}>收款人</span>
              <span className={styles.detailVal}>{safeStr(application.accountName, '--')}</span>
            </div>
            <div className={styles.detailItem}>
              <span className={styles.detailLabel}>申请金额</span>
              <span className={cx(styles.detailVal, styles.detailValAmount)}>
                ¥{fmtAmount(application.amount / 100)}
              </span>
            </div>
            {application.txnNo ? (
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>流水号</span>
                <span className={styles.detailVal}>{safeStr(application.txnNo, '--')}</span>
              </div>
            ) : null}
            {application.paidAt ? (
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>打款时间</span>
                <span className={styles.detailVal}>{safeStr(application.paidAt, '--')}</span>
              </div>
            ) : null}
          </div>

          {application.rejectReason ? (
            <div className={styles.rejectTip}>
              <IconPartnerPayoutInfo className={styles.rejectIcon} />
              <span>拒绝原因：{safeStr(application.rejectReason, '--')}</span>
            </div>
          ) : null}

          {application.status === 'pending' ? (
            <div className={styles.actionRow}>
              <button
                type="button"
                className={styles.rejectBtn}
                onClick={(event) => {
                  event.stopPropagation();
                  void onReject(application.id);
                }}
                aria-label={`拒绝 ${safeStr(application.partnerName, '该合伙人')} 的打款申请`}
                disabled={isSubmitting}
              >
                <IconPartnerPayoutReject />
                {isSubmitting ? '处理中...' : '拒绝'}
              </button>
              <button
                type="button"
                className={styles.approveBtn}
                onClick={(event) => {
                  event.stopPropagation();
                  void onApprove(application.id);
                }}
                aria-label={`确认打款给 ${safeStr(application.partnerName, '该合伙人')}`}
                disabled={isSubmitting}
              >
                <IconPartnerPayoutApprove />
                {isSubmitting ? '处理中...' : '确认打款'}
              </button>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
});

export default PartnerPayoutApplicationCard;
