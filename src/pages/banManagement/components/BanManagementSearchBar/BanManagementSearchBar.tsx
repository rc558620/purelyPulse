// 封禁管理搜索栏：负责关键词输入与清空操作。
import React from 'react';
import { IconClose, IconSearch } from '../BanManagementIcons/BanManagementIcons';
import styles from './BanManagementSearchBar.module.less';

interface BanManagementSearchBarProps {
  searchQuery: string;
  onChange: (value: string) => void;
  onClear: () => void;
}

const BanManagementSearchBarComponent: React.FC<BanManagementSearchBarProps> = ({
  searchQuery,
  onChange,
  onClear,
}) => {
  return (
    <div className={styles.searchWrap}>
      <div className={styles.searchIconWrap} aria-hidden="true">
        <IconSearch />
      </div>
      <input
        className={styles.searchInput}
        type="search"
        placeholder="搜索姓名或手机号…"
        value={searchQuery}
        onChange={(event) => onChange(event.target.value)}
        aria-label="搜索用户"
      />
      {searchQuery ? (
        <button
          type="button"
          className={styles.searchClear}
          onClick={onClear}
          aria-label="清除搜索"
        >
          <IconClose />
        </button>
      ) : null}
    </div>
  );
};

export const BanManagementSearchBar = React.memo(BanManagementSearchBarComponent);

BanManagementSearchBar.displayName = 'BanManagementSearchBar';
