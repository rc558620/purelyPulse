// 合伙人打款页面
import React from 'react';
import PageHeader from '@components/ui/layout/PageHeader';
import { isNonEmptyArray } from '@utils/utils';
import { useAnimatedNavigate } from '@hooks/useAnimatedNavigate';
import PartnerPayoutApplicationCard from './components/PartnerPayoutApplicationCard/PartnerPayoutApplicationCard';
import PartnerPayoutConfirmDialog from './components/PartnerPayoutConfirmDialog/PartnerPayoutConfirmDialog';
import PartnerPayoutFilterBar from './components/PartnerPayoutFilterBar/PartnerPayoutFilterBar';
import PartnerPayoutPageState from './components/PartnerPayoutPageState/PartnerPayoutPageState';
import PartnerPayoutSummaryBar from './components/PartnerPayoutSummaryBar/PartnerPayoutSummaryBar';
import { usePartnerPayoutPage } from './usePartnerPayoutPage';
import styles from './partnerPayout.module.less';

const PartnerPayout: React.FC = () => {
  const navigate = useAnimatedNavigate();
  const {
    activeTab,
    expandedApplicationId,
    submittingApplicationId,
    filteredApplications,
    isLoading,
    isSubmitting,
    errorMessage,
    summary,
    stats,
    confirmState,
    handleTabChange,
    handleApplicationToggle,
    handleOpenConfirm,
    handleCloseConfirm,
    handleConfirmSubmit,
    handleRetry,
  } = usePartnerPayoutPage();

  const showEmptyState = !isLoading && !errorMessage && !isNonEmptyArray(filteredApplications);

  return (
    <div className={styles.pageContainer}>
      <div className={styles.blurOrb} aria-hidden="true" />

      <PageHeader title="合伙人打款" onBack={() => navigate(-1)} />

      <main className={styles.contentWrapper}>
        <PartnerPayoutSummaryBar
          pendingCount={summary.pendingCount}
          pendingAmount={summary.pendingAmount}
          paidAmount={summary.paidAmount}
        />

        <PartnerPayoutFilterBar
          activeTab={activeTab}
          pendingCount={summary.pendingCount}
          disabled={isLoading}
          onTabChange={handleTabChange}
        />

        {isLoading ? (
          <PartnerPayoutPageState variant="loading" activeTab={activeTab} onRetry={handleRetry} />
        ) : null}

        {!isLoading && errorMessage ? (
          <PartnerPayoutPageState
            variant="error"
            activeTab={activeTab}
            errorMessage={errorMessage}
            onRetry={handleRetry}
          />
        ) : null}

        {showEmptyState ? (
          <PartnerPayoutPageState
            variant="empty"
            activeTab={activeTab}
            totalCount={stats.totalCount}
            onRetry={handleRetry}
          />
        ) : null}

        {!isLoading && !errorMessage && isNonEmptyArray(filteredApplications) ? (
          <div className={styles.listWrap}>
            {filteredApplications.map((application) => (
              <PartnerPayoutApplicationCard
                key={application.id}
                application={application}
                expanded={expandedApplicationId === application.id}
                isSubmitting={submittingApplicationId === application.id}
                isAnySubmitting={isSubmitting}
                onToggle={handleApplicationToggle}
                onApprove={(id) => handleOpenConfirm(id, 'approve')}
                onReject={(id) => handleOpenConfirm(id, 'reject')}
              />
            ))}
          </div>
        ) : null}
      </main>

      {confirmState.visible && confirmState.application ? (
        <PartnerPayoutConfirmDialog
          application={confirmState.application}
          action={confirmState.action}
          isSubmitting={isSubmitting}
          onConfirm={handleConfirmSubmit}
          onCancel={handleCloseConfirm}
        />
      ) : null}
    </div>
  );
};

export default PartnerPayout;
