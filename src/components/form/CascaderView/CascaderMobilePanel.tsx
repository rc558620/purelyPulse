// CascaderMobilePanel — 移动端级联底部弹层
//
// 通过 createPortal 挂到 body，规避父容器 overflow:hidden 裁剪。
// 自身只负责 UI 渲染，状态由父组件（CascaderView）通过 props 注入。

import React, { memo } from 'react';
import { createPortal } from 'react-dom';
import type { CascadeOption, CascadeValue } from './types';
import styles from './CascaderView.module.less';
import { cx } from '@utils/utils';
import { ChevronRightIcon } from '@components/form/_shared/icons';

// ─── 移动端单个选项条目 ───────────────────────────────────────────────────────

interface MobileItemProps {
  option: CascadeOption;
  isSelected: boolean;
  onSelect: (val: CascadeValue) => void;
}

const MobileCascaderItem = memo(({ option, isSelected, onSelect }: MobileItemProps) => (
  <div
    className={cx(
      styles['cascader-item'],
      option.disabled && styles['disabled'],
      isSelected && styles['selected'],
    )}
    onClick={() => !option.disabled && onSelect(option.value)}
  >
    <span>{option.label}</span>
    {!!option.children?.length && (
      <ChevronRightIcon className={styles['cascader-item-arrow']} />
    )}
  </div>
));
MobileCascaderItem.displayName = 'MobileCascaderItem';

// ─── 弹层面板 ─────────────────────────────────────────────────────────────────

export interface CascaderMobilePanelProps {
  visible: boolean;
  currentLevel: number;
  currentLevelOptions: CascadeOption[];
  selectedValue: CascadeValue[];
  onSelect: (val: CascadeValue) => void;
  onBack: () => void;
  onMaskClick: () => void;
}

const CascaderMobilePanel: React.FC<CascaderMobilePanelProps> = ({
  visible,
  currentLevel,
  currentLevelOptions,
  selectedValue,
  onSelect,
  onBack,
  onMaskClick,
}) => (
  <>
    {/* 遮罩：仅在 visible 时渲染 */}
    {visible &&
      createPortal(
        <div className={styles['cascader-mask']} onClick={onMaskClick} />,
        document.body,
      )}

    {/* 弹层：常驻 DOM，通过 transform 控制显隐（保证动画流畅） */}
    {createPortal(
      <div
        className={cx(
          styles['cascade-picker-view'],
          visible && styles['visible'],
        )}
      >
        <div className={styles['picker-header']}>
          <button
            type="button"
            className={styles['picker-back-btn']}
            onClick={onBack}
          >
            {currentLevel > 0 ? '返回' : '取消'}
          </button>
          <div className={styles['picker-title']}>
            {currentLevel === 0 ? '请选择' : '下一级'}
          </div>
          <div className={styles['picker-header-right']} />
        </div>

        <div className={styles['picker-container']}>
          <div className={styles['cascader-items']}>
            {currentLevelOptions.map(option => (
              <MobileCascaderItem
                key={String(option.value)}
                option={option}
                isSelected={selectedValue[currentLevel] === option.value}
                onSelect={onSelect}
              />
            ))}
          </div>
        </div>
      </div>,
      document.body,
    )}
  </>
);

export default memo(CascaderMobilePanel);
