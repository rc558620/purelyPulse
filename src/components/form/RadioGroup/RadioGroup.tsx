/**
 * RadioGroup — Ant Design Radio.Group 风格的单选组件
 *
 * 特性：
 * - 选项横排、中间分隔线，外框圆角（类 Ant Design segmented/radio-group 样式）
 * - 支持自定义主色（CSS 变量 --radio-color）
 * - 支持禁用、错误态
 * - 无障碍：使用原生 <input type="radio">，键盘可操作
 */
import React, { memo, useCallback, useId, useMemo } from 'react';
import { cx } from '@utils/utils';
import styles from './RadioGroup.module.less';

export interface RadioOption<T extends string = string> {
  value: T;
  label: React.ReactNode;
  disabled?: boolean;
}

export interface RadioGroupProps<T extends string = string> {
  /** 选项列表 */
  options: RadioOption<T>[];
  /** 当前选中值（支持 FormItem 注入的 unknown 类型） */
  value?: T | null | unknown;
  /** 值变更回调（直接返回值，兼容 FormItem 的 onChange 注入） */
  onChange?: (value: T) => void;
  /** 主色（CSS 颜色值，默认跟随品牌色 @primary） */
  color?: string;
  /** 错误态（边框变红），兼容 FormItem 注入的 status='error' */
  error?: boolean;
  /** FormItem 注入的 status，'error' 时等同于 error=true */
  status?: 'error' | undefined;
  /** 禁用整个组 */
  disabled?: boolean;
  /** 自定义根节点 class */
  className?: string;
  /** name 属性（同 input[type=radio] 的 name，不填则自动生成） */
  name?: string;
  /** 无障碍：关联标签元素 id，FormItem 会自动注入 */
  ['aria-labelledby']?: string;
}

/** 单个 Radio 选项 — 独立 memo，parent 更新不会导致未变更项重渲染 */
interface RadioItemProps<T extends string> {
  opt: RadioOption<T>;
  name: string;
  checked: boolean;
  disabled: boolean;
  onChange: (value: T) => void;
}

function RadioItemInner<T extends string>({ opt, name, checked, disabled, onChange }: RadioItemProps<T>) {
  const id = `${name}-${opt.value}`;
  const handleChange = useCallback(() => onChange(opt.value as T), [onChange, opt.value]);

  return (
    <div key={opt.value} className={styles.radioItem}>
      <input
        type="radio"
        id={id}
        name={name}
        value={opt.value}
        checked={checked}
        disabled={disabled}
        onChange={handleChange}
        className={styles.radioInput}
      />
      <label htmlFor={id} className={styles.radioLabel}>
        <span className={styles.radioIndicator} aria-hidden="true" />
        {opt.label}
      </label>
    </div>
  );
}

const RadioItem = memo(RadioItemInner) as typeof RadioItemInner;

function RadioGroupInner<T extends string = string>({
  options,
  value,
  onChange,
  color,
  error = false,
  status,
  disabled = false,
  className,
  name: nameProp,
  'aria-labelledby': ariaLabelledby,
}: RadioGroupProps<T>) {
  const hasError = error || status === 'error';
  const autoId = useId();
  const name = nameProp ?? `radio-group-${autoId}`;

  const colorStyle = useMemo(
    () => (color ? ({ '--radio-color': color } as React.CSSProperties) : undefined),
    [color],
  );

  const handleChange = useCallback((val: T) => onChange?.(val), [onChange]);

  return (
    <div
      className={cx(styles.radioGroup, hasError && styles.radioGroupError, className)}
      style={colorStyle}
      role="group"
      aria-labelledby={ariaLabelledby}
    >
      {options.map((opt) => (
        <RadioItem
          key={opt.value}
          opt={opt}
          name={name}
          checked={value === opt.value}
          disabled={disabled || !!opt.disabled}
          onChange={handleChange}
        />
      ))}
    </div>
  );
}

const RadioGroupMemo = memo(RadioGroupInner) as typeof RadioGroupInner;

/**
 * RadioGroup — 受控属性名为 value，onChange 直接返回值（非 ChangeEvent）。
 * FormItem 通过 __VALUE_PROP_NAME__ 自动推断 valuePropName，
 * 通过 __IS_DIRECT_VALUE__ 跳过 extractFieldValue 的事件提取逻辑。
 */
const RadioGroup = RadioGroupMemo as typeof RadioGroupMemo & {
    /** 受控属性名，FormItem 自动推断。 */
    __VALUE_PROP_NAME__: 'value';
    /** onChange 直接返回值而非 ChangeEvent，FormItem 跳过 extractFieldValue。 */
    __IS_DIRECT_VALUE__: true;
};

RadioGroup.__VALUE_PROP_NAME__ = 'value';
RadioGroup.__IS_DIRECT_VALUE__ = true;

export default RadioGroup;
