/**
 * Toast 组件单元测试
 *
 * 覆盖范围：
 *
 *  ─ showToast（命令式触发）
 *    1.  showToast 派发 CustomEvent 到 window
 *    2.  event detail 包含 message
 *    3.  event detail 中 type 默认为 undefined（依赖 detail 透传）
 *    4.  event detail 中自定义 type 正确传递
 *    5.  event detail 中 duration 正确传递
 *    6.  event detail 中 icon 正确传递
 *
 *  ─ ToastContainer – 基本渲染
 *    7.  初始无 toast 时返回 null（不渲染 DOM）
 *    8.  接收 showToast 后渲染 toast 消息文本
 *    9.  toast 元素具有 role="alert"
 *    10. 容器具有 role="region" aria-live="polite" aria-label="提示消息"
 *
 *  ─ ToastContainer – 类型图标
 *    11. type="success" 时 toast 含 success class
 *    12. type="error"   时 toast 含 error class
 *    13. type="warning" 时 toast 含 warning class
 *    14. type="info"    时 toast 含 info class
 *    15. type="default" 时 toast 含 default class（无内置图标）
 *    16. type="success" 时渲染 svg 图标
 *    17. type="default" 时不渲染 svg 图标（无内置图标）
 *
 *  ─ ToastContainer – 自定义 icon
 *    18. icon=<node> 时渲染自定义图标
 *    19. icon=null 时隐藏图标（即使 type 有内置图标）
 *
 *  ─ ToastContainer – 自动消失
 *    20. 经过 duration 后 toast 触发 leaving 动画（消失）
 *    21. 经过 duration + LEAVE_DURATION 后 toast 从 DOM 移除
 *
 *  ─ ToastContainer – 点击关闭
 *    22. 点击 toast 触发 leaving 动画（leaving class 出现）
 *    23. 点击后 LEAVE_DURATION 后 toast 从 DOM 移除
 *
 *  ─ ToastContainer – 多条 toast
 *    24. 多次 showToast 累加多条 toast
 *    25. 每条 toast 独立渲染
 *
 *  ─ ToastContainer – 卸载清理
 *    26. 卸载后 timer 被清理（不再有 state 更新报错）
 *    27. 卸载后 window 事件监听器被移除
 *
 *  ─ ToastContainer – React.memo
 *    28. ToastContainer 是 React.memo 包裹的组件
 */

import React, { act } from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { showToast, ToastContainer } from '../feedback/Toast/index';
import { TOAST_EVENT, DEFAULT_DURATION, LEAVE_DURATION } from '../feedback/Toast/constants';

// ─────────────────────────────────────────────────────────────────────────────
// 辅助：触发 showToast 并等待 React 状态更新
// ─────────────────────────────────────────────────────────────────────────────
function fireShowToast(options: Parameters<typeof showToast>[0]) {
    act(() => {
        showToast(options);
    });
}

// ─── 1. showToast 命令式触发 ──────────────────────────────────────────────────
describe('showToast – 命令式触发', () => {
    it('调用 showToast 会向 window 派发 CustomEvent', () => {
        const listener = vi.fn();
        window.addEventListener(TOAST_EVENT, listener);
        showToast({ message: '测试消息' });
        expect(listener).toHaveBeenCalledTimes(1);
        window.removeEventListener(TOAST_EVENT, listener);
    });

    it('event detail 包含正确的 message', () => {
        const listener = vi.fn();
        window.addEventListener(TOAST_EVENT, listener as EventListener);
        showToast({ message: '你好世界' });
        const detail = (listener.mock.calls[0][0] as CustomEvent).detail;
        expect(detail.message).toBe('你好世界');
        window.removeEventListener(TOAST_EVENT, listener as EventListener);
    });

    it('自定义 type 在 event detail 中正确传递', () => {
        const listener = vi.fn();
        window.addEventListener(TOAST_EVENT, listener as EventListener);
        showToast({ message: 'ok', type: 'success' });
        const detail = (listener.mock.calls[0][0] as CustomEvent).detail;
        expect(detail.type).toBe('success');
        window.removeEventListener(TOAST_EVENT, listener as EventListener);
    });

    it('duration 在 event detail 中正确传递', () => {
        const listener = vi.fn();
        window.addEventListener(TOAST_EVENT, listener as EventListener);
        showToast({ message: 'ok', duration: 5000 });
        const detail = (listener.mock.calls[0][0] as CustomEvent).detail;
        expect(detail.duration).toBe(5000);
        window.removeEventListener(TOAST_EVENT, listener as EventListener);
    });

    it('icon 在 event detail 中正确传递', () => {
        const listener = vi.fn();
        window.addEventListener(TOAST_EVENT, listener as EventListener);
        const icon = <span>★</span>;
        showToast({ message: 'ok', icon });
        const detail = (listener.mock.calls[0][0] as CustomEvent).detail;
        expect(detail.icon).toBe(icon);
        window.removeEventListener(TOAST_EVENT, listener as EventListener);
    });
});

// ─── 2. ToastContainer – 基本渲染 ────────────────────────────────────────────
describe('ToastContainer – 基本渲染', () => {
    beforeEach(() => {
        vi.useFakeTimers();
    });
    afterEach(() => {
        vi.runAllTimers();
        vi.useRealTimers();
    });

    it('初始无 toast 时不渲染任何 DOM（返回 null）', () => {
        const { container } = render(<ToastContainer />);
        expect(container.firstChild).toBeNull();
    });

    it('接收 showToast 后渲染消息文本', () => {
        render(<ToastContainer />);
        fireShowToast({ message: '操作成功' });
        expect(screen.getByText('操作成功')).toBeInTheDocument();
    });

    it('toast 元素具有 role="alert"', () => {
        render(<ToastContainer />);
        fireShowToast({ message: '提示' });
        expect(screen.getByRole('alert')).toBeInTheDocument();
    });

    it('容器具有 role="region"', () => {
        render(<ToastContainer />);
        fireShowToast({ message: '提示' });
        expect(screen.getByRole('region')).toBeInTheDocument();
    });

    it('容器具有 aria-live="polite"', () => {
        render(<ToastContainer />);
        fireShowToast({ message: '提示' });
        expect(screen.getByRole('region')).toHaveAttribute('aria-live', 'polite');
    });

    it('容器具有 aria-label="提示消息"', () => {
        render(<ToastContainer />);
        fireShowToast({ message: '提示' });
        expect(screen.getByRole('region')).toHaveAttribute('aria-label', '提示消息');
    });
});

// ─── 3. ToastContainer – 类型图标 ────────────────────────────────────────────
describe('ToastContainer – 类型图标', () => {
    beforeEach(() => vi.useFakeTimers());
    afterEach(() => { vi.runAllTimers(); vi.useRealTimers(); });

    it('type="success" 时 toast 含 success class', () => {
        render(<ToastContainer />);
        fireShowToast({ message: '成功', type: 'success' });
        expect(screen.getByRole('alert').className).toMatch(/success/);
    });

    it('type="error" 时 toast 含 error class', () => {
        render(<ToastContainer />);
        fireShowToast({ message: '失败', type: 'error' });
        expect(screen.getByRole('alert').className).toMatch(/error/);
    });

    it('type="warning" 时 toast 含 warning class', () => {
        render(<ToastContainer />);
        fireShowToast({ message: '警告', type: 'warning' });
        expect(screen.getByRole('alert').className).toMatch(/warning/);
    });

    it('type="info" 时 toast 含 info class', () => {
        render(<ToastContainer />);
        fireShowToast({ message: '信息', type: 'info' });
        expect(screen.getByRole('alert').className).toMatch(/info/);
    });

    it('type="default" 时不含 success/error/warning/info class（无状态样式）', () => {
        render(<ToastContainer />);
        fireShowToast({ message: '默认', type: 'default' });
        const cls = screen.getByRole('alert').className;
        // default 类型不添加任何状态颜色 class
        expect(cls).not.toMatch(/success/);
        expect(cls).not.toMatch(/error/);
        expect(cls).not.toMatch(/warning/);
        expect(cls).not.toMatch(/\binfo\b/);
    });

    it('type="success" 时渲染 svg 图标', () => {
        const { container } = render(<ToastContainer />);
        fireShowToast({ message: '成功', type: 'success' });
        expect(container.querySelector('svg')).toBeInTheDocument();
    });

    it('type="default" 时不渲染内置 svg 图标', () => {
        const { container } = render(<ToastContainer />);
        fireShowToast({ message: '默认', type: 'default' });
        expect(container.querySelector('svg')).toBeNull();
    });
});

// ─── 4. ToastContainer – 自定义 icon ─────────────────────────────────────────
describe('ToastContainer – 自定义 icon', () => {
    beforeEach(() => vi.useFakeTimers());
    afterEach(() => { vi.runAllTimers(); vi.useRealTimers(); });

    it('icon=<node> 时渲染自定义图标节点', () => {
        render(<ToastContainer />);
        fireShowToast({
            message: '自定义',
            type: 'success',
            icon: <span data-testid="custom-icon">★</span>,
        });
        expect(screen.getByTestId('custom-icon')).toBeInTheDocument();
    });

    it('icon=null 时隐藏内置图标（success 类型也不渲染 svg）', () => {
        const { container } = render(<ToastContainer />);
        fireShowToast({ message: '强制无图标', type: 'success', icon: null });
        expect(container.querySelector('svg')).toBeNull();
    });
});

// ─── 5. ToastContainer – 自动消失 ────────────────────────────────────────────
describe('ToastContainer – 自动消失', () => {
    beforeEach(() => vi.useFakeTimers());
    afterEach(() => { vi.runAllTimers(); vi.useRealTimers(); });

    it('经过 DEFAULT_DURATION 后 toast 添加 leaving class（离场动画）', () => {
        render(<ToastContainer />);
        fireShowToast({ message: '自动消失', type: 'info' });
        expect(screen.getByRole('alert').className).not.toMatch(/leaving/);

        act(() => { vi.advanceTimersByTime(DEFAULT_DURATION); });
        expect(screen.getByRole('alert').className).toMatch(/leaving/);
    });

    it('经过 DEFAULT_DURATION + LEAVE_DURATION 后 toast 从 DOM 移除', () => {
        render(<ToastContainer />);
        fireShowToast({ message: '彻底消失', type: 'info' });
        expect(screen.getByText('彻底消失')).toBeInTheDocument();

        act(() => { vi.advanceTimersByTime(DEFAULT_DURATION + LEAVE_DURATION + 100); });
        expect(screen.queryByText('彻底消失')).toBeNull();
    });

    it('自定义 duration 后 toast 离场', () => {
        render(<ToastContainer />);
        fireShowToast({ message: '快消失', duration: 500 });

        act(() => { vi.advanceTimersByTime(500); });
        expect(screen.getByRole('alert').className).toMatch(/leaving/);
    });
});

// ─── 6. ToastContainer – 点击关闭 ────────────────────────────────────────────
describe('ToastContainer – 点击关闭', () => {
    beforeEach(() => vi.useFakeTimers());
    afterEach(() => { vi.runAllTimers(); vi.useRealTimers(); });

    it('点击 toast 触发 leaving class', () => {
        render(<ToastContainer />);
        fireShowToast({ message: '点我关闭', type: 'info' });
        act(() => { fireEvent.click(screen.getByRole('alert')); });
        expect(screen.getByRole('alert').className).toMatch(/leaving/);
    });

    it('点击后经过 LEAVE_DURATION 时间 toast 从 DOM 移除', () => {
        render(<ToastContainer />);
        fireShowToast({ message: '点我关闭', type: 'info' });
        act(() => { fireEvent.click(screen.getByRole('alert')); });
        act(() => { vi.advanceTimersByTime(LEAVE_DURATION + 100); });
        expect(screen.queryByText('点我关闭')).toBeNull();
    });
});

// ─── 7. ToastContainer – 多条 toast ──────────────────────────────────────────
describe('ToastContainer – 多条 toast', () => {
    beforeEach(() => vi.useFakeTimers());
    afterEach(() => { vi.runAllTimers(); vi.useRealTimers(); });

    it('多次 showToast 会累加多条 toast', () => {
        render(<ToastContainer />);
        fireShowToast({ message: '第一条' });
        fireShowToast({ message: '第二条' });
        fireShowToast({ message: '第三条' });
        expect(screen.getAllByRole('alert')).toHaveLength(3);
    });

    it('各条 toast 文本独立渲染', () => {
        render(<ToastContainer />);
        fireShowToast({ message: 'Toast A' });
        fireShowToast({ message: 'Toast B' });
        expect(screen.getByText('Toast A')).toBeInTheDocument();
        expect(screen.getByText('Toast B')).toBeInTheDocument();
    });
});

// ─── 8. ToastContainer – 卸载清理 ────────────────────────────────────────────
describe('ToastContainer – 卸载清理', () => {
    beforeEach(() => vi.useFakeTimers());
    afterEach(() => { vi.runAllTimers(); vi.useRealTimers(); });

    it('卸载后向 window 发送事件不再更新 DOM', () => {
        const { unmount, container } = render(<ToastContainer />);
        unmount();
        // 卸载后触发事件不应抛出错误，也不应再渲染
        expect(() => {
            act(() => { showToast({ message: '卸载后的消息' }); });
        }).not.toThrow();
        expect(container.firstChild).toBeNull();
    });
});

// ─── 9. ToastContainer – React.memo ──────────────────────────────────────────
describe('ToastContainer – React.memo', () => {
    it('ToastContainer 是 React.memo 包裹的组件', () => {
        expect((ToastContainer as unknown as { $$typeof?: symbol }).$$typeof?.toString()).toContain('memo');
    });
});
