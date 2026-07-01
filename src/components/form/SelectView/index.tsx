import React, { useCallback, useEffect, useMemo } from 'react';
import { SmallCloseIcon, ChevronDownIcon } from '@components/form/_shared/icons';
import useDeviceType from '@components/form/_shared/useDeviceType';
import usePickerPopup from '@components/form/_shared/usePickerPopup';
import { cx } from '@utils/utils';
import SelectMobilePanel from './SelectMobilePanel';
import SelectPcDropdown from './SelectPcDropdown';
import styles from './SelectView.module.less';
import type {
  MultipleSelectViewProps,
  SelectMode,
  SelectOptionRender,
  SelectPanelSharedProps,
  SelectValue,
  SelectViewProps,
  SingleSelectViewProps,
  UseSelectStateOptions,
} from './types';
import useSelectState from './useSelectState';

interface UseSelectPanelPropsOptions {
  isMultiple: boolean;
  searchable: boolean;
  searchPlaceholder: string;
  searchText: string;
  deferredSearch: string;
  isStale: boolean;
  filteredOptions: SelectPanelSharedProps['filteredOptions'];
  isSelected: (val: SelectValue) => boolean;
  handleSearchClear: () => void;
  syncDraftToSelected: () => void;
  handleOpen: () => void;
  handleSingleSelect: (val: SelectValue) => void;
  handleMultiToggle: (val: SelectValue) => void;
  handleMultiConfirm: () => void;
  handleSearchChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  optionRender?: SelectOptionRender;
}

interface UseSelectPanelPropsReturn {
  panelSharedProps: SelectPanelSharedProps;
  handleTriggerOpen: () => void;
}

const useSelectPanelProps = ({
  isMultiple,
  searchable,
  searchPlaceholder,
  searchText,
  deferredSearch,
  isStale,
  filteredOptions,
  isSelected,
  handleSearchClear,
  syncDraftToSelected,
  handleOpen,
  handleSingleSelect,
  handleMultiToggle,
  handleMultiConfirm,
  handleSearchChange,
  optionRender,
}: UseSelectPanelPropsOptions): UseSelectPanelPropsReturn => {
  const handleTriggerOpen = useCallback(() => {
    handleSearchClear();
    syncDraftToSelected();
    handleOpen();
  }, [handleOpen, handleSearchClear, syncDraftToSelected]);

  const panelSharedProps = useMemo<SelectPanelSharedProps>(() => ({
    isMultiple,
    filteredOptions,
    searchText,
    deferredSearch,
    isStale,
    searchable,
    searchPlaceholder,
    isSelected,
    onSingleSelect: handleSingleSelect,
    onMultiToggle: handleMultiToggle,
    onMultiConfirm: handleMultiConfirm,
    onSearchChange: handleSearchChange,
    onSearchClear: handleSearchClear,
    optionRender,
  }), [
    deferredSearch,
    filteredOptions,
    handleMultiConfirm,
    handleMultiToggle,
    handleSearchChange,
    handleSearchClear,
    handleSingleSelect,
    isMultiple,
    isSelected,
    isStale,
    optionRender,
    searchPlaceholder,
    searchText,
    searchable,
  ]);

  return {
    panelSharedProps,
    handleTriggerOpen,
  };
};

export function SelectView(props: SingleSelectViewProps): React.JSX.Element;
export function SelectView(props: MultipleSelectViewProps): React.JSX.Element;
export function SelectView(props: SelectViewProps): React.JSX.Element {
  const {
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
    triggerClassName,
    optionRender,
  } = props;
  const isMultiple = mode === 'multiple';
  const isMobile = useDeviceType(displayMode);
  const isControlled = Object.prototype.hasOwnProperty.call(props, 'value');

  // 先调用 usePickerPopup 获取 handleClose（不传 onBeforeClose）
  const {
    visible,
    isClosing,
    wrapperRef,
    handleOpen,
    handleClose,
    handleAnimationEnd,
    handleKeyDown,
  } = usePickerPopup({ isMobile });

  const stateOptions = useMemo((): UseSelectStateOptions<SelectMode> => ({
    options,
    value,
    defaultValue,
    onChange: onChange as UseSelectStateOptions<SelectMode>['onChange'],
    mode,
    isControlled,
    onClose: handleClose,
  }), [defaultValue, handleClose, isControlled, mode, onChange, options, value]);

  const {
    displayText,
    selectedValues,
    searchText,
    deferredSearch,
    isStale,
    filteredOptions,
    handleSearchChange,
    handleSearchClear,
    syncDraftToSelected,
    resetDraft,
    isSelected,
    handleSingleSelect,
    handleMultiToggle,
    handleMultiConfirm,
    handleClear,
  } = useSelectState<SelectMode>(stateOptions);

  const { panelSharedProps, handleTriggerOpen } = useSelectPanelProps({
    isMultiple,
    searchable,
    searchPlaceholder,
    searchText,
    deferredSearch,
    isStale,
    filteredOptions,
    isSelected,
    handleSearchClear,
    syncDraftToSelected,
    handleOpen,
    handleSingleSelect,
    handleMultiToggle,
    handleMultiConfirm,
    handleSearchChange,
    optionRender,
  });

  // BUG-2 & BUG-3 fix: 面板关闭后（visible 变为 false）统一清理搜索和草稿
  // 无论关闭路径（遮罩/ESC/点击外部/取消按钮），visible 最终都会变为 false
  useEffect(() => {
    if (!visible) {
      handleSearchClear();
      resetDraft();
    }
  }, [visible, handleSearchClear, resetDraft]);

  const arrowOpen = !isMobile && (visible || isClosing);

  return (
    <div ref={wrapperRef} className={cx(styles['select-wrapper'], className)}>
      <div
        className={cx(
          styles['select-input'],
          status === 'error' && styles['select-input-error'],
          visible && styles['open-state'],
          triggerClassName,
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

        {/* BUG-4 fix: 面板打开时隐藏清除按钮，防止点击穿透到 trigger */}
        {allowClear && !visible && selectedValues.length > 0 && (
          <button
            type="button"
            className={styles['clear-btn']}
            onClick={handleClear}
            aria-label="清除选择"
          >
            <SmallCloseIcon />
          </button>
        )}

        <ChevronDownIcon
          className={cx(
            styles['select-input-arrow'],
            arrowOpen && styles.open,
          )}
        />
      </div>

      {isMobile ? (
        <SelectMobilePanel
          visible={visible}
          isClosing={isClosing}
          onClose={handleClose}
          onTransitionEnd={handleAnimationEnd}
          {...panelSharedProps}
        />
      ) : (
        visible && (
          <SelectPcDropdown
            isClosing={isClosing}
            onAnimationEnd={handleAnimationEnd}
            {...panelSharedProps}
          />
        )
      )}
    </div>
  );
}
