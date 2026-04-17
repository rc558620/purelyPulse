/**
 * SlidingTabBar —— 通用滑动背景指示器 Tab 组件
 *
 * 三种视觉变体：
 *  - "pill"    ：胶囊/毛玻璃白底，激活项文字绿色（购买管理/员工/成本管理等）
 *  - "segment" ：灰底+白色激活块，iOS Segmented Control 风格（报表 period 筛选）
 *  - "primary" ：白底+渐变绿色激活块+白字（报表主 Tab 栏）
 *
 * 用法：
 * ```tsx
 * <SlidingTabBar
 *   options={[{ value: 'a', label: '选项A' }, { value: 'b', label: '选项B' }]}
 *   value="a"
 *   onChange={v => setTab(v)}
 *   variant="segment"
 * />
 * ```
 *
 * 如需在每个按钮内渲染额外节点（如图标），使用 renderLabel prop：
 * ```tsx
 * renderLabel={(opt, active) => (
 *   <>
 *     <span>{TAB_ICONS[opt.value]}</span>
 *     <span>{opt.label}</span>
 *   </>
 * )}
 * ```
 */
import React, { memo } from 'react';
import { cx } from '@utils/utils';
import { usePeriodTabIndicator } from '@hooks/usePeriodTabIndicator';
import styles from './SlidingTabBar.module.less';

export interface SlidingTabOption<T extends string = string> {
  value: T;
  label: string;
}

export interface SlidingTabBarProps<T extends string = string> {
  /** 选项列表 */
  options: readonly SlidingTabOption<T>[];
  /** 当前激活值 */
  value: T;
  /** 切换回调 */
  onChange: (v: T) => void;
  /**
   * 视觉变体：
   * - "pill"    ：胶囊/毛玻璃（购买管理/员工管理/成本管理）
   * - "segment" ：灰底白块（报表时间筛选 Tab）
   * - "primary" ：绿色渐变块+白字（报表主 Tab 栏）
   * @default "pill"
   */
  variant?: 'pill' | 'segment' | 'primary';
  /** 是否整体变暗（自定义日期模式时基础 Tab 变暗） */
  dimmed?: boolean;
  /** 额外 className 附加到容器 */
  className?: string;
  /** 额外 className 附加到每个按钮（用于覆盖 padding / font-size 等默认值） */
  btnClassName?: string;
  /** 自定义按钮内容渲染（默认渲染 opt.label） */
  renderLabel?: (opt: SlidingTabOption<T>, isActive: boolean) => React.ReactNode;
  /** ARIA label */
  ariaLabel?: string;
}

function SlidingTabBarInner<T extends string = string>({
  options,
  value,
  onChange,
  variant = 'pill',
  dimmed = false,
  className,
  btnClassName,
  renderLabel,
  ariaLabel,
}: SlidingTabBarProps<T>) {
  const { setTabRef, indicatorStyle, containerStyle } = usePeriodTabIndicator(options, value);

  const containerCls = cx(
    variant === 'pill'    && styles.pillContainer,
    variant === 'segment' && styles.segmentContainer,
    variant === 'primary' && styles.primaryContainer,
    dimmed && styles.dimmed,
    className,
  );

  const indicatorCls =
    variant === 'pill'    ? styles.pillIndicator    :
    variant === 'segment' ? styles.segmentIndicator :
    styles.primaryIndicator;

  const btnCls    = variant === 'pill'    ? styles.pillBtn    :
                    variant === 'segment' ? styles.segmentBtn :
                    styles.primaryBtn;

  const btnActive = variant === 'pill'    ? styles.pillBtnActive    :
                    variant === 'segment' ? styles.segmentBtnActive  :
                    styles.primaryBtnActive;

  return (
    <div
      className={containerCls}
      style={containerStyle}
      role="tablist"
      aria-label={ariaLabel}
    >
      <div
        className={indicatorCls}
        style={dimmed ? undefined : indicatorStyle}
        aria-hidden="true"
      />
      {options.map((opt, index) => {
        const isActive = value === opt.value;
        return (
          <button
            key={opt.value}
            ref={setTabRef(index)}
            type="button"
            role="tab"
            aria-selected={!dimmed && isActive}
            className={cx(btnCls, !dimmed && isActive && btnActive, btnClassName)}
            onClick={() => onChange(opt.value)}
          >
            {renderLabel ? renderLabel(opt, isActive) : opt.label}
          </button>
        );
      })}
    </div>
  );
}

const SlidingTabBar = memo(SlidingTabBarInner) as typeof SlidingTabBarInner;
export default SlidingTabBar;
