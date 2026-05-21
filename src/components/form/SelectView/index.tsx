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
  visible: boolean;
  isMultiple: boolean;
  searchable: boolean;
  searchPlaceholder: string;
  searchText: string;
  deferredSearch: string;
  isStale: boolean;
  filteredOptions: SelectPanelSharedProps['filteredOptions'];
  isSelected: (val: SelectValue) => boolean;
  resetSearch: () => void;
  syncDraftToSelected: () => void;
  handleOpen: () => void;
  handleClose: () => void;
  handleSingleSelect: (val: SelectValue) => void;
  handleMultiToggle: (val: SelectValue) => void;
  handleMultiConfirm: () => void;
  handleSearchChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleSearchClear: () => void;
  optionRender?: SelectOptionRender;
}

interface UseSelectPanelPropsReturn {
  panelSharedProps: SelectPanelSharedProps;
  handleTriggerOpen: () => void;
  handleCloseWithReset: () => void;
}

const useSelectPanelProps = ({
  visible,
  isMultiple,
  searchable,
  searchPlaceholder,
  searchText,
  deferredSearch,
  isStale,
  filteredOptions,
  isSelected,
  resetSearch,
  syncDraftToSelected,
  handleOpen,
  handleClose,
  handleSingleSelect,
  handleMultiToggle,
  handleMultiConfirm,
  handleSearchChange,
  handleSearchClear,
  optionRender,
}: UseSelectPanelPropsOptions): UseSelectPanelPropsReturn => {
  const handleTriggerOpen = useCallback(() => {
    resetSearch();
    syncDraftToSelected();
    handleOpen();
  }, [handleOpen, resetSearch, syncDraftToSelected]);

  const handleCloseWithReset = useCallback(() => {
    resetSearch();
    handleClose();
  }, [handleClose, resetSearch]);

  useEffect(() => {
    if (!visible) {
      resetSearch();
    }
  }, [resetSearch, visible]);

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
    handleCloseWithReset,
  };
};

export function SelectView(props: SingleSelectViewProps): React.JSX.Element;
export function SelectView(props: MultipleSelectViewProps): React.JSX.Element;
export function SelectView({
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
}: SelectViewProps): React.JSX.Element {
  const isMultiple = mode === 'multiple';
  const isMobile = useDeviceType(displayMode);

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
    onClose: handleClose,
  }), [defaultValue, handleClose, mode, onChange, options, value]);

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
  } = useSelectState<SelectMode>(stateOptions);

  const { panelSharedProps, handleTriggerOpen, handleCloseWithReset } = useSelectPanelProps({
    visible,
    isMultiple,
    searchable,
    searchPlaceholder,
    searchText,
    deferredSearch,
    isStale,
    filteredOptions,
    isSelected,
    resetSearch,
    syncDraftToSelected,
    handleOpen,
    handleClose,
    handleSingleSelect,
    handleMultiToggle,
    handleMultiConfirm,
    handleSearchChange,
    handleSearchClear,
    optionRender,
  });

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

        {allowClear && selectedValues.length > 0 && (
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
          onClose={handleCloseWithReset}
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
