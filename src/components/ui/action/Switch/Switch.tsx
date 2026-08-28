// 全局开关（toggle switch）：统一全站开关样式与交互。
// - 受控 checked + onChange(checked) 接口
// - role="switch" + aria-checked 无障碍语义
// - 主题色（lime 色系）与项目品牌主色保持一致
// - 极简设计：无内部「开/关」文字，仅滑块位置 + 颜色变化表达状态
import React, { memo } from 'react';
import { cx } from '@utils/utils';
import styles from './Switch.module.less';

export interface SwitchProps {
    /** 是否开启 */
    checked: boolean;
    /** 切换回调，参数为期望的新状态 */
    onChange: (checked: boolean) => void;
    /** 关闭时的 aria-label（向用户提示点击后会开启） */
    offLabel: string;
    /** 开启时的 aria-label（向用户提示点击后会关闭） */
    onLabel: string;
    /** 是否禁用 */
    disabled?: boolean;
    /** 开关尺寸 */
    size?: 'sm' | 'md';
    /** 自定义根节点 className */
    className?: string;
}

/**
 * 全局 Switch（toggle 开关）。
 *
 * 设计要点：
 * - 默认使用品牌主色（lime-500）作为开启态背景，hover/active 用同色系加深档（lime-700/800）
 * - 与主 CTA 按钮、focus 焦点环保持同色系
 * - 极简：仅滑块位置 + 颜色变化表达状态，不带内部文字
 */
const Switch: React.FC<SwitchProps> = memo(function Switch({
    checked,
    onChange,
    offLabel,
    onLabel,
    disabled = false,
    size = 'md',
    className,
}) {
    const handleClick = (): void => {
        if (disabled) return;
        onChange(!checked);
    };

    return (
        <button
            type="button"
            role="switch"
            aria-checked={checked}
            aria-label={checked ? onLabel : offLabel}
            disabled={disabled}
            onClick={handleClick}
            className={cx(
                styles.switch,
                styles[`size_${size}`],
                checked && styles.switchOn,
                disabled && styles.switchDisabled,
                className,
            )}
        >
            <span className={styles.switchThumb} aria-hidden="true" />
        </button>
    );
});

Switch.displayName = 'Switch';

export default Switch;