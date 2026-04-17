import type React from 'react';

/** Toast 提示类型。default 不显示图标，success / warning / error 显示对应内置图标，info 显示信息图标。 */
export type ToastType = 'default' | 'success' | 'error' | 'warning' | 'info';

/** 单条 Toast 数据。 */
export interface ToastItem {
    /** 唯一标识。 */
    id: string;
    /** 提示文案。 */
    message: string;
    /** 提示类型。 */
    type: ToastType;
    /** 是否正在离场。 */
    leaving: boolean;
    /** 自定义图标节点；传入时优先使用，不传则由 type 决定是否显示内置图标（default 无图标）。 */
    icon?: React.ReactNode;
}

/** toast 命令式调用参数。 */
export interface ShowToastOptions {
    /** 提示文案。 */
    message: string;
    /** 提示类型，默认 default（无图标）。 */
    type?: ToastType;
    /** 自动消失时间（ms），默认 3000。 */
    duration?: number;
    /** 自定义图标节点；传入时优先使用，不传则由 type 决定是否显示内置图标（default 无图标）。 */
    icon?: React.ReactNode;
}
