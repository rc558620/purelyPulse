// 封禁管理页：负责装配页面私有区块与交互入口。
import React from 'react';
import PageHeader from '@components/ui/layout/PageHeader';
import { useAnimatedNavigate } from '@hooks/useAnimatedNavigate';
import styles from './banManagement.module.less';
import { BanManagementConfirmDialog } from './components/BanManagementConfirmDialog/BanManagementConfirmDialog';
import { BanManagementFilterTabs } from './components/BanManagementFilterTabs/BanManagementFilterTabs';
import { BanManagementListSection } from './components/BanManagementListSection/BanManagementListSection';
import { BanManagementStatsOverview } from './components/BanManagementStatsOverview/BanManagementStatsOverview';
import { BanManagementSearchBar } from './components/BanManagementSearchBar/BanManagementSearchBar';
import { useBanManagementController } from './hooks/useBanManagementController';

const BanManagement: React.FC = () => {
  const navigate = useAnimatedNavigate();
  const {
    members,
    counts,
    isLoading,
    isRefreshing,
    isSubmitting,
    errorMessage,
    statusFilter,
    searchQuery,
    expandedId,
    confirmTarget,
    banReason,
    submittingMemberId,
    setStatusFilter,
    setSearchQuery,
    setBanReason,
    handleSearchClear,
    retryLoad,
    handleToggleExpand,
    handleOpenConfirm,
    handleCancelConfirm,
    handleConfirm,
  } = useBanManagementController();

  const handleBack = React.useCallback((): void => {
    navigate(-1);
  }, [navigate]);
  const hasSearchQuery = searchQuery.trim().length > 0;
  const showEmptyState = !isLoading && !errorMessage && members.length === 0;

  return (
    <div className={styles.pageContainer}>
      <div className={styles.blurOrb} aria-hidden="true" />
      <div className={styles.blurOrb2} aria-hidden="true" />

      <PageHeader title="封禁管理" onBack={handleBack} />

      <main className={styles.contentWrapper}>
        <BanManagementStatsOverview counts={counts} />
        <BanManagementSearchBar
          searchQuery={searchQuery}
          onChange={setSearchQuery}
          onClear={handleSearchClear}
        />
        <BanManagementFilterTabs
          counts={counts}
          disabled={isLoading}
          statusFilter={statusFilter}
          onChange={setStatusFilter}
        />
        <BanManagementListSection
          members={members}
          expandedId={expandedId}
          isLoading={isLoading}
          isRefreshing={isRefreshing}
          isSubmitting={isSubmitting}
          errorMessage={errorMessage}
          hasSearchQuery={hasSearchQuery}
          showEmptyState={showEmptyState}
          submittingMemberId={submittingMemberId}
          onRetry={retryLoad}
          onSearchClear={handleSearchClear}
          onToggleExpand={handleToggleExpand}
          onOpenConfirm={handleOpenConfirm}
        />
      </main>

      {confirmTarget ? (
        <BanManagementConfirmDialog
          member={confirmTarget.member}
          action={confirmTarget.action}
          selectedReason={banReason}
          isSubmitting={submittingMemberId === confirmTarget.member.id}
          onReasonChange={setBanReason}
          onConfirm={handleConfirm}
          onCancel={handleCancelConfirm}
        />
      ) : null}
    </div>
  );
};

export default BanManagement;
