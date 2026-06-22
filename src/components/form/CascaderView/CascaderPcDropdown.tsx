// CascaderPcDropdown — PC 端级联下拉多列面板
//
// 通过 createPortal 挂到 body，规避父容器 overflow:hidden 的定位干扰。
// 坐标通过 CSS 自定义属性（--cdp-top / --cdp-left）注入，面板通过 var() 消费。
// 自身只负责 UI 渲染，状态由父组件（CascaderView）通过 props 注入。

import React, { memo } from 'react';
import { createPortal } from 'react-dom';
import { safeNum } from '@utils/utils';
import type { CascadeOption, CascadeValue } from './types';
import styles from './CascaderView.module.less';
import { cx } from '@utils/utils';
import { ChevronRightIcon } from '@components/form/_shared/icons';
import { isOptionSelected } from './useCascaderState';

// ─── PC 端单列选项条目 ────────────────────────────────────────────────────────

interface PcMenuItemProps {
  option: CascadeOption;
  isActive: boolean;
  onSelect: (val: CascadeValue, level: number) => void;
  level: number;
}

const PcCascaderMenuItem = memo(({ option, isActive, onSelect, level }: PcMenuItemProps) => (
  <div
    className={cx(
      styles['cascader-menu-item'],
      option.disabled && styles['disabled'],
      isActive && styles['active'],
    )}
    onClick={() => !option.disabled && onSelect(option.value, level)}
  >
    <span>{option.label}</span>
    {!!option.children?.length && (
      <ChevronRightIcon className={styles['cascader-menu-item-arrow']} size={12} />
    )}
  </div>
));
PcCascaderMenuItem.displayName = 'PcCascaderMenuItem';

// ─── 下拉面板 ─────────────────────────────────────────────────────────────────

export interface CascaderPcDropdownProps {
  isClosing: boolean;
  allLevels: CascadeOption[][];
  /** 用于高亮已选中项（显示 active 状态） */
  selectedValue: CascadeValue[];
  /** 触发器的位置信息，用于 fixed 定位对齐 */
  triggerRect: DOMRect;
  onSelect: (val: CascadeValue, level: number) => void;
  onAnimationEnd: () => void;
}

const CascaderPcDropdown: React.FC<CascaderPcDropdownProps> = ({
  isClosing,
  allLevels,
  selectedValue,
  triggerRect,
  onSelect,
  onAnimationEnd,
}) => {
  // 通过 CSS 自定义属性传递定位坐标，规避直接内联样式
  // safeNum 确保坐标为有效有限数，防止 NaN/Infinity 造成定位异常
  const cssVars = {
    '--cdp-top':   `${safeNum(triggerRect.bottom) + 4}px`,
    '--cdp-left':  `${safeNum(triggerRect.left)}px`,
    '--cdp-width': `${safeNum(triggerRect.width)}px`,
  } as React.CSSProperties;

  const panel = (
    <div
      className={cx(
        styles['cascader-dropdown-portal'],
        isClosing && styles['closing'],
      )}
      style={cssVars}
      onAnimationEnd={onAnimationEnd}
      role="listbox"
    >
      <div className={styles['cascader-menus']}>
        {allLevels.map((levelOptions, levelIndex) => (
          <div key={levelIndex} className={styles['cascader-menu']}>
            {levelOptions.map(option => (
              <PcCascaderMenuItem
                key={String(option.value)}
                option={option}
                isActive={isOptionSelected(option, selectedValue, levelIndex)}
                onSelect={onSelect}
                level={levelIndex}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );

  return createPortal(panel, document.body);
};

export default memo(CascaderPcDropdown);
