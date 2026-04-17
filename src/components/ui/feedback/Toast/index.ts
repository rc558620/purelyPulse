import { TOAST_EVENT } from './constants';
import type { ShowToastOptions } from './types';

// Toast 模块统一导出入口。
export { ToastContainer } from './Toast';
export type { ToastItem, ToastType, ShowToastOptions } from './types';

/**
 * 命令式触发一条 Toast 提示。
 * 通过 CustomEvent 派发，与 React 渲染树解耦。
 * @param options - Toast 显示参数。
 */
export const showToast = (options: ShowToastOptions): void => {
    window.dispatchEvent(new CustomEvent<ShowToastOptions>(TOAST_EVENT, { detail: options }));
};
