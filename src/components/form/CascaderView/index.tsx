// src/components/CascaderView/index.tsx
//
// 组装层：trigger 输入框 + 移动端面板 + PC 端下拉
// 状态由 useCascaderState / usePickerPopup / useDeviceType 分别管理

import React, { useCallback, useRef } from 'react';
import { SmallCloseIcon, ChevronDownIcon } from '@components/form/_shared/icons';
import type { CascadePickerViewProps } from './types';
import styles from './CascaderView.module.less';
import { cx } from '@utils/utils';
import useDeviceType from '@components/form/_shared/useDeviceType';
import usePickerPopup from '@components/form/_shared/usePickerPopup';
import { useCascaderState } from './useCascaderState';
import CascaderMobilePanel from './CascaderMobilePanel';
import CascaderPcDropdown from './CascaderPcDropdown';

export const CascaderView: React.FC<CascadePickerViewProps> = ({
  options,
  value,
  defaultValue = [],
  onChange,
  placeholder = '请选择',
  mode,
  status,
  prefix,
  allowClear = false,
  className,
  onVisibleChange,
  visible: externalVisible,
}) => {
  // ── 设备类型（复用 _shared，mode prop 可强制覆盖） ────────────────────────
  const isMobile = useDeviceType(mode);

  // ── 面板开/关状态（复用 _shared，含 ESC + 点击外部关闭） ─────────────────
  const {
    visible,
    isClosing,
    wrapperRef,
    handleOpen,
    handleClose,
    handleAnimationEnd,
    handleKeyDown,
  } = usePickerPopup({ isMobile, externalVisible, onVisibleChange });

  // ── 用 ref 持有 resetLevel，打破 useCascaderState ↔ handleCloseWithReset 循环 ──
  // resetLevel 从 useCascaderState 里返回后赋值给 ref，
  // handleCloseWithReset / handleTriggerClick 通过 ref 调用，无需加入依赖数组。
  const resetLevelRef = useRef<() => void>(() => {});

  // Bug #7 fix: 用 ref 追踪 isClosing，避免 handleCloseWithReset 依赖 isClosing 状态
  // 导致回调重建，进而触发 useCascaderState 内所有依赖 onClose 的 useCallback 重建
  const isClosingRef = useRef(isClosing);
  isClosingRef.current = isClosing;

  const handleCloseWithReset = useCallback(() => {
    if (!isClosingRef.current) {
      resetLevelRef.current();
    }
    handleClose();
  }, [handleClose]);

  const handleTriggerClick = useCallback(() => {
    resetLevelRef.current();
    handleOpen();
  }, [handleOpen]);

  // ── 选中值状态 + 选择逻辑 ─────────────────────────────────────────────────
  const {
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
  } = useCascaderState({
    options,
    value,
    defaultValue,
    onChange,
    isMobile,
    onClose: handleCloseWithReset,
  });

  // Bug #8 fix: 直接在渲染阶段赋值 ref（无需 useEffect 包裹），
  // 避免缺少依赖数组导致每次渲染都执行 effect
  resetLevelRef.current = resetLevel;

  // ── 渲染 ──────────────────────────────────────────────────────────────────
  const arrowOpen = !isMobile && (visible || isClosing);

  return (
    <div
      ref={wrapperRef}
      className={cx(styles['cascader-wrapper'], className)}
    >
      {/* 输入框触发区域 */}
      <div
        className={cx(
          styles['cascader-input'],
          status === 'error' && styles['cascader-input-error'],
          arrowOpen && styles['cascader-input-open'],
        )}
        onClick={handleTriggerClick}
        onKeyDown={handleKeyDown}
        role="combobox"
        tabIndex={0}
        aria-expanded={visible}
        aria-haspopup="listbox"
      >
        {prefix && <div className={styles['cascader-input-prefix']}>{prefix}</div>}

        <span
          className={
            displayText
              ? styles['cascader-input-text']
              : styles['cascader-input-placeholder']
          }
        >
          {displayText || placeholder}
        </span>

        {allowClear && selectedValue.length > 0 && (
          <button
            type="button"
            className={styles['cascader-clear-btn']}
            onClick={handleClear}
            aria-label="清除选择"
          >
            <SmallCloseIcon />
          </button>
        )}

        <ChevronDownIcon
          className={cx(
            styles['cascader-input-arrow'],
            arrowOpen && styles['cascader-input-arrow-open'],
          )}
        />
      </div>

      {isMobile ? (
        // ── 移动端：底部弹层（Portal 到 body） ────────────────────────────────
        <CascaderMobilePanel
          visible={visible}
          isClosing={isClosing}
          currentLevel={currentLevel}
          currentLevelOptions={currentLevelOptions}
          selectedValue={internalValue}
          onSelect={handleMobileSelect}
          onBack={handleMobileBack}
          onMaskClick={handleCloseWithReset}
          onTransitionEnd={handleAnimationEnd}
        />
      ) : (
        // ── PC 端：绝对定位下拉多列 ───────────────────────────────────────────
        visible && (
          <CascaderPcDropdown
            isClosing={isClosing}
            allLevels={allLevels}
            selectedValue={internalValue}
            onSelect={handlePcSelect}
            onAnimationEnd={handleAnimationEnd}
          />
        )
      )}
    </div>
  );
};
