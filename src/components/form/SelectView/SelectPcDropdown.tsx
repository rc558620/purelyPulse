// SelectPcDropdown — PC 端下拉面板
//
// 绝对定位，通过 CSS 动画控制入场/退场（antSlideUpIn / antSlideUpOut）。
// 自身只负责 UI 渲染，状态由父组件（SelectView）通过 props 注入。

import React, { memo } from 'react';
import type { SelectOption, SelectValue, SelectPcDropdownProps } from './types';
import styles from './SelectView.module.less';
import { cx } from '@utils/utils';

// ─── 搜索关键词高亮 ────────────────────────────────────────────────────────────

const HighlightText = memo(({ text, keyword }: { text: string; keyword: string }) => {
  if (!keyword.trim()) return <>{text}</>;

  const lowerText    = text.toLowerCase();
  const lowerKeyword = keyword.trim().toLowerCase();
  const index        = lowerText.indexOf(lowerKeyword);

  if (index === -1) return <>{text}</>;

  return (
    <>
      {text.slice(0, index)}
      <mark className={styles['highlight']}>
        {text.slice(index, index + lowerKeyword.length)}
      </mark>
      {text.slice(index + lowerKeyword.length)}
    </>
  );
});
HighlightText.displayName = 'HighlightText';

// ─── PC 端选项条目 ─────────────────────────────────────────────────────────────

interface PcOptionItemProps {
  option: SelectOption;
  isSelected: boolean;
  isMultiple: boolean;
  keyword: string;
  onSingleSelect: (val: SelectValue) => void;
  onMultiToggle: (val: SelectValue) => void;
}

const PcOptionItem = memo(({
  option,
  isSelected,
  isMultiple,
  keyword,
  onSingleSelect,
  onMultiToggle,
}: PcOptionItemProps) => {
  const handleClick = () => {
    if (option.disabled) return;
    if (isMultiple) {
      onMultiToggle(option.value);
    } else {
      onSingleSelect(option.value);
    }
  };

  return (
    <div
      className={cx(
        styles['pc-option-item'],
        isSelected && styles['active'],
        option.disabled && styles['disabled'],
      )}
      onClick={handleClick}
    >
      <span>
        <HighlightText text={option.label} keyword={keyword} />
      </span>

      {isMultiple ? (
        <div className={cx(styles['checkbox'], isSelected && styles['checked'])}>
          {isSelected && (
            <svg
              width="10"
              height="10"
              viewBox="0 0 10 10"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden="true"
            >
              <path d="M1.5 5l2.5 2.5 4.5-4.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        </div>
      ) : (
        isSelected && (
          <svg
            className={styles['check-icon']}
            width="14"
            height="14"
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            aria-hidden="true"
          >
            <path d="M2.5 8l3.5 3.5 7-7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )
      )}
    </div>
  );
});
PcOptionItem.displayName = 'PcOptionItem';

// ─── 下拉面板 ──────────────────────────────────────────────────────────────────

const SelectPcDropdown: React.FC<SelectPcDropdownProps> = ({
  isClosing,
  isMultiple,
  filteredOptions,
  searchText,
  deferredSearch,
  isStale,
  searchable,
  searchPlaceholder,
  isSelected,
  onSingleSelect,
  onMultiToggle,
  onMultiConfirm,
  onAnimationEnd,
  onSearchChange,
  onSearchClear,
}) => (
  <div
    className={cx(styles['select-dropdown-pc'], isClosing && styles['closing'])}
    onAnimationEnd={onAnimationEnd}
    role="listbox"
  >
    {/* 搜索框 */}
    {searchable && (
      <div className={styles['pc-search-box']}>
        <svg
          className={styles['search-icon']}
          width="13"
          height="13"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          aria-hidden="true"
        >
          <circle cx="11" cy="11" r="8" />
          <path d="M21 21l-4.35-4.35" />
        </svg>
        <input
          className={styles['pc-search-input']}
          type="text"
          value={searchText}
          onChange={onSearchChange}
          placeholder={searchPlaceholder}
          autoFocus
          autoComplete="off"
        />
        {searchText && (
          <button
            type="button"
            className={styles['search-clear-btn']}
            onClick={onSearchClear}
            aria-label="清除搜索"
          >
            <svg width="11" height="11" viewBox="0 0 12 12" fill="currentColor" aria-hidden="true">
              <path d="M6 5.293L10.146 1.146a.5.5 0 01.708.708L6.707 6l4.147 4.146a.5.5 0 01-.708.708L6 6.707l-4.146 4.147a.5.5 0 01-.708-.708L5.293 6 1.146 1.854a.5.5 0 01.708-.708L6 5.293z" />
            </svg>
          </button>
        )}
      </div>
    )}

    {/* 选项列表 */}
    <div
      className={styles['pc-options']}
      style={{ opacity: isStale ? 0.5 : 1, transition: 'opacity 0.15s' }}
    >
      {filteredOptions.length === 0 ? (
        <div className={styles['picker-empty']}>暂无匹配结果</div>
      ) : (
        filteredOptions.map(option => (
          <PcOptionItem
            key={String(option.value)}
            option={option}
            isSelected={isSelected(option.value)}
            isMultiple={isMultiple}
            keyword={deferredSearch}
            onSingleSelect={onSingleSelect}
            onMultiToggle={onMultiToggle}
          />
        ))
      )}
    </div>

    {/* 多选底部确定按钮 */}
    {isMultiple && (
      <div className={styles['pc-footer']}>
        <button
          type="button"
          className={styles['pc-confirm-btn']}
          onClick={onMultiConfirm}
        >
          确定
        </button>
      </div>
    )}
  </div>
);

export default memo(SelectPcDropdown);
