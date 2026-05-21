// 会员搜索栏：带清除按钮的输入框，支持姓名 / 手机号搜索。
import React, { memo } from 'react';
import { IconClose, IconSearch } from '../MemberListIcons/MemberListIcons';
import styles from '../../../../memberList.module.less';

interface MemberListSearchBarProps {
  /** 搜索关键词 */
  value: string;
  /** 关键词变更回调 */
  onChange: (value: string) => void;
  /** 清除搜索回调 */
  onClear: () => void;
}

const MemberListSearchBar: React.FC<MemberListSearchBarProps> = ({ value, onChange, onClear }) => (
  <div className={styles.searchWrap}>
    <div className={styles.searchIcon} aria-hidden="true">
      <IconSearch />
    </div>
    <input
      className={styles.searchInput}
      type="search"
      placeholder="搜索姓名 / 手机号"
      value={value}
      onChange={(event) => onChange(event.target.value)}
      aria-label="搜索会员"
    />
    {value && (
      <button
        type="button"
        className={styles.searchClear}
        onClick={onClear}
        aria-label="清除搜索"
      >
        <IconClose width={12} height={12} strokeWidth={3} />
      </button>
    )}
  </div>
);

export default memo(MemberListSearchBar);
