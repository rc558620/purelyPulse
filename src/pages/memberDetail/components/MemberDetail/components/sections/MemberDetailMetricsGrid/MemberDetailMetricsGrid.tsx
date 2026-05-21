// 会员详情指标网格：展示积分、纯利豆、充值与推广等核心统计。
import React from 'react';
import { cx, safeNum, safeStr } from '@utils/utils';
import {
  IconBankCard,
  IconBeanCoin,
  IconMembers,
  IconPlus,
  IconStarBadge,
} from '@pages/memberDetail/components/MemberDetailIcons/MemberDetailIcons';
import type { MemberDetail } from '@pages/memberList/memberList.types';
import { formatMemberAmount } from '../../../../../memberDetail.utils';
import pageStyles from '../../../../../memberDetail.module.less';
import styles from './MemberDetailMetricsGrid.module.less';

interface MemberDetailMetricsGridProps {
  member: MemberDetail;
  points: number;
  beans: number;
  isSubmittingAction: boolean;
  isSubmittingPoints: boolean;
  isSubmittingBeans: boolean;
  onOpenPointsModal: () => void;
  onOpenBeanModal: () => void;
}

const MemberDetailMetricsGrid: React.FC<MemberDetailMetricsGridProps> = React.memo(({
  member,
  points,
  beans,
  isSubmittingAction,
  isSubmittingPoints,
  isSubmittingBeans,
  onOpenPointsModal,
  onOpenBeanModal,
}) => (
  <div className={styles.root}>
    <div className={pageStyles.metricsGrid}>
      <button
        type="button"
        className={cx(pageStyles.metricCard, pageStyles.metricCardPoints)}
        onClick={onOpenPointsModal}
        aria-label="调整积分"
        disabled={isSubmittingAction}
      >
        <div className={pageStyles.metricIconWrap} aria-hidden="true">
          <IconStarBadge width={18} height={18} strokeWidth={2.2} />
        </div>
        <div className={pageStyles.metricValue}>{safeNum(points).toLocaleString('zh-CN')}</div>
        <div className={pageStyles.metricLabel}>当前积分</div>
        <div className={pageStyles.metricSub}>累计 {safeNum(member.totalPointsEarned).toLocaleString('zh-CN')}</div>
        <div className={pageStyles.metricEditHint} aria-hidden="true">
          <IconPlus />
          {isSubmittingPoints ? '提交中' : '调整'}
        </div>
      </button>

      <button
        type="button"
        className={cx(pageStyles.metricCard, pageStyles.metricCardBeans)}
        onClick={onOpenBeanModal}
        aria-label="调整纯利豆"
        disabled={isSubmittingAction}
      >
        <div className={pageStyles.metricIconWrap} aria-hidden="true">
          <IconBeanCoin width={18} height={18} strokeWidth={2.2} />
        </div>
        <div className={pageStyles.metricValue}>{safeNum(beans).toLocaleString('zh-CN')}</div>
        <div className={pageStyles.metricLabel}>纯利豆余额</div>
        <div className={pageStyles.metricSub}>
          {member.isPartner ? `合伙人 ${safeStr(member.partnerLevel)}` : '普通会员'}
        </div>
        <div className={pageStyles.metricEditHint} aria-hidden="true">
          <IconPlus />
          {isSubmittingBeans ? '提交中' : '调整'}
        </div>
      </button>

      <div className={cx(pageStyles.metricCard, pageStyles.metricCardRecharge)}>
        <div className={pageStyles.metricIconWrap} aria-hidden="true">
          <IconBankCard />
        </div>
        <div className={pageStyles.metricValue}>¥{formatMemberAmount(member.totalRecharged)}</div>
        <div className={pageStyles.metricLabel}>累计充值</div>
        <div className={pageStyles.metricSub}>共 {safeNum(member.rechargeCount)} 笔</div>
      </div>

      <div className={cx(pageStyles.metricCard, pageStyles.metricCardInvite)}>
        <div className={pageStyles.metricIconWrap} aria-hidden="true">
          <IconMembers width={18} height={18} strokeWidth={2.2} />
        </div>
        <div className={pageStyles.metricValue}>{safeNum(member.invitedCount)}</div>
        <div className={pageStyles.metricLabel}>推广人数</div>
        <div className={pageStyles.metricSub}>
          {safeNum(member.invitedCount) > 0 ? '有效推广' : '暂无推广'}
        </div>
      </div>
    </div>
  </div>
));

MemberDetailMetricsGrid.displayName = 'MemberDetailMetricsGrid';

export default MemberDetailMetricsGrid;
