// SelectPcDropdown — PC 端下拉面板
//
// 绝对定位，通过 CSS 动画控制入场/退场（antSlideUpIn / antSlideUpOut）。
// 自身只负责 UI 渲染，状态由父组件（SelectView）通过 props 注入。
// 支持 optionRender 自定义每行选项内容（类似 Ant Design）。

import React, { memo } from 'react';
import { CheckIcon, SearchIcon, SmallCloseIcon } from '@components/form/_shared/icons';
import { cx } from '@utils/utils';
import { SelectOptionRowFactory } from './SelectMobilePanel';
import styles from './SelectView.module.less';
import type {
  SelectPcDropdownProps,
  SelectOptionRowProps,
} from './types';

const PcOptionItem = memo((props: SelectOptionRowProps) => (
  <SelectOptionRowFactory
    {...props}
    rowClassName={styles['pc-option-item']}
    selectedClassName={styles.active}
    disabledClassName={styles.disabled}
    customRowClassName={styles['pc-option-item-custom']}
    customContentClassName={styles['pc-option-custom-content']}
    renderSingleSelectedIcon={() => <CheckIcon className={styles['check-icon']} size={14} />}
  />
));
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
  optionRender,
}) => (
  <div
    className={cx(styles['select-dropdown-pc'], isClosing && styles.closing)}
    onAnimationEnd={onAnimationEnd}
    role="listbox"
  >
    {/* 搜索框 */}
    {searchable && (
      <div className={styles['pc-search-box']}>
        <SearchIcon className={styles['search-icon']} size={13} />
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
            <SmallCloseIcon size={11} />
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
        filteredOptions.map((option, idx) => (
          <PcOptionItem
            key={String(option.value)}
            option={option}
            index={idx}
            isSelected={isSelected(option.value)}
            isMultiple={isMultiple}
            keyword={deferredSearch}
            onSingleSelect={onSingleSelect}
            onMultiToggle={onMultiToggle}
            optionRender={optionRender}
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
