// SelectMobilePanel — 移动端底部弹层
//
// 通过 createPortal 挂到 body，规避父容器 overflow:hidden 裁剪。
// 自身只负责 UI 渲染，状态由父组件（SelectView）通过 props 注入。
// 支持 optionRender 自定义每行选项内容（类似 Ant Design）。

import React, { memo } from 'react';
import { CheckIcon, SearchIcon, SmallCheckIcon, SmallCloseIcon } from '@components/form/_shared/icons';
import { cx } from '@utils/utils';
import { createPortal } from 'react-dom';
import styles from './SelectView.module.less';
import type {
  SelectMobilePanelProps,
  SelectOptionRowProps,
} from './types';

interface SelectOptionLabelProps {
  text: string;
  keyword: string;
}

interface SelectOptionRowFactoryProps extends SelectOptionRowProps {
  rowClassName: string;
  selectedClassName: string;
  disabledClassName: string;
  customRowClassName: string;
  customContentClassName: string;
  renderSingleSelectedIcon: () => React.ReactNode;
}

export const SelectOptionLabel = memo(({ text, keyword }: SelectOptionLabelProps) => {
  const normalizedKeyword = keyword.trim().toLowerCase();
  if (!normalizedKeyword) return <>{text}</>;

  const normalizedText = text.toLowerCase();
  const matchIndex = normalizedText.indexOf(normalizedKeyword);
  if (matchIndex === -1) return <>{text}</>;

  return (
    <>
      {text.slice(0, matchIndex)}
      <mark className={styles.highlight}>
        {text.slice(matchIndex, matchIndex + normalizedKeyword.length)}
      </mark>
      {text.slice(matchIndex + normalizedKeyword.length)}
    </>
  );
});
SelectOptionLabel.displayName = 'SelectOptionLabel';

export const SelectOptionRowFactory = memo(({
  option,
  index,
  isSelected,
  isMultiple,
  keyword,
  onSingleSelect,
  onMultiToggle,
  optionRender,
  rowClassName,
  selectedClassName,
  disabledClassName,
  customRowClassName,
  customContentClassName,
  renderSingleSelectedIcon,
}: SelectOptionRowFactoryProps) => {
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
        rowClassName,
        isSelected && selectedClassName,
        option.disabled && disabledClassName,
        optionRender && customRowClassName,
      )}
      onClick={handleClick}
      role="option"
      aria-selected={isSelected}
    >
      {optionRender ? (
        <div className={customContentClassName}>
          {optionRender(option, { index, keyword, isSelected })}
        </div>
      ) : (
        <>
          <span>
            <SelectOptionLabel text={option.label} keyword={keyword} />
          </span>
          {isMultiple ? (
            <div className={cx(styles.checkbox, isSelected && styles.checked)}>
              {isSelected && <SmallCheckIcon />}
            </div>
          ) : (
            isSelected && renderSingleSelectedIcon()
          )}
        </>
      )}
    </div>
  );
});
SelectOptionRowFactory.displayName = 'SelectOptionRowFactory';

const MobileOptionItem = memo((props: SelectOptionRowProps) => (
  <SelectOptionRowFactory
    {...props}
    rowClassName={styles['select-item']}
    selectedClassName={styles.selected}
    disabledClassName={styles.disabled}
    customRowClassName={styles['select-item-custom']}
    customContentClassName={styles['select-item-custom-content']}
    renderSingleSelectedIcon={() => <CheckIcon className={styles['check-icon']} />}
  />
));
MobileOptionItem.displayName = 'MobileOptionItem';

// ─── 底部弹层面板 ──────────────────────────────────────────────────────────────

const SelectMobilePanel: React.FC<SelectMobilePanelProps> = ({
  visible,
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
  onClose,
  onSearchChange,
  onSearchClear,
  optionRender,
}) => (
  <>
    {/* 遮罩：仅 visible 时渲染 */}
    {visible &&
      createPortal(
        <div className={styles['select-mask']} onClick={onClose} />,
        document.body,
      )}

    {/* 弹层：常驻 DOM，通过 CSS transform 控制显隐（保证入场动画流畅） */}
    {createPortal(
      <div className={cx(styles['select-picker'], visible && styles.visible)}>
        {/* 头部 */}
        <div className={styles['picker-header']}>
          <button
            type="button"
            className={styles['picker-cancel-btn']}
            onClick={onClose}
          >
            取消
          </button>

          {/* 搜索框 / 标题 */}
          {searchable ? (
            <div className={styles['picker-search-box']}>
              <SearchIcon className={styles['search-icon']} size={14} />
              <input
                className={styles['picker-search-input']}
                type="text"
                value={searchText}
                onChange={onSearchChange}
                placeholder={searchPlaceholder}
                autoComplete="off"
              />
              {searchText && (
                <button
                  type="button"
                  className={styles['search-clear-btn']}
                  onClick={onSearchClear}
                  aria-label="清除搜索"
                >
                  <SmallCloseIcon />
                </button>
              )}
            </div>
          ) : (
            <div className={styles['picker-title']}>请选择</div>
          )}

          {/* 多选确定 / 占位 */}
          {isMultiple ? (
            <button
              type="button"
              className={styles['picker-confirm-btn']}
              onClick={onMultiConfirm}
            >
              确定
            </button>
          ) : (
            <div className={styles['picker-header-right']} />
          )}
        </div>

        {/* 选项列表 */}
        <div className={styles['picker-container']}>
          {filteredOptions.length === 0 ? (
            <div className={styles['picker-empty']}>暂无匹配结果</div>
          ) : (
            <div
              className={styles['select-items']}
              style={{ opacity: isStale ? 0.5 : 1, transition: 'opacity 0.15s' }}
            >
              {filteredOptions.map((option, idx) => (
                <MobileOptionItem
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
              ))}
            </div>
          )}
        </div>
      </div>,
      document.body,
    )}
  </>
);

export default memo(SelectMobilePanel);
