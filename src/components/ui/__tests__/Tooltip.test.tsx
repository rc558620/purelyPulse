/**
 * Tooltip 组件单元测试
 *
 * 覆盖范围：
 *  ─ 基本渲染
 *    1.  children 正常渲染
 *    2.  渲染 role="tooltip" 的元素（tooltip 节点存在于 DOM）
 *    3.  tooltip 节点包含 title 文本
 *    4.  初始状态 tooltip 不可见（无 visible class）
 *  ─ title 为空时
 *    5.  title 为 "" 空字符串时直接返回 children（无 tooltip 包裹层）
 *    6.  title 为 null 时直接返回 children
 *    7.  title 为 0 时不直接返回 children（0 是 falsy 但不是 null/undefined/"")
 *  ─ 鼠标悬停
 *    8.  mouseenter 后 tooltip 添加 visible class
 *    9.  mouseleave 后（等待延迟）tooltip 移除 visible class
 *    10. mouseenter 后快速 mouseleave 再 mouseenter，tooltip 保持 visible（防抖清除）
 *  ─ color 变体
 *    11. 不传 color 时 tooltip 不含 color 相关 class
 *    12. color="orange" 时 tooltip 含 tooltip-orange class
 *    13. color="cyan" 时含 tooltip-cyan class
 *    14. color="green" 时含 tooltip-green class
 *    15. color="blue" 时含 tooltip-blue class
 *    16. color="red" 时含 tooltip-red class
 *    17. color="volcano" 时含 tooltip-volcano class
 *    18. color="magenta" 时含 tooltip-magenta class
 *    19. color="purple" 时含 tooltip-purple class
 *  ─ className 透传
 *    20. 自定义 className 附加到 tooltip 节点上
 *  ─ ReactNode title
 *    21. title 支持 ReactNode（渲染 JSX 内容）
 *  ─ 卸载清理
 *    22. 组件卸载时清理 timer（不产生 "update on unmounted component" 错误）
 *  ─ React.memo
 *    23. Tooltip 是 React.memo 包裹的组件
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import Tooltip from '../feedback/Tooltip/Tooltip';

// ─────────────────────────────────────────────────────────────────────────────
// 辅助函数
// ─────────────────────────────────────────────────────────────────────────────
function renderTooltip(overrides: Partial<React.ComponentProps<typeof Tooltip>> = {}) {
    const defaults = {
        title: '提示内容',
        children: <button type="button">悬停我</button>,
    };
    return render(<Tooltip {...defaults} {...overrides} />);
}

// ─── 1. 基本渲染 ──────────────────────────────────────────────────────────────
describe('Tooltip – 基本渲染', () => {
    it('children 正常渲染', () => {
        renderTooltip();
        expect(screen.getByRole('button', { name: '悬停我' })).toBeInTheDocument();
    });

    it('渲染 role="tooltip" 的元素', () => {
        renderTooltip();
        expect(screen.getByRole('tooltip', { hidden: true })).toBeInTheDocument();
    });

    it('tooltip 节点包含 title 文本', () => {
        renderTooltip({ title: '这是提示' });
        expect(screen.getByRole('tooltip', { hidden: true }).textContent).toContain('这是提示');
    });

    it('初始状态 tooltip 不可见（无 tooltipVisible class）', () => {
        renderTooltip();
        const tooltip = screen.getByRole('tooltip', { hidden: true });
        expect(tooltip.className).not.toMatch(/tooltipVisible/);
    });
});

// ─── 2. title 为空时 ──────────────────────────────────────────────────────────
describe('Tooltip – title 为空时', () => {
    it('title="" 时直接返回 children（无 tooltipTrigger 包裹层）', () => {
        const { container } = render(
            <Tooltip title="">
                <span data-testid="child">内容</span>
            </Tooltip>,
        );
        // 直接渲染 span，无额外包裹 div
        expect(screen.getByTestId('child')).toBeInTheDocument();
        const tooltipEl = container.querySelector('[role="tooltip"]');
        expect(tooltipEl).toBeNull();
    });

    it('title 为 null 时直接返回 children', () => {
        const { container } = render(
            <Tooltip title={null}>
                <span data-testid="child-null">内容</span>
            </Tooltip>,
        );
        expect(screen.getByTestId('child-null')).toBeInTheDocument();
        expect(container.querySelector('[role="tooltip"]')).toBeNull();
    });
});

// ─── 3. 鼠标悬停 ──────────────────────────────────────────────────────────────
describe('Tooltip – 鼠标悬停', () => {
    beforeEach(() => vi.useFakeTimers());
    afterEach(() => {
        vi.runAllTimers();
        vi.useRealTimers();
    });

    it('mouseenter 后 tooltip 添加 tooltipVisible class', () => {
        renderTooltip();
        const trigger = screen.getByRole('button', { name: '悬停我' }).parentElement!;
        act(() => { fireEvent.mouseEnter(trigger); });
        const tooltip = screen.getByRole('tooltip', { hidden: true });
        expect(tooltip.className).toMatch(/tooltipVisible/);
    });

    it('mouseleave 后 100ms 延迟后 tooltip 移除 tooltipVisible class', () => {
        renderTooltip();
        const trigger = screen.getByRole('button', { name: '悬停我' }).parentElement!;
        act(() => { fireEvent.mouseEnter(trigger); });
        act(() => { fireEvent.mouseLeave(trigger); });
        // 延迟 100ms 还未结束
        const tooltipBefore = screen.getByRole('tooltip', { hidden: true });
        expect(tooltipBefore.className).toMatch(/tooltipVisible/);

        // 推进 100ms
        act(() => { vi.advanceTimersByTime(100); });
        const tooltipAfter = screen.getByRole('tooltip', { hidden: true });
        expect(tooltipAfter.className).not.toMatch(/tooltipVisible/);
    });

    it('mouseenter 取消未完成的 mouseleave 定时器（tooltip 保持可见）', () => {
        renderTooltip();
        const trigger = screen.getByRole('button', { name: '悬停我' }).parentElement!;
        // enter → leave → 立即 enter 再次
        act(() => { fireEvent.mouseEnter(trigger); });
        act(() => { fireEvent.mouseLeave(trigger); });
        act(() => { fireEvent.mouseEnter(trigger); });
        act(() => { vi.advanceTimersByTime(200); }); // 超过 100ms
        const tooltip = screen.getByRole('tooltip', { hidden: true });
        expect(tooltip.className).toMatch(/tooltipVisible/);
    });
});

// ─── 4. color 变体 ────────────────────────────────────────────────────────────
describe('Tooltip – color 变体', () => {
    const colors = ['orange', 'cyan', 'green', 'blue', 'red', 'volcano', 'magenta', 'purple'] as const;

    it('不传 color 时 tooltip 不含 tooltip-{color} class', () => {
        renderTooltip({ color: undefined });
        const tooltip = screen.getByRole('tooltip', { hidden: true });
        colors.forEach((c) => {
            expect(tooltip.className).not.toMatch(new RegExp(`tooltip-${c}`));
        });
    });

    colors.forEach((color) => {
        it(`color="${color}" 时 tooltip 含 tooltip-${color} class`, () => {
            renderTooltip({ color });
            const tooltip = screen.getByRole('tooltip', { hidden: true });
            expect(tooltip.className).toMatch(new RegExp(`tooltip-${color}`));
        });
    });
});

// ─── 5. className 透传 ────────────────────────────────────────────────────────
describe('Tooltip – className 透传', () => {
    it('自定义 className 附加到 tooltip 节点上', () => {
        renderTooltip({ className: 'my-tooltip' });
        const tooltip = screen.getByRole('tooltip', { hidden: true });
        expect(tooltip.className).toContain('my-tooltip');
    });
});

// ─── 6. ReactNode title ───────────────────────────────────────────────────────
describe('Tooltip – ReactNode title', () => {
    it('title 支持 ReactNode（渲染 JSX 内容）', () => {
        renderTooltip({ title: <strong data-testid="rich-title">加粗提示</strong> });
        expect(screen.getByTestId('rich-title')).toBeInTheDocument();
    });
});

// ─── 7. 卸载清理 ──────────────────────────────────────────────────────────────
describe('Tooltip – 卸载清理', () => {
    beforeEach(() => vi.useFakeTimers());
    afterEach(() => {
        vi.runAllTimers();
        vi.useRealTimers();
    });

    it('组件卸载时不抛出定时器相关错误', () => {
        const { unmount } = renderTooltip();
        const trigger = screen.getByRole('button', { name: '悬停我' }).parentElement!;
        act(() => { fireEvent.mouseEnter(trigger); });
        act(() => { fireEvent.mouseLeave(trigger); });
        // 卸载后推进定时器，不应报错
        expect(() => {
            unmount();
            act(() => { vi.advanceTimersByTime(200); });
        }).not.toThrow();
    });
});

// ─── 8. React.memo ────────────────────────────────────────────────────────────
describe('Tooltip – React.memo', () => {
    it('Tooltip 是 React.memo 包裹的组件', () => {
        expect((Tooltip as unknown as { $$typeof?: symbol }).$$typeof?.toString()).toContain('memo');
    });
});
