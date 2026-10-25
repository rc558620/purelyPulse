// smsBroadcast 门店短信钱包变动记录筛选：全部 / 平台调整 / 充值 / 消耗 / 退费
import React from 'react';
import SlidingTabBar from '@components/ui/filter/SlidingTabBar/SlidingTabBar';
import { SMS_BROADCAST_LOG_TABS } from '../../smsBroadcast.constants';
import type { SmsBroadcastLogTab } from '../../smsBroadcast.types';

interface SmsBroadcastLogFilterBarProps {
  /** 当前选中的变动记录 Tab */
  activeTab: SmsBroadcastLogTab;
  setActiveTab: (tab: SmsBroadcastLogTab) => void;
}

const SmsBroadcastLogFilterBarComponent: React.FC<SmsBroadcastLogFilterBarProps> = ({
  activeTab,
  setActiveTab,
}) => (
  <SlidingTabBar
    options={SMS_BROADCAST_LOG_TABS}
    value={activeTab}
    onChange={setActiveTab}
    variant="pill"
    ariaLabel="短信变动记录筛选"
  />
);

const SmsBroadcastLogFilterBar = React.memo(SmsBroadcastLogFilterBarComponent);

export default SmsBroadcastLogFilterBar;
