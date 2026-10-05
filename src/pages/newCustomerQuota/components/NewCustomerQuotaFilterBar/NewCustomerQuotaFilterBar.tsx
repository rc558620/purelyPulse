// 新客额度门店列表筛选区块（搜索门店名 + 额度健康度 Tab）
import React from 'react';
import SlidingTabBar from '@components/ui/filter/SlidingTabBar/SlidingTabBar';
import {
  IconNewCustomerQuotaClose,
  IconNewCustomerQuotaSearch,
} from '../NewCustomerQuotaIcons/NewCustomerQuotaIcons';
import { NEW_CUSTOMER_QUOTA_FILTER_TABS } from '../../newCustomerQuota.constants';
import type { NewCustomerQuotaFilterTab } from '../../newCustomerQuota.types';
import styles from './NewCustomerQuotaFilterBar.module.less';

interface NewCustomerQuotaFilterBarProps {
  activeTab: NewCustomerQuotaFilterTab;
  searchQuery: string;
  setActiveTab: (tab: NewCustomerQuotaFilterTab) => void;
  setSearchQuery: (value: string) => void;
}

const NewCustomerQuotaFilterBarComponent: React.FC<NewCustomerQuotaFilterBarProps> = ({
  activeTab,
  searchQuery,
  setActiveTab,
  setSearchQuery,
}) => (
  <>
    <div className={styles.searchWrap}>
      <IconNewCustomerQuotaSearch className={styles.searchIcon} />
      <input
        className={styles.searchInput}
        type="text"
        placeholder="搜索昵称 / 手机号 / 门店名..."
        value={searchQuery}
        onChange={(event) => setSearchQuery(event.target.value)}
        aria-label="搜索门店主账号"
      />
      {searchQuery ? (
        <button
          type="button"
          className={styles.searchClear}
          onClick={() => setSearchQuery('')}
          aria-label="清除搜索"
        >
          <IconNewCustomerQuotaClose width={14} height={14} />
        </button>
      ) : null}
    </div>

    <SlidingTabBar
      options={NEW_CUSTOMER_QUOTA_FILTER_TABS}
      value={activeTab}
      onChange={(value) => setActiveTab(value as NewCustomerQuotaFilterTab)}
      variant="pill"
      ariaLabel="门店额度筛选"
    />
  </>
);

const NewCustomerQuotaFilterBar = React.memo(NewCustomerQuotaFilterBarComponent);

export default NewCustomerQuotaFilterBar;
