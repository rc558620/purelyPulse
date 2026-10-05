// 新客额度管理页面：门店额度一览 + 增减额度
import React from 'react';
import PageHeader from '@components/ui/layout/PageHeader';
import { useAnimatedNavigate } from '@hooks/useAnimatedNavigate';
import NewCustomerQuotaFilterBar from './components/NewCustomerQuotaFilterBar/NewCustomerQuotaFilterBar';
import { IconNewCustomerQuotaAdd } from './components/NewCustomerQuotaIcons/NewCustomerQuotaIcons';
import NewCustomerQuotaPageState from './components/NewCustomerQuotaPageState/NewCustomerQuotaPageState';
import NewCustomerQuotaStatsOverview from './components/NewCustomerQuotaStatsOverview/NewCustomerQuotaStatsOverview';
import NewCustomerQuotaStoreList from './components/NewCustomerQuotaStoreList/NewCustomerQuotaStoreList';
import NewCustomerQuotaStorePicker from './components/NewCustomerQuotaStorePicker/NewCustomerQuotaStorePicker';
import SetQuotaModal from './components/SetQuotaModal/SetQuotaModal';
import { useNewCustomerQuotaPage } from './useNewCustomerQuotaPage';
import styles from './newCustomerQuota.module.less';

const NewCustomerQuota: React.FC = () => {
  const navigate = useAnimatedNavigate();
  const {
    filteredStores,
    pickerStores,
    activeTab,
    searchQuery,
    pickerSearchQuery,
    targetStore,
    showStorePicker,
    isLoading,
    isSubmitting,
    errorMessage,
    stats,
    setActiveTab,
    setSearchQuery,
    setPickerSearchQuery,
    openStorePicker,
    closeStorePicker,
    handleOpenAdjust,
    handleCloseAdjust,
    handleConfirmAdjust,
    retryLoad,
  } = useNewCustomerQuotaPage();

  return (
    <div className={styles.pageContainer}>
      <PageHeader
        title="新客额度管理"
        onBack={() => navigate(-1)}
        rightExtra={(
          <button
            type="button"
            className={styles.adjustEntryBtn}
            onClick={openStorePicker}
            aria-label="设置门店新客额度"
            disabled={isSubmitting}
          >
            <IconNewCustomerQuotaAdd />
            设置额度
          </button>
        )}
      />

      <main className={styles.contentWrapper}>
        {isLoading ? <NewCustomerQuotaPageState message="加载中..." variant="loading" /> : null}
        {!isLoading && errorMessage ? (
          <NewCustomerQuotaPageState message={errorMessage} variant="error" onRetry={retryLoad} />
        ) : null}
        {!isLoading && !errorMessage ? (
          <>
            <NewCustomerQuotaStatsOverview stats={stats} />
            <NewCustomerQuotaFilterBar
              activeTab={activeTab}
              searchQuery={searchQuery}
              setActiveTab={setActiveTab}
              setSearchQuery={setSearchQuery}
            />
            <NewCustomerQuotaStoreList
              isSubmitting={isSubmitting}
              stores={filteredStores}
              onAdjust={handleOpenAdjust}
            />
          </>
        ) : null}
      </main>

      {showStorePicker ? (
        <NewCustomerQuotaStorePicker
          isSubmitting={isSubmitting}
          searchQuery={pickerSearchQuery}
          stores={pickerStores}
          onClose={closeStorePicker}
          onSearchChange={setPickerSearchQuery}
          onSelect={handleOpenAdjust}
        />
      ) : null}

      {targetStore ? (
        <SetQuotaModal
          store={targetStore}
          onClose={handleCloseAdjust}
          onConfirm={handleConfirmAdjust}
          isSubmitting={isSubmitting}
        />
      ) : null}
    </div>
  );
};

export default NewCustomerQuota;
