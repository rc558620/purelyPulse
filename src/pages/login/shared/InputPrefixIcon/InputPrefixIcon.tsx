// auth 页面公共输入框前缀：图标 + 分割线，统一替代各页面模块级常量和内联渲染函数。
import React, { memo } from 'react';
import styles from './InputPrefixIcon.module.less';

export interface InputPrefixIconProps {
    /**
     * 图标内容，支持两种形式：
     * - `string`：图片资源路径（SVG import），内部用 `<img>` 渲染（auth 页面传统用法）
     * - `ReactNode`：任意节点（SVG 组件、JSX 等），直接渲染（settings 等页面用法）
     */
    icon: string | React.ReactNode;
    /**
     * 图标 alt 文本（仅在 icon 为 string 时用于 `<img alt>`；
     * icon 为 ReactNode 时通常已在组件内设置 aria-hidden，此属性可省略）。
     */
    alt?: string;
}

/**
 * 输入框左侧前缀：图标 + 竖向分割线。
 *
 * 用于替代 login / register / forgotPassword / addStore / storeSettings 各自重复定义的
 * iconWrapper 常量、renderInputPrefix 函数及 createInputPrefix 工厂。
 *
 * 性能说明：
 * 在各使用方将此组件实例提升为模块级常量（或 useMemo），可保证
 * prefix prop 引用稳定，消除 Input 子树因 prefix 变化触发的无效 diff。
 */
const InputPrefixIcon: React.FC<InputPrefixIconProps> = memo(({ icon, alt = '' }) => (
    <div className={styles.iconWrapper}>
        {typeof icon === 'string' ? (
            <img src={icon} alt={alt} className={styles.inputIcon} />
        ) : (
            <span className={styles.inputIconNode}>{icon}</span>
        )}
        <span className={styles.separator} aria-hidden="true" />
    </div>
));

InputPrefixIcon.displayName = 'InputPrefixIcon';

export default InputPrefixIcon;
