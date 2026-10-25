// newCustomerQuota 门店额度变动记录筛选：全部 / 管理员调整 / 充值 / 消耗
import React from 'react';
import SlidingTabBar from '@components/ui/filter/SlidingTabBar/SlidingTabBar';
import { NEW_CUSTOMER_QUOTA_LOG_TABS } from '../../newCustomerQuota.constants';
import type { NewCustomerQuotaLogTab } from '../../newCustomerQuota.types';

interface NewCustomerQuotaLogFilterBarProps {
  /** 当前选中的变动记录 Tab */
  activeTab: NewCustomerQuotaLogTab;
  setActiveTab: (tab: NewCustomerQuotaLogTab) => void;
}

const NewCustomerQuotaLogFilterBarComponent: React.FC<NewCustomerQuotaLogFilterBarProps> = ({
  activeTab,
  setActiveTab,
}) => (
  <SlidingTabBar
    options={NEW_CUSTOMER_QUOTA_LOG_TABS}
    value={activeTab}
    onChange={setActiveTab}
    variant="pill"
    ariaLabel="额度变动记录筛选"
  />
);

const NewCustomerQuotaLogFilterBar = React.memo(NewCustomerQuotaLogFilterBarComponent);

export default NewCustomerQuotaLogFilterBar;
