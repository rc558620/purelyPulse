// src/components/CascaderView/index.tsx
//
// 组装层：trigger 输入框 + 移动端面板 + PC 端下拉
// 状态由 useCascaderState / usePickerPopup / useDeviceType 分别管理

import React, { useCallback, useEffect, useRef } from 'react';
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
  inputStyle,
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
  } = usePickerPopup({ isMobile });

  // ── 用 ref 持有 resetLevel，打破 useCascaderState ↔ handleCloseWithReset 循环 ──
  // resetLevel 从 useCascaderState 里返回后赋值给 ref，
  // handleCloseWithReset / handleTriggerClick 通过 ref 调用，无需加入依赖数组。
  const resetLevelRef = useRef<() => void>(() => {});

  const handleCloseWithReset = useCallback(() => {
    resetLevelRef.current();
    handleClose();
  }, [handleClose]);

  const handleTriggerClick = useCallback(() => {
    resetLevelRef.current();
    handleOpen();
  }, [handleOpen]);

  // ── 选中值状态 + 选择逻辑 ─────────────────────────────────────────────────
  const {
    selectedValue,
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

  // 将最新的 resetLevel 同步到 ref（useEffect 在渲染后同步，避免渲染期间写 ref）
  useEffect(() => {
    resetLevelRef.current = resetLevel;
  });

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
        style={inputStyle}
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
            <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
              <path d="M6 5.293L10.146 1.146a.5.5 0 01.708.708L6.707 6l4.147 4.146a.5.5 0 01-.708.708L6 6.707l-4.146 4.147a.5.5 0 01-.708-.708L5.293 6 1.146 1.854a.5.5 0 01.708-.708L6 5.293z" />
            </svg>
          </button>
        )}

        <svg
          className={cx(
            styles['cascader-input-arrow'],
            arrowOpen && styles['cascader-input-arrow-open'],
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
        <CascaderMobilePanel
          visible={visible}
          currentLevel={currentLevel}
          currentLevelOptions={currentLevelOptions}
          selectedValue={selectedValue}
          onSelect={handleMobileSelect}
          onBack={handleMobileBack}
          onMaskClick={handleCloseWithReset}
        />
      ) : (
        // ── PC 端：绝对定位下拉多列 ───────────────────────────────────────────
        visible && (
          <CascaderPcDropdown
            isClosing={isClosing}
            allLevels={allLevels}
            selectedValue={selectedValue}
            onSelect={handlePcSelect}
            onAnimationEnd={handleAnimationEnd}
          />
        )
      )}
    </div>
  );
};
