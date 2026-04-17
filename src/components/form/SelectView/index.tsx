// src/components/form/SelectView/index.tsx
//
// 组装层：trigger 输入框 + 移动端弹层 + PC 端下拉
// 状态由 useSelectState / usePickerPopup / useDeviceType 分别管理

import React, { useCallback, useEffect } from 'react';
import type { SelectViewProps, SelectValue } from './types';
import styles from './SelectView.module.less';
import { cx } from '@utils/utils';
import useDeviceType from '@components/form/_shared/useDeviceType';
import usePickerPopup from '@components/form/_shared/usePickerPopup';
import useSelectState from './useSelectState';
import SelectMobilePanel from './SelectMobilePanel';
import SelectPcDropdown from './SelectPcDropdown';

export const SelectView: React.FC<SelectViewProps> = ({
  options,
  value,
  defaultValue,
  onChange,
  placeholder = '请选择',
  mode = 'single',
  searchable = true,
  searchPlaceholder = '搜索',
  displayMode,
  prefix,
  status,
  allowClear = false,
  className,
}) => {
  const isMultiple = mode === 'multiple';

  // ── 设备类型（复用 _shared，displayMode prop 可强制覆盖） ─────────────────
  const isMobile = useDeviceType(displayMode);

  // ── 面板开/关状态（复用 _shared，含 ESC + 点击外部关闭） ─────────────────
  const {
    visible,
    isClosing,
    wrapperRef,
    handleOpen,
    handleClose,
    handleAnimationEnd,
    handleKeyDown,
  } = usePickerPopup({ isMobile });

  // ── 选中值 + 搜索 + 操作逻辑 ─────────────────────────────────────────────
  const {
    displayText,
    selectedValues,
    searchText,
    deferredSearch,
    isStale,
    filteredOptions,
    handleSearchChange,
    handleSearchClear,
    resetSearch,
    syncDraftToSelected,
    isSelected,
    handleSingleSelect,
    handleMultiToggle,
    handleMultiConfirm,
    handleClear,
  } = useSelectState({
    options,
    value,
    defaultValue,
    onChange,
    isMultiple,
    onClose: handleClose,
  });

  // 打开面板时：重置搜索 + 将当前选中值同步到草稿
  const handleTriggerOpen = useCallback(() => {
    resetSearch();
    syncDraftToSelected();
    handleOpen();
  }, [resetSearch, syncDraftToSelected, handleOpen]);

  // 关闭面板时：清空搜索
  const handleCloseWithReset = useCallback(() => {
    resetSearch();
    handleClose();
  }, [resetSearch, handleClose]);

  // 单选选中后 handleSingleSelect 内部会调用 onClose（已含关闭逻辑），
  // 但需要在关闭前额外重置搜索框，故包一层。
  // 注意：useSelectState 的 onClose 指向 handleClose（不含 resetSearch），
  // 所以这里给 mobile/pc 面板传的 onSingleSelect 是经过包装后的版本：
  const handleSingleSelectWrapped = useCallback((val: SelectValue) => {
    // handleSingleSelect 内部会调用 onClose（即 handleClose）
    // 关闭后搜索框由下方 useEffect 清理
    handleSingleSelect(val);
  }, [handleSingleSelect]);

  // 面板关闭时（visible 变 false）重置搜索框
  useEffect(() => {
    if (!visible) resetSearch();
  }, [visible, resetSearch]);

  // ── 渲染 ──────────────────────────────────────────────────────────────────
  const arrowOpen = !isMobile && (visible || isClosing);

  return (
    <div
      ref={wrapperRef}
      className={cx(styles['select-wrapper'], className)}
    >
      {/* 输入框触发区域 */}
      <div
        className={cx(
          styles['select-input'],
          status === 'error' && styles['select-input-error'],
          visible && styles['open-state'],
        )}
        onClick={handleTriggerOpen}
        onKeyDown={handleKeyDown}
        role="combobox"
        tabIndex={0}
        aria-expanded={visible}
        aria-haspopup="listbox"
      >
        {prefix && <div className={styles['select-input-prefix']}>{prefix}</div>}

        <span
          className={
            displayText
              ? styles['select-input-text']
              : styles['select-input-placeholder']
          }
        >
          {displayText || placeholder}
        </span>

        {/* 清除按钮 */}
        {allowClear && selectedValues.length > 0 && (
          <button
            type="button"
            className={styles['clear-btn']}
            onClick={handleClear}
            aria-label="清除选择"
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor" aria-hidden="true">
              <path d="M6 5.293L10.146 1.146a.5.5 0 01.708.708L6.707 6l4.147 4.146a.5.5 0 01-.708.708L6 6.707l-4.146 4.147a.5.5 0 01-.708-.708L5.293 6 1.146 1.854a.5.5 0 01.708-.708L6 5.293z" />
            </svg>
          </button>
        )}

        {/* 箭头 */}
        <svg
          className={cx(
            styles['select-input-arrow'],
            arrowOpen && styles['open'],
          )}
          width="12"
          height="12"
          viewBox="0 0 12 12"
          fill="currentColor"
          aria-hidden="true"
        >
          <path d="M6 8L2 4h8z" />
        </svg>
      </div>

      {isMobile ? (
        // ── 移动端：底部弹层（Portal 到 body） ────────────────────────────────
        <SelectMobilePanel
          visible={visible}
          isMultiple={isMultiple}
          filteredOptions={filteredOptions}
          searchText={searchText}
          deferredSearch={deferredSearch}
          isStale={isStale}
          searchable={searchable}
          searchPlaceholder={searchPlaceholder}
          isSelected={isSelected}
          onSingleSelect={handleSingleSelectWrapped}
          onMultiToggle={handleMultiToggle}
          onMultiConfirm={handleMultiConfirm}
          onClose={handleCloseWithReset}
          onSearchChange={handleSearchChange}
          onSearchClear={handleSearchClear}
        />
      ) : (
        // ── PC 端：绝对定位下拉面板 ────────────────────────────────────────────
        visible && (
          <SelectPcDropdown
            isClosing={isClosing}
            isMultiple={isMultiple}
            filteredOptions={filteredOptions}
            searchText={searchText}
            deferredSearch={deferredSearch}
            isStale={isStale}
            searchable={searchable}
            searchPlaceholder={searchPlaceholder}
            isSelected={isSelected}
            onSingleSelect={handleSingleSelectWrapped}
            onMultiToggle={handleMultiToggle}
            onMultiConfirm={handleMultiConfirm}
            onAnimationEnd={handleAnimationEnd}
            onSearchChange={handleSearchChange}
            onSearchClear={handleSearchClear}
          />
        )
      )}
    </div>
  );
};
