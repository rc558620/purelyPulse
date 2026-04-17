// SelectMobilePanel — 移动端底部弹层
//
// 通过 createPortal 挂到 body，规避父容器 overflow:hidden 裁剪。
// 自身只负责 UI 渲染，状态由父组件（SelectView）通过 props 注入。

import React, { memo } from 'react';
import { createPortal } from 'react-dom';
import type { SelectOption, SelectValue, SelectMobilePanelProps } from './types';
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

// ─── 移动端选项条目 ────────────────────────────────────────────────────────────

interface MobileOptionItemProps {
  option: SelectOption;
  isSelected: boolean;
  isMultiple: boolean;
  keyword: string;
  onSingleSelect: (val: SelectValue) => void;
  onMultiToggle: (val: SelectValue) => void;
}

const MobileOptionItem = memo(({
  option,
  isSelected,
  isMultiple,
  keyword,
  onSingleSelect,
  onMultiToggle,
}: MobileOptionItemProps) => {
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
        styles['select-item'],
        isSelected && styles['selected'],
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
            width="16"
            height="16"
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
      <div className={cx(styles['select-picker'], visible && styles['visible'])}>
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
              <svg
                className={styles['search-icon']}
                width="14"
                height="14"
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
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor" aria-hidden="true">
                    <path d="M6 5.293L10.146 1.146a.5.5 0 01.708.708L6.707 6l4.147 4.146a.5.5 0 01-.708.708L6 6.707l-4.146 4.147a.5.5 0 01-.708-.708L5.293 6 1.146 1.854a.5.5 0 01.708-.708L6 5.293z" />
                  </svg>
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
              {filteredOptions.map(option => (
                <MobileOptionItem
                  key={String(option.value)}
                  option={option}
                  isSelected={isSelected(option.value)}
                  isMultiple={isMultiple}
                  keyword={deferredSearch}
                  onSingleSelect={onSingleSelect}
                  onMultiToggle={onMultiToggle}
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
