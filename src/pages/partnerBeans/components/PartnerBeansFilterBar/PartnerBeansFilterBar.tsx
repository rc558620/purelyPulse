// partnerBeans 搜索与筛选区块
import React from 'react';
import SlidingTabBar from '@components/ui/filter/SlidingTabBar/SlidingTabBar';
import { IconPartnerBeansClose, IconPartnerBeansSearch } from '../PartnerBeansIcons/PartnerBeansIcons';
import { PARTNER_BEANS_FILTER_TABS } from '../../partnerBeans.constants';
import type { PartnerBeansFilterTab } from '../../partnerBeans.types';
import styles from './PartnerBeansFilterBar.module.less';

interface PartnerBeansFilterBarProps {
  /** 当前筛选 Tab：不传则不渲染 Tab 行（余额一览视图只用搜索框） */
  activeTab?: PartnerBeansFilterTab;
  /** 搜索输入值：setSearchQuery 不传时整个搜索框不渲染（详情视图只用 Tab） */
  searchQuery?: string;
  setActiveTab?: (tab: PartnerBeansFilterTab) => void;
  setSearchQuery?: (value: string) => void;
  /** 搜索框占位文案，默认按流水说明口径 */
  searchPlaceholder?: string;
}

const PartnerBeansFilterBarComponent: React.FC<PartnerBeansFilterBarProps> = ({
  activeTab,
  searchQuery = '',
  setActiveTab,
  setSearchQuery,
  searchPlaceholder = '搜索合伙人姓名 / 手机号 / 说明...',
}) => (
  <>
    {setSearchQuery ? (
      <div className={styles.searchWrap}>
        <IconPartnerBeansSearch className={styles.searchIcon} />
        <input
          className={styles.searchInput}
          type="text"
          placeholder={searchPlaceholder}
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
    ) : null}

    {activeTab && setActiveTab ? (
      <SlidingTabBar
        options={PARTNER_BEANS_FILTER_TABS}
        value={activeTab}
        onChange={(value) => setActiveTab(value as PartnerBeansFilterTab)}
        variant="pill"
        ariaLabel="纯利豆记录筛选"
      />
    ) : null}
  </>
);

const PartnerBeansFilterBar = React.memo(PartnerBeansFilterBarComponent);

export default PartnerBeansFilterBar;
