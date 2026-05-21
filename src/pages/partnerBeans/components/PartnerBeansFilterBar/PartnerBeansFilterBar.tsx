// partnerBeans 搜索与筛选区块
import React from 'react';
import SlidingTabBar from '@components/ui/filter/SlidingTabBar/SlidingTabBar';
import { IconPartnerBeansClose, IconPartnerBeansSearch } from '../PartnerBeansIcons/PartnerBeansIcons';
import { PARTNER_BEANS_FILTER_TABS } from '../../partnerBeans.constants';
import type { PartnerBeansFilterTab } from '../../partnerBeans.types';
import styles from './PartnerBeansFilterBar.module.less';

interface PartnerBeansFilterBarProps {
  activeTab: PartnerBeansFilterTab;
  searchQuery: string;
  setActiveTab: (tab: PartnerBeansFilterTab) => void;
  setSearchQuery: (value: string) => void;
}

const PartnerBeansFilterBarComponent: React.FC<PartnerBeansFilterBarProps> = ({
  activeTab,
  searchQuery,
  setActiveTab,
  setSearchQuery,
}) => (
  <>
    <div className={styles.searchWrap}>
      <IconPartnerBeansSearch className={styles.searchIcon} />
      <input
        className={styles.searchInput}
        type="text"
        placeholder="搜索合伙人姓名 / 手机号 / 说明..."
        value={searchQuery}
        onChange={(event) => setSearchQuery(event.target.value)}
        aria-label="搜索纯利豆记录"
      />
      {searchQuery ? (
        <button
          type="button"
          className={styles.searchClear}
          onClick={() => setSearchQuery('')}
          aria-label="清除搜索"
        >
          <IconPartnerBeansClose width={14} height={14} />
        </button>
      ) : null}
    </div>

    <SlidingTabBar
      options={PARTNER_BEANS_FILTER_TABS}
      value={activeTab}
      onChange={(value) => setActiveTab(value as PartnerBeansFilterTab)}
      variant="pill"
      ariaLabel="纯利豆记录筛选"
    />
  </>
);

const PartnerBeansFilterBar = React.memo(PartnerBeansFilterBarComponent);

export default PartnerBeansFilterBar;
