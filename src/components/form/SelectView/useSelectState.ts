import { useState, useCallback, useDeferredValue, useMemo } from 'react';
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
    : (nextValues[0] ?? '')
) as SelectChangeValue<M>;

const useSelectState = <M extends SelectMode>({
  options,
  value,
  defaultValue,
  onChange,
  mode,
  onClose,
}: UseSelectStateOptions<M>): UseSelectStateReturn => {
  const isMultiple = mode === 'multiple';
  const isControlled = value !== undefined;

  const [internalValues, setInternalValues] = useState<SelectValue[]>(
    () => normalizeValue(defaultValue),
  );
  const [draftValues, setDraftValues] = useState<SelectValue[]>([]);
  const [searchText, setSearchText] = useState('');

  const selectedValues = useMemo(
    () => (isControlled ? normalizeValue(value) : internalValues),
    [internalValues, isControlled, value],
  );

  const displayText = useMemo((): string => {
    if (selectedValues.length === 0) return '';
    return selectedValues
      .map(currentValue => options.find(option => option.value === currentValue)?.label ?? String(currentValue))
      .join('、');
  }, [options, selectedValues]);

  const deferredSearch = useDeferredValue(searchText);
  const isStale = searchText !== deferredSearch;

  const filteredOptions = useMemo((): SelectOption[] => {
    const keyword = deferredSearch.trim().toLowerCase();
    if (!keyword) return options;
    return options.filter(option => option.label.toLowerCase().includes(keyword));
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

  const handleSearchClear = useCallback(() => setSearchText(''), []);
  const resetSearch = useCallback(() => setSearchText(''), []);

  const syncDraftToSelected = useCallback(() => {
    setDraftValues([...selectedValues]);
  }, [selectedValues]);

  const commitValue = useCallback((nextValues: SelectValue[], closeAfterCommit = false) => {
    if (!isControlled) {
      setInternalValues(nextValues);
    }
    onChange?.(toChangeValue(nextValues, mode));
    if (closeAfterCommit) {
      onClose();
    }
  }, [isControlled, mode, onChange, onClose]);

  const handleSingleSelect = useCallback((nextValue: SelectValue) => {
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
    commitValue(draftValues, true);
  }, [commitValue, draftValues]);

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
