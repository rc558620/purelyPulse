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
 *    8.  setOption 的 notMerge=false, lazyUpdate=true
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

import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, act } from '@testing-library/react';
import Echarts from '../Echarts/Echarts';

// ─────────────────────────────────────────────────────────────────────────────
// mock echarts
// ─────────────────────────────────────────────────────────────────────────────
const mockSetOption = vi.fn();
const mockResize = vi.fn();
const mockDispose = vi.fn();

const mockChartInstance = {
    setOption: mockSetOption,
    resize: mockResize,
    dispose: mockDispose,
};

const mockInit = vi.fn(() => mockChartInstance);

vi.mock('echarts', () => ({
    init: (...args: unknown[]) => mockInit(...args),
}));

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
const OriginalResizeObserver = global.ResizeObserver;

beforeEach(() => {
    global.ResizeObserver = MockResizeObserver as unknown as typeof ResizeObserver;
    mockSetOption.mockClear();
    mockResize.mockClear();
    mockDispose.mockClear();
    mockInit.mockClear();
    mockObserve.mockClear();
    mockDisconnect.mockClear();
    capturedObserveCallback = null;
    capturedObserveTarget = null;
    // 重置 init 返回值（每次测试返回新的 instance 引用）
    mockInit.mockReturnValue(mockChartInstance);
});

afterEach(() => {
    global.ResizeObserver = OriginalResizeObserver;
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

    it('挂载后立即调用 setOption(option, ...)', () => {
        const option = { title: { text: '测试图表' } };
        render(<Echarts option={option} />);
        expect(mockSetOption).toHaveBeenCalledWith(
            option,
            expect.objectContaining({ notMerge: false, lazyUpdate: true }),
        );
    });

    it('setOption 使用 notMerge=false', () => {
        render(<Echarts option={{ xAxis: {} }} />);
        const callArgs = mockSetOption.mock.calls[0];
        expect(callArgs[1]).toHaveProperty('notMerge', false);
    });

    it('setOption 使用 lazyUpdate=true', () => {
        render(<Echarts option={{ yAxis: {} }} />);
        const callArgs = mockSetOption.mock.calls[0];
        expect(callArgs[1]).toHaveProperty('lazyUpdate', true);
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

        // 传入同一引用
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

    it('触发 resize callback 时 chartInstance.resize() 被调用', () => {
        render(<Echarts option={{}} />);
        expect(capturedObserveCallback).not.toBeNull();

        act(() => {
            capturedObserveCallback?.();
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
        // 还原后应该和原始相同（组件内 init 后立即还原）
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
            xAxis: { type: 'category', data: ['Mon', 'Tue', 'Wed'] },
            yAxis: { type: 'value' },
            series: [{ data: [150, 230, 224], type: 'line' }],
        };
        expect(() => {
            render(<Echarts option={option} />);
        }).not.toThrow();
        expect(mockSetOption).toHaveBeenCalledWith(option, expect.any(Object));
    });

    it('含 tooltip 的 option 正常 setOption', () => {
        const option = {
            tooltip: { trigger: 'axis' },
            legend: { data: ['销售额'] },
        };
        render(<Echarts option={option} />);
        expect(mockSetOption).toHaveBeenCalledWith(option, expect.any(Object));
    });
});
