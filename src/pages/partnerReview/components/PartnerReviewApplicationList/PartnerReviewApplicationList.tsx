// 合伙人申请审核列表：统一渲染申请卡片集合。
import React, { memo } from 'react';
import { isNonEmptyArray } from '@utils/utils';
import type { PartnerApplication, ReviewSubmitAction } from '../../partnerReview.types';
import PartnerReviewApplicationCard from '../PartnerReviewApplicationCard/PartnerReviewApplicationCard';
import styles from './PartnerReviewApplicationList.module.less';

interface PartnerReviewApplicationListProps {
  /** 申请列表 */
  applications: PartnerApplication[];
  /** 当前展开的申请 id */
  expandedId: string | null;
  /** 当前提交中的申请 id */
  submittingActionId: string | null;
  /** 当前提交中的动作 */
  submittingActionType: ReviewSubmitAction | null;
  /** 切换展开态 */
  onToggleExpand: (id: string) => void;
  /** 审核通过 */
  onApprove: (id: string) => Promise<void>;
  /** 审核拒绝 */
  onReject: (id: string) => Promise<void>;
}

const PartnerReviewApplicationList: React.FC<PartnerReviewApplicationListProps> = memo(({
  applications,
  expandedId,
  submittingActionId,
  submittingActionType,
  onToggleExpand,
  onApprove,
  onReject,
}) => (
  <div className={styles.listWrap}>
    {isNonEmptyArray(applications)
      ? applications.map((application) => (
        <PartnerReviewApplicationCard
          key={application.id}
          application={application}
          expanded={expandedId === application.id}
          isSubmitting={submittingActionId === application.id}
          submittingActionType={submittingActionId === application.id ? submittingActionType : null}
          onToggleExpand={onToggleExpand}
          onApprove={onApprove}
          onReject={onReject}
        />
      ))
      : null}
  </div>
));

PartnerReviewApplicationList.displayName = 'PartnerReviewApplicationList';

export default PartnerReviewApplicationList;
