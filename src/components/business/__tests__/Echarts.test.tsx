/**
 * Echarts 组件单元测试
 *
 * 覆盖范围：
 *  ─ 基本渲染
 *    1.  渲染一个 div 容器
 *    2.  容器含 echartsContainer class
 *    3.  传入自定义 className 被附加到容器
 *    4.  传入 style prop 被应用
 *  ─ 挂载时初始化
 *    5.  挂载后 echarts.init 被调用一次
 *    6.  echarts.init 传入的是容器 div 元素
 *    7.  挂载后立即调用 setOption(option, ...)
 *    8.  首次 setOption 的 notMerge=false, lazyUpdate=false
 *  ─ option 更新
 *    9.  option prop 变更后再次调用 setOption
 *    10. setOption 的参数为新的 option 对象
 *    11. option 未变更时 setOption 不重复调用（memo 阻止重渲染）
 *  ─ ResizeObserver
 *    12. 挂载后 ResizeObserver 对容器进行 observe
 *    13. 触发 resize 时 chartInstance.resize() 被调用
 *  ─ 卸载清理
 *    14. 卸载时 ResizeObserver.disconnect 被调用
 *    15. 卸载时 chartInstance.dispose 被调用
 *  ─ 空 option
 *    16. 传入空 option={} 时不抛出异常
 *  ─ EventTarget.prototype.addEventListener 补丁
 *    17. 挂载后 addEventListener patch 被还原（不影响后续测试）
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, act } from '@testing-library/react';

const { mockSetOption, mockResize, mockDispose, mockIsDisposed, mockOn, mockOff, mockInit, mockUse } = vi.hoisted(() => {
    const mockSetOption = vi.fn();
    const mockResize = vi.fn();
    const mockDispose = vi.fn();
    const mockIsDisposed = vi.fn(() => false);
    const mockOn = vi.fn();
    const mockOff = vi.fn();
    const mockChartInstance = {
        setOption: mockSetOption,
        resize: mockResize,
        dispose: mockDispose,
        isDisposed: mockIsDisposed,
        on: mockOn,
        off: mockOff,
    };
    const mockInit = vi.fn(() => mockChartInstance);
    const mockUse = vi.fn();

    return {
        mockSetOption,
        mockResize,
        mockDispose,
        mockIsDisposed,
        mockOn,
        mockOff,
        mockInit,
        mockUse,
    };
});

vi.mock('echarts/core', () => ({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    init: (el: unknown) => (mockInit as (a: unknown) => any)(el),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    use: (...args: any[]) => (mockUse as (...a: any[]) => void)(...args),
}));

import Echarts from '../Echarts/Echarts';

// ─────────────────────────────────────────────────────────────────────────────
// mock ResizeObserver
// ─────────────────────────────────────────────────────────────────────────────
let capturedObserveCallback: (() => void) | null = null;
let capturedObserveTarget: Element | null = null;

const mockObserve = vi.fn((target: Element) => {
    capturedObserveTarget = target;
});
const mockDisconnect = vi.fn();

class MockResizeObserver {
    constructor(callback: () => void) {
        capturedObserveCallback = callback;
    }
    observe = mockObserve;
    disconnect = mockDisconnect;
    unobserve = vi.fn();
}

// ─────────────────────────────────────────────────────────────────────────────
// 全局替换 ResizeObserver
// ─────────────────────────────────────────────────────────────────────────────
const OriginalResizeObserver = globalThis.ResizeObserver;

beforeEach(() => {
    globalThis.ResizeObserver = MockResizeObserver as unknown as typeof ResizeObserver;
    mockSetOption.mockClear();
    mockResize.mockClear();
    mockDispose.mockClear();
    mockIsDisposed.mockClear();
    mockIsDisposed.mockReturnValue(false);
    mockOn.mockClear();
    mockOff.mockClear();
    mockInit.mockClear();
    mockObserve.mockClear();
    mockDisconnect.mockClear();
    capturedObserveCallback = null;
    capturedObserveTarget = null;
});

afterEach(() => {
    globalThis.ResizeObserver = OriginalResizeObserver;
});

// ─── 1. 基本渲染 ──────────────────────────────────────────────────────────────
describe('Echarts – 基本渲染', () => {
    it('渲染一个 div 容器', () => {
        const { container } = render(<Echarts option={{}} />);
        expect(container.querySelector('div')).toBeInTheDocument();
    });

    it('容器含 echartsContainer class', () => {
        const { container } = render(<Echarts option={{}} />);
        expect(container.firstChild).toBeTruthy();
        expect((container.firstChild as HTMLElement).className).toMatch(/echartsContainer/);
    });

    it('传入自定义 className 被附加到容器', () => {
        const { container } = render(<Echarts option={{}} className="my-chart" />);
        expect(container.querySelector('.my-chart')).toBeInTheDocument();
    });

    it('传入 style prop 被应用', () => {
        const { container } = render(<Echarts option={{}} style={{ height: '300px' }} />);
        expect((container.firstChild as HTMLElement).style.height).toBe('300px');
    });

    it('传入 style width 被应用', () => {
        const { container } = render(<Echarts option={{}} style={{ width: '500px' }} />);
        expect((container.firstChild as HTMLElement).style.width).toBe('500px');
    });
});

// ─── 2. 挂载时初始化 ──────────────────────────────────────────────────────────
describe('Echarts – 挂载时初始化', () => {
    it('挂载后 echarts.init 被调用一次', () => {
        render(<Echarts option={{}} />);
        expect(mockInit).toHaveBeenCalledTimes(1);
    });

    it('echarts.init 传入的是容器 div 元素（HTMLDivElement）', () => {
        const { container } = render(<Echarts option={{}} />);
        const div = container.firstChild as HTMLDivElement;
        expect(mockInit).toHaveBeenCalledWith(div);
    });

    it('模块初始化时已注册按需图表能力', () => {
        expect(mockUse).toHaveBeenCalled();
    });

    it('挂载后立即调用 setOption(option, ...)', () => {
        const option = { title: { text: '测试图表' } };
        render(<Echarts option={option} />);
        expect(mockSetOption).toHaveBeenCalledWith(
            option,
            expect.objectContaining({ notMerge: false, lazyUpdate: false }),
        );
    });

    it('setOption 使用 notMerge=false', () => {
        render(<Echarts option={{ xAxis: {} }} />);
        const callArgs = mockSetOption.mock.calls[0];
        expect(callArgs[1]).toHaveProperty('notMerge', false);
    });

    it('首次 setOption 使用 lazyUpdate=false', () => {
        render(<Echarts option={{ yAxis: {} }} />);
        const callArgs = mockSetOption.mock.calls[0];
        expect(callArgs[1]).toHaveProperty('lazyUpdate', false);
    });
});

// ─── 3. option 更新 ───────────────────────────────────────────────────────────
describe('Echarts – option 更新', () => {
    it('option prop 变更后 setOption 再次被调用', () => {
        const option1 = { title: { text: '图表一' } };
        const option2 = { title: { text: '图表二' } };

        const { rerender } = render(<Echarts option={option1} />);
        expect(mockSetOption).toHaveBeenCalledTimes(1);

        rerender(<Echarts option={option2} />);
        expect(mockSetOption).toHaveBeenCalledTimes(2);
    });

    it('第二次 setOption 传入新的 option 对象', () => {
        const option1 = { title: { text: '图表一' } };
        const option2 = { title: { text: '图表二' } };

        const { rerender } = render(<Echarts option={option1} />);
        rerender(<Echarts option={option2} />);

        const lastCall = mockSetOption.mock.calls[mockSetOption.mock.calls.length - 1];
        expect(lastCall[0]).toEqual(option2);
    });

    it('同一 option 引用 rerender 时 setOption 不额外调用', () => {
        const option = { title: { text: '稳定图表' } };

        const { rerender } = render(<Echarts option={option} />);
        const callsBefore = mockSetOption.mock.calls.length;

        rerender(<Echarts option={option} />);
        expect(mockSetOption.mock.calls.length).toBe(callsBefore);
    });
});

// ─── 4. ResizeObserver ────────────────────────────────────────────────────────
describe('Echarts – ResizeObserver', () => {
    it('挂载后 ResizeObserver.observe 被调用', () => {
        render(<Echarts option={{}} />);
        expect(mockObserve).toHaveBeenCalledTimes(1);
    });

    it('observe 传入的是容器 div', () => {
        const { container } = render(<Echarts option={{}} />);
        const div = container.firstChild as HTMLDivElement;
        expect(capturedObserveTarget).toBe(div);
    });

    it('跳过首次 resize callback 后，后续回调会触发 chartInstance.resize()', async () => {
        render(<Echarts option={{}} />);
        expect(capturedObserveCallback).not.toBeNull();

        act(() => {
            capturedObserveCallback?.();
        });
        expect(mockResize).toHaveBeenCalledTimes(0);

        await act(async () => {
            capturedObserveCallback?.();
            await new Promise((resolve) => requestAnimationFrame(() => resolve(undefined)));
        });

        expect(mockResize).toHaveBeenCalledTimes(1);
    });
});

// ─── 5. 卸载清理 ──────────────────────────────────────────────────────────────
describe('Echarts – 卸载清理', () => {
    it('卸载时 ResizeObserver.disconnect 被调用', () => {
        const { unmount } = render(<Echarts option={{}} />);
        unmount();
        expect(mockDisconnect).toHaveBeenCalledTimes(1);
    });

    it('卸载时 chartInstance.dispose 被调用', () => {
        const { unmount } = render(<Echarts option={{}} />);
        unmount();
        expect(mockDispose).toHaveBeenCalledTimes(1);
    });

    it('卸载后重新挂载时 echarts.init 重新被调用', () => {
        const { unmount } = render(<Echarts option={{}} />);
        unmount();
        mockInit.mockClear();

        render(<Echarts option={{}} />);
        expect(mockInit).toHaveBeenCalledTimes(1);
    });
});

// ─── 6. 空 option ─────────────────────────────────────────────────────────────
describe('Echarts – 空 option', () => {
    it('传入空 option={} 时不抛出异常', () => {
        expect(() => {
            render(<Echarts option={{}} />);
        }).not.toThrow();
    });

    it('传入 undefined xAxis 的 option 不抛出异常', () => {
        expect(() => {
            render(<Echarts option={{ series: [] }} />);
        }).not.toThrow();
    });
});

// ─── 7. EventTarget.prototype.addEventListener 补丁还原 ──────────────────────
describe('Echarts – addEventListener 补丁还原', () => {
    it('挂载后 EventTarget.prototype.addEventListener 被还原为原始函数', () => {
        const origAddEventListener = EventTarget.prototype.addEventListener;
        render(<Echarts option={{}} />);
        expect(EventTarget.prototype.addEventListener).toBe(origAddEventListener);
    });

    it('卸载后 EventTarget.prototype.addEventListener 仍然正常', () => {
        const origAddEventListener = EventTarget.prototype.addEventListener;
        const { unmount } = render(<Echarts option={{}} />);
        unmount();
        expect(EventTarget.prototype.addEventListener).toBe(origAddEventListener);
    });
});

// ─── 8. option 内容复杂场景 ───────────────────────────────────────────────────
describe('Echarts – 复杂 option 场景', () => {
    it('含 series 的完整 option 正常渲染', () => {
        const option = {
            xAxis: { type: 'category' as const, data: ['Mon', 'Tue', 'Wed'] },
            yAxis: { type: 'value' as const },
            series: [{ data: [150, 230, 224], type: 'line' as const }],
        };
        expect(() => {
            render(<Echarts option={option} />);
        }).not.toThrow();
        expect(mockSetOption).toHaveBeenCalledWith(option, expect.any(Object));
    });

    it('含 tooltip 的 option 正常 setOption', () => {
        const option = {
            tooltip: { trigger: 'axis' as const },
            legend: { data: ['销售额'] },
        };
        render(<Echarts option={option} />);
        expect(mockSetOption).toHaveBeenCalledWith(option, expect.any(Object));
    });
});

// ─── 9. 事件绑定（onEvents） ──────────────────────────────────────────────────
describe('Echarts – onEvents 事件绑定', () => {
    it('传入 onEvents 后 instance.on 被调用（每个事件名各一次）', () => {
        const handler = vi.fn();
        render(<Echarts option={{}} onEvents={{ click: handler, mousemove: handler }} />);
        expect(mockOn).toHaveBeenCalledWith('click', expect.any(Function));
        expect(mockOn).toHaveBeenCalledWith('mousemove', expect.any(Function));
    });

    it('不传 onEvents 时 instance.on 不被调用', () => {
        render(<Echarts option={{}} />);
        expect(mockOn).not.toHaveBeenCalled();
    });

    it('传入空 onEvents={} 时 instance.on 不被调用', () => {
        render(<Echarts option={{}} onEvents={{}} />);
        expect(mockOn).not.toHaveBeenCalled();
    });

    it('onEvents 中的代理函数被触发时转发给最新 handler', () => {
        const handler = vi.fn();
        render(<Echarts option={{}} onEvents={{ click: handler }} />);

        // 取出绑定的代理函数
        const proxyFn = mockOn.mock.calls.find(([name]) => name === 'click')?.[1] as
            | ((p: unknown) => void)
            | undefined;
        expect(proxyFn).toBeDefined();

        const fakeParams = { data: 42 };
        proxyFn?.(fakeParams);
        expect(handler).toHaveBeenCalledWith(fakeParams);
    });

    it('handler 引用更新后，代理函数调用最新 handler（无需重新 on/off）', () => {
        const handler1 = vi.fn();
        const handler2 = vi.fn();

        const { rerender } = render(<Echarts option={{}} onEvents={{ click: handler1 }} />);
        const onCallsBefore = mockOn.mock.calls.length;

        // 只换 handler 引用，事件名不变 → 不应重新 on
        rerender(<Echarts option={{}} onEvents={{ click: handler2 }} />);
        expect(mockOn.mock.calls.length).toBe(onCallsBefore);

        // 代理函数此时应调用 handler2
        const proxyFn = mockOn.mock.calls.find(([name]) => name === 'click')?.[1] as
            | ((p: unknown) => void)
            | undefined;
        proxyFn?.('test-params');
        expect(handler1).not.toHaveBeenCalled();
        expect(handler2).toHaveBeenCalledWith('test-params');
    });
});

// ─── 10. 事件解绑（onEvents 变化移除旧事件） ──────────────────────────────────
describe('Echarts – onEvents 事件解绑', () => {
    it('onEvents 中移除某事件名后，instance.off 被调用', () => {
        const handler = vi.fn();
        const { rerender } = render(
            <Echarts option={{}} onEvents={{ click: handler, dblclick: handler }} />,
        );
        mockOff.mockClear();

        // 移除 dblclick
        rerender(<Echarts option={{}} onEvents={{ click: handler }} />);
        expect(mockOff).toHaveBeenCalledWith('dblclick', expect.any(Function));
    });

    it('onEvents 从有到 undefined（移除所有事件），instance.off 对所有已绑定事件调用', () => {
        const handler = vi.fn();
        const { rerender } = render(
            <Echarts option={{}} onEvents={{ click: handler }} />,
        );
        mockOff.mockClear();

        rerender(<Echarts option={{}} />);
        expect(mockOff).toHaveBeenCalledWith('click', expect.any(Function));
    });

    it('onEvents 完全不变时（同引用 rerender），instance.on/off 不重复调用', () => {
        const events = { click: vi.fn() };
        const { rerender } = render(<Echarts option={{}} onEvents={events} />);
        mockOn.mockClear();
        mockOff.mockClear();

        rerender(<Echarts option={{}} onEvents={events} />);
        expect(mockOn).not.toHaveBeenCalled();
        expect(mockOff).not.toHaveBeenCalled();
    });
});

// ─── 11. memo 比较器 ──────────────────────────────────────────────────────────
describe('Echarts – memo 比较器', () => {
    it('className 变更触发重渲染，setOption 不再多调用（仅 class 更新）', () => {
        const option = { title: { text: 'memo-test' } };
        const { rerender } = render(<Echarts option={option} className="cls-1" />);
        const callsBefore = mockSetOption.mock.calls.length;

        rerender(<Echarts option={option} className="cls-2" />);
        // option 未变，setOption 不应额外调用
        expect(mockSetOption.mock.calls.length).toBe(callsBefore);
    });

    it('style 内容相同（不同对象引用）时 memo 阻止重渲染', () => {
        const option = { title: {} };
        const { rerender } = render(<Echarts option={option} style={{ height: '200px' }} />);
        const callsBefore = mockSetOption.mock.calls.length;

        // 新对象但值相同
        rerender(<Echarts option={option} style={{ height: '200px' }} />);
        expect(mockSetOption.mock.calls.length).toBe(callsBefore);
    });

    it('style 内容变更时 memo 允许重渲染（setOption 不额外调用，但 option 引用不变不调用）', () => {
        const option = { title: {} };
        const { rerender, container } = render(<Echarts option={option} style={{ height: '200px' }} />);
        const callsBefore = mockSetOption.mock.calls.length;

        rerender(<Echarts option={option} style={{ height: '400px' }} />);
        // option 引用未变，setOption 不多调用
        expect(mockSetOption.mock.calls.length).toBe(callsBefore);
        // 但 DOM 应更新 style
        expect((container.firstChild as HTMLElement).style.height).toBe('400px');
    });

    it('onEvents 内容相同（不同对象引用）时 memo 阻止重渲染', () => {
        const handler = vi.fn();
        const option = { title: {} };
        const { rerender } = render(<Echarts option={option} onEvents={{ click: handler }} />);
        const onCallsBefore = mockOn.mock.calls.length;

        // 新对象但内容（函数引用）相同
        rerender(<Echarts option={option} onEvents={{ click: handler }} />);
        expect(mockOn.mock.calls.length).toBe(onCallsBefore);
    });
});

// ─── 12. disposed 后 resize 不崩溃 ───────────────────────────────────────────
describe('Echarts – disposed 后 resize 安全', () => {
    it('isDisposed() 返回 true 时，ResizeObserver 回调不调用 resize()', async () => {
        mockIsDisposed.mockReturnValue(true);
        render(<Echarts option={{}} />);

        // 跳过第一次回调
        act(() => { capturedObserveCallback?.(); });

        await act(async () => {
            capturedObserveCallback?.();
            await new Promise((resolve) => requestAnimationFrame(() => resolve(undefined)));
        });

        expect(mockResize).not.toHaveBeenCalled();
    });

    it('卸载后 ResizeObserver 回调不崩溃', async () => {
        const { unmount } = render(<Echarts option={{}} />);

        // 跳过第一次
        act(() => { capturedObserveCallback?.(); });

        unmount();

        // 卸载后 rAF 回调如果还在队列中，不应抛出
        await expect(
            act(async () => {
                await new Promise((resolve) => requestAnimationFrame(() => resolve(undefined)));
            }),
        ).resolves.not.toThrow();
    });

    it('卸载并重新挂载后，新实例正常调用 setOption（不使用已 disposed 的旧实例）', () => {
        const option1 = { title: { text: '测试' } };
        const option2 = { title: { text: '更新' } };

        const { unmount } = render(<Echarts option={option1} />);
        unmount();
        mockSetOption.mockClear();
        mockInit.mockClear();

        // 重新挂载（新实例），不使用 rerender（rerender 在 unmount 后在 React 19 中会报错）
        expect(() => {
            render(<Echarts option={option2} />);
        }).not.toThrow();

        // 新实例应正常初始化并调用 setOption
        expect(mockInit).toHaveBeenCalledTimes(1);
        expect(mockSetOption).toHaveBeenCalledWith(option2, expect.any(Object));
    });
});
