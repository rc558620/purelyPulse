// useCascaderState — CascaderView 核心状态管理 hook
//
// 职责：
//   - 受控 / 非受控选中值管理（internalValue 同时充当面板内的临时 draft）
//   - 派生数据：displayText、currentLevelOptions（移动端）、allLevels（PC 端）
//   - 移动端：handleMobileSelect / handleMobileBack / currentLevel
//   - PC 端：handlePcSelect
//   - 清除：handleClear

import { useState, useEffect, useCallback, useMemo } from 'react';
import type { CascadeOption, CascadeValue } from './types';

// ─── 纯工具函数 ───────────────────────────────────────────────────────────────

/** 按 value 路径收集各级 label，用于 trigger 展示文本 */
const isSameValuePath = (left: CascadeValue[], right: CascadeValue[]): boolean => (
  left.length === right.length && left.every((item, index) => item === right[index])
);

const findOptionByValuePath = (
  options: CascadeOption[],
  values: CascadeValue[],
): CascadeOption | undefined => (
  options.find(option => option.valuePath && isSameValuePath(option.valuePath, values))
);

const findOptionAtLevel = (
  options: CascadeOption[],
  values: CascadeValue[],
  level: number,
): CascadeOption | undefined => (
  options.find(option => option.value === values[level])
  ?? findOptionByValuePath(options, values)
);

export const isOptionSelected = (
  option: CascadeOption,
  values: CascadeValue[],
  level: number,
): boolean => (
  option.value === values[level]
  || Boolean(option.valuePath && isSameValuePath(option.valuePath, values))
);

export function resolveLabels(options: CascadeOption[], values: CascadeValue[]): string[] {
  const labels: string[] = [];
  let current = options;
  for (let level = 0; level < values.length; level += 1) {
    const found = findOptionAtLevel(current, values, level);
    if (!found) break;
    labels.push(found.label);
    if (found.valuePath) break;
    if (!found.children?.length) break;
    current = found.children;
  }
  return labels;
}

/** 按 value 路径展开各级 options 列表（PC 端多列） */
export function resolveAllLevels(options: CascadeOption[], values: CascadeValue[]): CascadeOption[][] {
  const levels: CascadeOption[][] = [options];
  let current = options;
  for (let level = 0; level < values.length; level += 1) {
    const found = findOptionAtLevel(current, values, level);
    if (!found?.children?.length) break;
    levels.push(found.children);
    if (found.valuePath) break;
    current = found.children;
  }
  return levels;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export interface UseCascaderStateOptions {
  options: CascadeOption[];
  value?: CascadeValue[];
  defaultValue?: CascadeValue[];
  onChange?: (value: CascadeValue[]) => void;
  isMobile: boolean;
  /** 面板关闭回调（叶节点选中后通知外部关闭面板） */
  onClose: () => void;
}

export interface UseCascaderStateReturn {
  // ── 值 ──────────────────────────────────────────────────────────────────────
  /** 最终展示值（受控时 = value，否则 = internalValue） */
  selectedValue: CascadeValue[];
  /** 面板内的临时 draft（PC/移动端选中时立即更新，提交前不暴露给外部） */
  internalValue: CascadeValue[];
  // ── 展示文本 ─────────────────────────────────────────────────────────────────
  displayText: string;
  // ── 移动端专用 ───────────────────────────────────────────────────────────────
  currentLevel: number;
  currentLevelOptions: CascadeOption[];
  handleMobileSelect: (val: CascadeValue) => void;
  handleMobileBack: () => void;
  // ── PC 端专用 ────────────────────────────────────────────────────────────────
  allLevels: CascadeOption[][];
  handlePcSelect: (val: CascadeValue, level: number) => void;
  // ── 通用 ─────────────────────────────────────────────────────────────────────
  handleClear: (e: React.MouseEvent) => void;
  /** 打开面板时重置 currentLevel */
  resetLevel: () => void;
}

export function useCascaderState({
  options,
  value,
  defaultValue = [],
  onChange,
  isMobile,
  onClose,
}: UseCascaderStateOptions): UseCascaderStateReturn {
  const isControlled = value !== undefined;

  // internalValue 双重用途：
  //   1. 非受控模式下作为最终值
  //   2. 受控模式下作为面板内的临时 draft（保证 allLevels / currentLevelOptions 实时更新）
  const [internalValue, setInternalValue] = useState<CascadeValue[]>(
    () => value ?? defaultValue,
  );
  const selectedValue: CascadeValue[] = isControlled ? value! : internalValue;

  // 受控模式：外部 value 变化时同步 draft（防止面板重新打开时残留旧 draft）
  useEffect(() => {
    if (isControlled) setInternalValue(value!);
  }, [isControlled, value]);

  // ── 移动端：当前展示层级 ──────────────────────────────────────────────────────
  const [currentLevel, setCurrentLevel] = useState(0);

  /**
   * 重置层级到 0，同时将 internalValue draft 同步为当前 selectedValue。
   * 每次打开面板时调用，确保面板从第一层开始展示且 draft 与展示值一致。
   */
  const resetLevel = useCallback(() => {
    setCurrentLevel(0);
    // 重置 draft 为当前已提交值（避免上次未完成选择的脏数据残留）
    // 非受控模式下使用 selectedValue（= internalValue 已提交的值），
    // 而非 internalValue（可能包含面板中未提交的临时 draft）
    setInternalValue(selectedValue);
  }, [selectedValue]);

  // ── 派生数据 ──────────────────────────────────────────────────────────────────

  const displayText = useMemo(
    () => resolveLabels(options, selectedValue).join(' / '),
    [options, selectedValue],
  );

  /**
   * 移动端：当前层级的可选项列表。
   * 依赖 internalValue（面板内 draft），与 PC 端 allLevels 保持一致。
   * 受控模式下 selectedValue = 外部 value，不随面板内点击实时更新，
   * 必须用 internalValue 才能正确展示下一层级的子选项。
   */
  const currentLevelOptions = useMemo((): CascadeOption[] => {
    if (currentLevel === 0) return options;
    let current = options;
    for (let i = 0; i < currentLevel; i++) {
      // 使用 findOptionAtLevel（含 valuePath fallback）而非简单的 value 匹配，
      // 以支持折叠显示项（valuePath）场景下正确查找子选项
      const found = findOptionAtLevel(current, internalValue, i);
      if (!found?.children) return [];
      current = found.children;
    }
    return current;
  }, [options, currentLevel, internalValue]);

  /**
   * PC 端：所有展开列的 options 列表。
   * 依赖 internalValue（面板内 draft），受控模式下 selectedValue = 外部 value，
   * 不随面板内点击变化，必须用 internalValue 才能实时展开下一列。
   */
  const allLevels = useMemo(
    () => (isMobile ? [] : resolveAllLevels(options, internalValue)),
    [isMobile, options, internalValue],
  );

  // ── 移动端选择 ────────────────────────────────────────────────────────────────

  const handleMobileSelect = useCallback(
    (val: CascadeValue) => {
      // 基于 internalValue 构建新路径（与 PC 端 handlePcSelect 保持一致）
      const newValue = [...internalValue.slice(0, currentLevel), val];
      const selectedOption = currentLevelOptions.find(o => o.value === val);
      const hasChildren = !!selectedOption?.children?.length;
      const selectedPath = selectedOption?.valuePath ?? newValue;

      if (hasChildren) {
        setInternalValue(newValue);
        setCurrentLevel(l => l + 1);
      } else {
        if (!isControlled) setInternalValue(selectedPath);
        onChange?.(selectedPath);
        onClose();
      }
    },
    [internalValue, currentLevel, currentLevelOptions, isControlled, onChange, onClose],
  );

  const handleMobileBack = useCallback(() => {
    if (currentLevel > 0) {
      // 回退时同步截断 internalValue 到当前层级，避免残留更深层级的脏数据
      setInternalValue(prev => prev.slice(0, currentLevel - 1));
      setCurrentLevel(l => l - 1);
    } else {
      onClose();
    }
  }, [currentLevel, onClose]);

  // ── PC 端选择 ─────────────────────────────────────────────────────────────────

  const handlePcSelect = useCallback(
    (val: CascadeValue, level: number) => {
      const newValue = [...internalValue.slice(0, level), val];
      const levelOptions = allLevels[level];
      const selectedOption = levelOptions?.find(o => o.value === val);
      const hasChildren = !!selectedOption?.children?.length;
      const selectedPath = selectedOption?.valuePath ?? newValue;

      // 中间节点（有子节点）使用 newValue 以保证子级列表能正确展开；
      // 叶节点使用 selectedPath（可能含 valuePath 折叠路径）以提交完整值
      setInternalValue(hasChildren ? newValue : selectedPath);

      if (!hasChildren) {
        onChange?.(selectedPath);
        onClose();
      }
    },
    [internalValue, allLevels, onChange, onClose],
  );

  // ── 清除 ──────────────────────────────────────────────────────────────────────

  const handleClear = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      if (!isControlled) setInternalValue([]);
      onChange?.([]);
      onClose();
    },
    [isControlled, onChange, onClose],
  );

  return {
    selectedValue,
    internalValue,
    displayText,
    currentLevel,
    currentLevelOptions,
    handleMobileSelect,
    handleMobileBack,
    allLevels,
    handlePcSelect,
    handleClear,
    resetLevel,
  };
}
