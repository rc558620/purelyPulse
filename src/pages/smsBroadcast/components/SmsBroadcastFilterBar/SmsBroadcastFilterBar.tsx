// 短信余额门店列表筛选区块（搜索门店名 + 额度健康度 Tab）
import React from 'react';
import SlidingTabBar from '@components/ui/filter/SlidingTabBar/SlidingTabBar';
import {
  IconSmsBroadcastClose,
  IconSmsBroadcastSearch,
} from '../SmsBroadcastIcons/SmsBroadcastIcons';
import { SMS_BROADCAST_FILTER_TABS } from '../../smsBroadcast.constants';
import type { SmsBroadcastFilterTab } from '../../smsBroadcast.types';
import styles from './SmsBroadcastFilterBar.module.less';

interface SmsBroadcastFilterBarProps {
  activeTab: SmsBroadcastFilterTab;
  searchQuery: string;
  setActiveTab: (tab: SmsBroadcastFilterTab) => void;
  setSearchQuery: (value: string) => void;
}

const SmsBroadcastFilterBarComponent: React.FC<SmsBroadcastFilterBarProps> = ({
  activeTab,
  searchQuery,
  setActiveTab,
  setSearchQuery,
}) => (
  <>
    <div className={styles.searchWrap}>
      <IconSmsBroadcastSearch className={styles.searchIcon} />
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
          <IconSmsBroadcastClose width={14} height={14} />
        </button>
      ) : null}
    </div>

    <SlidingTabBar
      options={SMS_BROADCAST_FILTER_TABS}
      value={activeTab}
      onChange={(value) => setActiveTab(value as SmsBroadcastFilterTab)}
      variant="pill"
      ariaLabel="门店额度筛选"
    />
  </>
);

const SmsBroadcastFilterBar = React.memo(SmsBroadcastFilterBarComponent);

export default SmsBroadcastFilterBar;
