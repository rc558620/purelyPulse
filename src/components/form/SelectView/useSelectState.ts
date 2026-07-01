import { useState, useCallback, useDeferredValue, useMemo, useRef } from 'react';
import type {
  SelectChangeValue,
  SelectMode,
  SelectOption,
  SelectValue,
  UseSelectStateOptions,
  UseSelectStateReturn,
} from './types';

type SelectLooseValue = SelectValue | '' | null | undefined;

export const normalizeValue = <M extends SelectMode>(
  val?: SelectChangeValue<M> | SelectLooseValue | SelectLooseValue[],
): SelectValue[] => {
  if (val === undefined || val === null || val === '') return [];
  return Array.isArray(val)
    ? (val.filter((v): v is SelectValue => v !== '' && v !== undefined && v !== null) as SelectValue[])
    : [val as SelectValue];
};

const toChangeValue = <M extends SelectMode>(
  nextValues: SelectValue[],
  mode: M,
): SelectChangeValue<M> => (
  mode === 'multiple'
    ? nextValues
    : nextValues[0]
) as SelectChangeValue<M>;

const useSelectState = <M extends SelectMode>({
  options,
  value,
  defaultValue,
  onChange,
  mode,
  isControlled: controlled,
  onClose,
}: UseSelectStateOptions<M>): UseSelectStateReturn => {
  const isMultiple = mode === 'multiple';
  const isControlled = controlled ?? value !== undefined;

  const [internalValues, setInternalValues] = useState<SelectValue[]>(
    () => normalizeValue(defaultValue),
  );
  const [draftValues, setDraftValues] = useState<SelectValue[]>(() =>
    normalizeValue(isControlled ? value : defaultValue),
  );
  const [searchText, setSearchText] = useState('');

  const selectedValues = useMemo(
    () => (isControlled ? normalizeValue(value) : internalValues),
    [internalValues, isControlled, value],
  );

  // Bug #2 fix: 用 ref 跟踪最新 selectedValues，确保 syncDraftToSelected 不依赖闭包中的旧值
  const selectedValuesRef = useRef(selectedValues);
  selectedValuesRef.current = selectedValues;

  // BUG-1 fix: 用 ref 跟踪最新 draftValues，确保 handleMultiConfirm 不依赖闭包中的旧值
  const draftValuesRef = useRef(draftValues);
  draftValuesRef.current = draftValues;

  // BUG-7 fix: 多选超过 3 项时显示摘要格式，避免文本溢出
  const displayText = useMemo((): string => {
    if (selectedValues.length === 0) return '';
    if (isMultiple && selectedValues.length > 3) {
      const firstLabel = options.find(o => o.value === selectedValues[0])?.label ?? String(selectedValues[0]);
      return `${firstLabel} 等 ${selectedValues.length} 项`;
    }
    return selectedValues
      .map(currentValue => options.find(option => option.value === currentValue)?.label ?? String(currentValue))
      .join('、');
  }, [isMultiple, options, selectedValues]);

  const deferredSearch = useDeferredValue(searchText);
  const isStale = searchText !== deferredSearch;

  // BUG-5 fix: 搜索时排除 disabled 选项
  const filteredOptions = useMemo((): SelectOption[] => {
    const keyword = deferredSearch.trim().toLowerCase();
    const source = keyword
      ? options.filter(option => !option.disabled && option.label.toLowerCase().includes(keyword))
      : options;
    return source;
  }, [deferredSearch, options]);

  const isSelected = useCallback(
    (nextValue: SelectValue): boolean => (
      isMultiple ? draftValues.includes(nextValue) : selectedValues.includes(nextValue)
    ),
    [draftValues, isMultiple, selectedValues],
  );

  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => setSearchText(e.target.value),
    [],
  );

  const clearSearch = useCallback(() => setSearchText(''), []);

  const syncDraftToSelected = useCallback(() => {
    setDraftValues([...selectedValuesRef.current]);
  }, []);

  // Bug #3 fix: 关闭面板时重置草稿为当前 selectedValues，防止残留未确认的选择
  const resetDraft = useCallback(() => {
    setDraftValues([...selectedValuesRef.current]);
  }, []);

  const commitValue = useCallback((nextValues: SelectValue[], closeAfterCommit = false) => {
    if (!isControlled) {
      setInternalValues(nextValues);
    }
    onChange?.(toChangeValue(nextValues, mode));
    if (closeAfterCommit) {
      onClose();
    }
  }, [isControlled, mode, onChange, onClose]);

  // BUG-8 fix: 单选重复选择同一项时跳过，避免冗余 onChange
  const handleSingleSelect = useCallback((nextValue: SelectValue) => {
    if (nextValue === selectedValuesRef.current[0]) return;
    commitValue([nextValue], true);
  }, [commitValue]);

  const handleMultiToggle = useCallback((nextValue: SelectValue) => {
    setDraftValues(prevValues => (
      prevValues.includes(nextValue)
        ? prevValues.filter(valueItem => valueItem !== nextValue)
        : [...prevValues, nextValue]
    ));
  }, []);

  const handleMultiConfirm = useCallback(() => {
    commitValue(draftValuesRef.current, true);
  }, [commitValue]);

  const handleClear = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    commitValue([]);
  }, [commitValue]);

  return {
    displayText,
    selectedValues,
    searchText,
    deferredSearch,
    isStale,
    filteredOptions,
    handleSearchChange,
    handleSearchClear: clearSearch,
    draftValues,
    syncDraftToSelected,
    resetDraft,
    isSelected,
    handleSingleSelect,
    handleMultiToggle,
    handleMultiConfirm,
    handleClear,
  };
};

export default useSelectState;
