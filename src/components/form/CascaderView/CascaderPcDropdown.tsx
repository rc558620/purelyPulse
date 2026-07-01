// CascaderPcDropdown — PC 端级联下拉多列面板
//
// 绝对定位，通过 CSS 动画控制入场/退场。
// 自身只负责 UI 渲染，状态由父组件（CascaderView）通过 props 注入。

import React, { memo } from 'react';
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
  onSelect: (val: CascadeValue, level: number) => void;
  onAnimationEnd: () => void;
}

const CascaderPcDropdown: React.FC<CascaderPcDropdownProps> = ({
  isClosing,
  allLevels,
  selectedValue,
  onSelect,
  onAnimationEnd,
}) => (
  <div
    className={cx(
      styles['cascader-dropdown-pc'],
      isClosing && styles['closing'],
    )}
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

export default memo(CascaderPcDropdown);
