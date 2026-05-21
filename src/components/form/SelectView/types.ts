import type React from 'react';

export type SelectValue = string | number;
export type SelectMode = 'single' | 'multiple';
export type SelectDisplayMode = 'mobile' | 'pc';
export type SelectChangeValue<M extends SelectMode = SelectMode> = M extends 'multiple'
  ? SelectValue[]
  : SelectValue;

export type SelectOption = {
  label: string;
  value: SelectValue;
  disabled?: boolean;
};

export interface SelectOptionRenderInfo {
  index: number;
  keyword: string;
  isSelected: boolean;
}

export type SelectOptionRender = (
  option: SelectOption,
  info: SelectOptionRenderInfo,
) => React.ReactNode;

interface SelectViewSharedProps {
  options: SelectOption[];
  placeholder?: string;
  searchable?: boolean;
  searchPlaceholder?: string;
  displayMode?: SelectDisplayMode;
  prefix?: React.ReactNode;
  status?: 'error' | undefined;
  allowClear?: boolean;
  className?: string;
  triggerClassName?: string;
  optionRender?: SelectOptionRender;
}

export interface SingleSelectViewProps extends SelectViewSharedProps {
  mode?: 'single';
  value?: SelectChangeValue<'single'>;
  defaultValue?: SelectChangeValue<'single'>;
  onChange?: (value: SelectChangeValue<'single'>) => void;
}

export interface MultipleSelectViewProps extends SelectViewSharedProps {
  mode: 'multiple';
  value?: SelectChangeValue<'multiple'>;
  defaultValue?: SelectChangeValue<'multiple'>;
  onChange?: (value: SelectChangeValue<'multiple'>) => void;
}

export type SelectViewProps = SingleSelectViewProps | MultipleSelectViewProps;

export interface UseSelectStateOptions<M extends SelectMode = SelectMode> {
  options: SelectOption[];
  value?: SelectChangeValue<M>;
  defaultValue?: SelectChangeValue<M>;
  onChange?: (value: SelectChangeValue<M>) => void;
  mode: M;
  onClose: () => void;
}

export interface UseSelectStateReturn {
  displayText: string;
  selectedValues: SelectValue[];
  searchText: string;
  deferredSearch: string;
  isStale: boolean;
  filteredOptions: SelectOption[];
  handleSearchChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleSearchClear: () => void;
  resetSearch: () => void;
  draftValues: SelectValue[];
  syncDraftToSelected: () => void;
  isSelected: (val: SelectValue) => boolean;
  handleSingleSelect: (val: SelectValue) => void;
  handleMultiToggle: (val: SelectValue) => void;
  handleMultiConfirm: () => void;
  handleClear: (e: React.MouseEvent) => void;
}

export interface SelectPanelSharedProps {
  isMultiple: boolean;
  filteredOptions: SelectOption[];
  searchText: string;
  deferredSearch: string;
  isStale: boolean;
  searchable: boolean;
  searchPlaceholder: string;
  isSelected: (val: SelectValue) => boolean;
  onSingleSelect: (val: SelectValue) => void;
  onMultiToggle: (val: SelectValue) => void;
  onMultiConfirm: () => void;
  onSearchChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSearchClear: () => void;
  optionRender?: SelectOptionRender;
}

export interface SelectOptionRowProps {
  option: SelectOption;
  index: number;
  isSelected: boolean;
  isMultiple: boolean;
  keyword: string;
  onSingleSelect: (val: SelectValue) => void;
  onMultiToggle: (val: SelectValue) => void;
  optionRender?: SelectOptionRender;
}

export interface SelectMobilePanelProps extends SelectPanelSharedProps {
  visible: boolean;
  onClose: () => void;
}

export interface SelectPcDropdownProps extends SelectPanelSharedProps {
  isClosing: boolean;
  onAnimationEnd: () => void;
}
