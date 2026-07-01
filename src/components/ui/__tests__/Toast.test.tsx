/**
 * Toast 组件单元测试
 */
import React, { act } from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { showToast, ToastContainer } from '../feedback/Toast/index';
import { TOAST_EVENT, DEFAULT_DURATION, LEAVE_DURATION } from '../feedback/Toast/constants';

async function fireShowToast(options: Parameters<typeof showToast>[0]) {
    await act(async () => {
        showToast(options);
        await Promise.resolve();
    });
}

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

describe('ToastContainer – 基本渲染', () => {
    beforeEach(() => {
        vi.useFakeTimers();
    });
    afterEach(() => {
        act(() => {
            vi.runAllTimers();
        });
        vi.useRealTimers();
    });

    it('初始无 toast 时不渲染任何 DOM（返回 null）', () => {
        const { container } = render(<ToastContainer />);
        expect(container.firstChild).toBeNull();
    });

    it('接收 showToast 后渲染消息文本', async () => {
        render(<ToastContainer />);
        await fireShowToast({ message: '操作成功' });
        expect(screen.getByText('操作成功')).toBeInTheDocument();
    });

    it('toast 元素具有 role="alert"', async () => {
        render(<ToastContainer />);
        await fireShowToast({ message: '提示' });
        expect(screen.getByRole('alert')).toBeInTheDocument();
    });

    it('容器具有 role="region"', async () => {
        render(<ToastContainer />);
        await fireShowToast({ message: '提示' });
        expect(screen.getByRole('region')).toBeInTheDocument();
    });

    it('容器具有 aria-live="polite"', async () => {
        render(<ToastContainer />);
        await fireShowToast({ message: '提示' });
        expect(screen.getByRole('region')).toHaveAttribute('aria-live', 'polite');
    });

    it('容器具有 aria-label="提示消息"', async () => {
        render(<ToastContainer />);
        await fireShowToast({ message: '提示' });
        expect(screen.getByRole('region')).toHaveAttribute('aria-label', '提示消息');
    });
});

describe('ToastContainer – 类型图标', () => {
    beforeEach(() => vi.useFakeTimers());
    afterEach(() => {
        act(() => {
            vi.runAllTimers();
        });
        vi.useRealTimers();
    });

    it('type="success" 时 toast 含 success class', async () => {
        render(<ToastContainer />);
        await fireShowToast({ message: '成功', type: 'success' });
        expect(screen.getByRole('alert').className).toMatch(/success/);
    });

    it('type="error" 时 toast 含 error class', async () => {
        render(<ToastContainer />);
        await fireShowToast({ message: '失败', type: 'error' });
        expect(screen.getByRole('alert').className).toMatch(/error/);
    });

    it('type="warning" 时 toast 含 warning class', async () => {
        render(<ToastContainer />);
        await fireShowToast({ message: '警告', type: 'warning' });
        expect(screen.getByRole('alert').className).toMatch(/warning/);
    });

    it('type="info" 时 toast 含 info class', async () => {
        render(<ToastContainer />);
        await fireShowToast({ message: '信息', type: 'info' });
        expect(screen.getByRole('alert').className).toMatch(/info/);
    });

    it('type="default" 时不含 success/error/warning/info class（无状态样式）', async () => {
        render(<ToastContainer />);
        await fireShowToast({ message: '默认', type: 'default' });
        const cls = screen.getByRole('alert').className;
        expect(cls).not.toMatch(/success/);
        expect(cls).not.toMatch(/error/);
        expect(cls).not.toMatch(/warning/);
        expect(cls).not.toMatch(/\binfo\b/);
    });

    it('type="success" 时渲染 svg 图标', async () => {
        const { container } = render(<ToastContainer />);
        await fireShowToast({ message: '成功', type: 'success' });
        expect(container.querySelector('svg')).toBeInTheDocument();
    });

    it('type="default" 时不渲染内置 svg 图标', async () => {
        const { container } = render(<ToastContainer />);
        await fireShowToast({ message: '默认', type: 'default' });
        expect(container.querySelector('svg')).toBeNull();
    });
});

describe('ToastContainer – 自定义 icon', () => {
    beforeEach(() => vi.useFakeTimers());
    afterEach(() => {
        act(() => {
            vi.runAllTimers();
        });
        vi.useRealTimers();
    });

    it('icon=<node> 时渲染自定义图标节点', async () => {
        render(<ToastContainer />);
        await fireShowToast({
            message: '自定义',
            type: 'success',
            icon: <span data-testid="custom-icon">★</span>,
        });
        expect(screen.getByTestId('custom-icon')).toBeInTheDocument();
    });

    it('icon=null 时隐藏内置图标（success 类型也不渲染 svg）', async () => {
        const { container } = render(<ToastContainer />);
        await fireShowToast({ message: '强制无图标', type: 'success', icon: null });
        expect(container.querySelector('svg')).toBeNull();
    });
});

describe('ToastContainer – 自动消失', () => {
    beforeEach(() => vi.useFakeTimers());
    afterEach(() => {
        act(() => {
            vi.runAllTimers();
        });
        vi.useRealTimers();
    });

    it('经过 DEFAULT_DURATION 后 toast 添加 leaving class（离场动画）', async () => {
        render(<ToastContainer />);
        await fireShowToast({ message: '自动消失', type: 'info' });
        expect(screen.getByRole('alert').className).not.toMatch(/leaving/);

        act(() => { vi.advanceTimersByTime(DEFAULT_DURATION); });
        expect(screen.getByRole('alert').className).toMatch(/leaving/);
    });

    it('经过 DEFAULT_DURATION + LEAVE_DURATION 后 toast 从 DOM 移除', async () => {
        render(<ToastContainer />);
        await fireShowToast({ message: '彻底消失', type: 'info' });
        expect(screen.getByText('彻底消失')).toBeInTheDocument();

        act(() => { vi.advanceTimersByTime(DEFAULT_DURATION + LEAVE_DURATION + 100); });
        expect(screen.queryByText('彻底消失')).toBeNull();
    });

    it('自定义 duration 后 toast 离场', async () => {
        render(<ToastContainer />);
        await fireShowToast({ message: '快消失', duration: 500 });

        act(() => { vi.advanceTimersByTime(500); });
        expect(screen.getByRole('alert').className).toMatch(/leaving/);
    });
});

describe('ToastContainer – 点击关闭', () => {
    beforeEach(() => vi.useFakeTimers());
    afterEach(() => {
        act(() => {
            vi.runAllTimers();
        });
        vi.useRealTimers();
    });

    it('点击 toast 触发 leaving class', async () => {
        render(<ToastContainer />);
        await fireShowToast({ message: '点我关闭', type: 'info' });
        act(() => { fireEvent.click(screen.getByRole('alert')); });
        expect(screen.getByRole('alert').className).toMatch(/leaving/);
    });

    it('点击后经过 LEAVE_DURATION 时间 toast 从 DOM 移除', async () => {
        render(<ToastContainer />);
        await fireShowToast({ message: '点我关闭', type: 'info' });
        act(() => { fireEvent.click(screen.getByRole('alert')); });
        act(() => { vi.advanceTimersByTime(LEAVE_DURATION + 100); });
        expect(screen.queryByText('点我关闭')).toBeNull();
    });
});

describe('ToastContainer – 多条 toast', () => {
    beforeEach(() => vi.useFakeTimers());
    afterEach(() => {
        act(() => {
            vi.runAllTimers();
        });
        vi.useRealTimers();
    });

    it('多次 showToast 会累加多条 toast', async () => {
        render(<ToastContainer />);
        await fireShowToast({ message: '第一条' });
        await fireShowToast({ message: '第二条' });
        await fireShowToast({ message: '第三条' });
        expect(screen.getAllByRole('alert')).toHaveLength(3);
    });

    it('各条 toast 文本独立渲染', async () => {
        render(<ToastContainer />);
        await fireShowToast({ message: 'Toast A' });
        await fireShowToast({ message: 'Toast B' });
        expect(screen.getByText('Toast A')).toBeInTheDocument();
        expect(screen.getByText('Toast B')).toBeInTheDocument();
    });
});

describe('ToastContainer – 卸载清理', () => {
    beforeEach(() => vi.useFakeTimers());
    afterEach(() => {
        act(() => {
            vi.runAllTimers();
        });
        vi.useRealTimers();
    });

    it('卸载后向 window 发送事件不再更新 DOM', () => {
        const { unmount, container } = render(<ToastContainer />);
        unmount();
        expect(() => {
            act(() => { showToast({ message: '卸载后的消息' }); });
        }).not.toThrow();
        expect(container.firstChild).toBeNull();
    });
});

describe('ToastContainer – React.memo', () => {
    it('ToastContainer 是 React.memo 包裹的组件', () => {
        expect((ToastContainer as unknown as { $$typeof?: symbol }).$$typeof?.toString()).toContain('memo');
    });
});
