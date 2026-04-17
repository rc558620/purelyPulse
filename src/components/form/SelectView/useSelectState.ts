// useSelectState — SelectView 的选中值状态管理
//
// 职责：
//   - 受控 / 非受控统一（value 存在时走受控，否则用 internalValues）
//   - 多选：维护"草稿"（draftValues），点确定才提交
//   - 搜索：searchText / deferredSearch / filteredOptions
//   - 单选选中 / 多选切换 / 多选确定 / 清除

import { useState, useCallback, useDeferredValue, useMemo } from 'react';
import type { SelectValue, SelectOption, UseSelectStateOptions, UseSelectStateReturn } from './types';

// ────────────────────────────────────────────────────────────────────
// 辅助：将任意形式的 value 规范化为 SelectValue[]
// ────────────────────────────────────────────────────────────────────
export const normalizeValue = (val?: SelectValue | SelectValue[]): SelectValue[] => {
  if (val === undefined || val === null || val === '') return [];
  return Array.isArray(val)
    ? val.filter(v => v !== '' && v !== undefined && v !== null)
    : [val];
};

const useSelectState = ({
  options,
  value,
  defaultValue,
  onChange,
  isMultiple,
  onClose,
}: UseSelectStateOptions): UseSelectStateReturn => {
  // 非受控内部值
  const [internalValues, setInternalValues] = useState<SelectValue[]>(
    () => normalizeValue(defaultValue),
  );

  // 多选草稿（开弹窗时从 selectedValues 复制，关闭前不提交）
  const [draftValues, setDraftValues] = useState<SelectValue[]>([]);

  // 搜索关键词
  const [searchText, setSearchText] = useState('');

  // 受控 / 非受控统一
  const selectedValues = useMemo(
    () => (value !== undefined ? normalizeValue(value) : internalValues),
    [value, internalValues],
  );

  // 展示文本
  const displayText = useMemo((): string => {
    if (selectedValues.length === 0) return '';
    return selectedValues
      .map(v => options.find(o => o.value === v)?.label ?? String(v))
      .join('、');
  }, [selectedValues, options]);

  // useDeferredValue 使搜索输入优先响应，过滤计算低优先级执行
  const deferredSearch = useDeferredValue(searchText);
  const isStale = searchText !== deferredSearch;

  // 过滤选项
  const filteredOptions = useMemo((): SelectOption[] => {
    const keyword = deferredSearch.trim().toLowerCase();
    if (!keyword) return options;
    return options.filter(opt => opt.label.toLowerCase().includes(keyword));
  }, [deferredSearch, options]);

  // 判断选项是否选中（多选看草稿，单选看 selectedValues）
  const isSelected = useCallback(
    (val: SelectValue): boolean =>
      isMultiple ? draftValues.includes(val) : selectedValues.includes(val),
    [isMultiple, draftValues, selectedValues],
  );

  // 搜索
  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => setSearchText(e.target.value),
    [],
  );
  const handleSearchClear = useCallback(() => setSearchText(''), []);
  const resetSearch = useCallback(() => setSearchText(''), []);

  // 打开面板时将 selectedValues 同步到草稿
  const syncDraftToSelected = useCallback(() => {
    setDraftValues(selectedValues);
  }, [selectedValues]);

  // 单选：直接确认并关闭
  const handleSingleSelect = useCallback(
    (val: SelectValue) => {
      setInternalValues([val]);
      onChange?.(val);
      onClose();
    },
    [onChange, onClose],
  );

  // 多选：切换草稿
  const handleMultiToggle = useCallback((val: SelectValue) => {
    setDraftValues(prev =>
      prev.includes(val) ? prev.filter(v => v !== val) : [...prev, val],
    );
  }, []);

  // 多选确定：提交草稿
  const handleMultiConfirm = useCallback(() => {
    setInternalValues(draftValues);
    onChange?.(draftValues);
    onClose();
  }, [draftValues, onChange, onClose]);

  // 清除
  const handleClear = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      setInternalValues([]);
      onChange?.(isMultiple ? [] : ('' as SelectValue));
    },
    [isMultiple, onChange],
  );

  return {
    displayText,
    selectedValues,
    searchText,
    deferredSearch,
    isStale,
    filteredOptions,
    handleSearchChange,
    handleSearchClear,
    resetSearch,
    draftValues,
    syncDraftToSelected,
    isSelected,
    handleSingleSelect,
    handleMultiToggle,
    handleMultiConfirm,
    handleClear,
  };
};

export default useSelectState;
