// src/components/form/SelectView/types.ts

import type React from 'react';

export type SelectValue = string | number;

export type SelectOption = {
  label: string;
  value: SelectValue;
  disabled?: boolean;
};

export interface SelectViewProps {
  /** 选项列表 */
  options: SelectOption[];
  /** 受控值 */
  value?: SelectValue | SelectValue[];
  /** 默认值（非受控） */
  defaultValue?: SelectValue | SelectValue[];
  /** 值变化回调 */
  onChange?: (value: SelectValue | SelectValue[]) => void;
  /** 占位文本，默认"请选择" */
  placeholder?: string;
  /** 选择模式：单选或多选，默认 'single' */
  mode?: 'single' | 'multiple';
  /** 是否显示搜索框，默认 true */
  searchable?: boolean;
  /** 搜索框占位文本，默认"搜索" */
  searchPlaceholder?: string;
  /**
   * 强制指定显示模式（不传则自动检测窗口宽度）
   * - `'mobile'`：底部弹出面板
   * - `'pc'`：下拉面板
   */
  displayMode?: 'mobile' | 'pc';
  /** 输入框前缀内容（如图标） */
  prefix?: React.ReactNode;
  /** 输入状态，`'error'` 时显示红框 */
  status?: 'error' | undefined;
  /** 是否显示清除按钮，默认 false */
  allowClear?: boolean;
  /** 自定义类名 */
  className?: string;
}

// ─── useSelectState ───────────────────────────────────────────────────────────

export interface UseSelectStateOptions {
  options: SelectOption[];
  value?: SelectValue | SelectValue[];
  defaultValue?: SelectValue | SelectValue[];
  onChange?: (value: SelectValue | SelectValue[]) => void;
  isMultiple: boolean;
  onClose: () => void;
}

export interface UseSelectStateReturn {
  // 展示相关
  displayText: string;
  selectedValues: SelectValue[];

  // 搜索相关
  searchText: string;
  deferredSearch: string;
  isStale: boolean;
  filteredOptions: SelectOption[];
  handleSearchChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleSearchClear: () => void;
  resetSearch: () => void;

  // 草稿（多选）
  draftValues: SelectValue[];
  syncDraftToSelected: () => void;

  // 操作
  isSelected: (val: SelectValue) => boolean;
  handleSingleSelect: (val: SelectValue) => void;
  handleMultiToggle: (val: SelectValue) => void;
  handleMultiConfirm: () => void;
  handleClear: (e: React.MouseEvent) => void;
}

// ─── SelectMobilePanel ────────────────────────────────────────────────────────

export interface SelectMobilePanelProps {
  visible: boolean;
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
  onClose: () => void;
  onSearchChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSearchClear: () => void;
}

// ─── SelectPcDropdown ─────────────────────────────────────────────────────────

export interface SelectPcDropdownProps {
  isClosing: boolean;
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
  onAnimationEnd: () => void;
  onSearchChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSearchClear: () => void;
}
