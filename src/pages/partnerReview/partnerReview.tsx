// 合伙人申请审核页面：负责装配头部、筛选、状态区与申请列表。
import React from 'react';
import PageHeader from '@components/ui/layout/PageHeader';
import { useAnimatedNavigate } from '@hooks/useAnimatedNavigate';
import { isNonEmptyArray } from '@utils/utils';
import PartnerReviewApplicationList from './components/PartnerReviewApplicationList/PartnerReviewApplicationList';
import PartnerReviewFilterBar from './components/PartnerReviewFilterBar/PartnerReviewFilterBar';
import PartnerReviewPageState from './components/PartnerReviewPageState/PartnerReviewPageState';
import PartnerReviewSummaryBar from './components/PartnerReviewSummaryBar/PartnerReviewSummaryBar';
import styles from './partnerReview.module.less';
import { usePartnerReviewPage } from './usePartnerReviewPage';

const PartnerReview: React.FC = () => {
  const navigate = useAnimatedNavigate();
  const {
    filteredApplications,
    activeTab,
    expandedId,
    isLoading,
    submittingActionId,
    submittingActionType,
    errorMessage,
    stats,
    setActiveTab,
    handleToggleExpand,
    handleApprove,
    handleReject,
    retryLoad,
  } = usePartnerReviewPage();

  const showEmptyState = !isLoading && !errorMessage && !isNonEmptyArray(filteredApplications);

  return (
    <div className={styles.pageContainer}>
      <div className={styles.blurOrb} aria-hidden="true" />

      <PageHeader title="合伙人申请审核" onBack={() => navigate(-1)} />

      <main className={styles.contentWrapper}>
        {/* 顶部概览：汇总审核状态分布。 */}
        <PartnerReviewSummaryBar
          totalCount={stats.totalCount}
          pendingCount={stats.pendingCount}
          approvedCount={stats.approvedCount}
          rejectedCount={stats.rejectedCount}
        />

        {/* 筛选栏：统一管理审核状态切换。 */}
        <PartnerReviewFilterBar
          activeTab={activeTab}
          pendingCount={stats.pendingCount}
          disabled={isLoading}
          onTabChange={setActiveTab}
        />

        {isLoading ? (
          <PartnerReviewPageState variant="loading" activeTab={activeTab} onRetry={retryLoad} />
        ) : null}

        {!isLoading && errorMessage ? (
          <PartnerReviewPageState
            variant="error"
            activeTab={activeTab}
            errorMessage={errorMessage}
            onRetry={retryLoad}
          />
        ) : null}

        {showEmptyState ? (
          <PartnerReviewPageState
            variant="empty"
            activeTab={activeTab}
            totalCount={stats.totalCount}
            onRetry={retryLoad}
          />
        ) : null}

        {!isLoading && !errorMessage && !showEmptyState ? (
          <PartnerReviewApplicationList
            applications={filteredApplications}
            expandedId={expandedId}
            submittingActionId={submittingActionId}
            submittingActionType={submittingActionType}
            onToggleExpand={handleToggleExpand}
            onApprove={handleApprove}
            onReject={handleReject}
          />
        ) : null}
      </main>
    </div>
  );
};

export default PartnerReview;
