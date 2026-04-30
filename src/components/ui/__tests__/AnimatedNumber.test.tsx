/**
 * AnimatedNumber 组件单元测试
 *
 * 覆盖范围：
 *  ─ 基本渲染
 *    1.  渲染外层 span 容器
 *    2.  初始时渲染 value 内容
 *    3.  初始只有一个 numberItem span
 *    4.  value 可以是字符串
 *    5.  value 可以是数字（ReactNode）
 *    6.  value 可以是 JSX 节点
 *  ─ className 透传
 *    7.  自定义 className 附加到外层 span 上
 *  ─ triggerKey 变化（动画触发）
 *    8.  triggerKey 变化后出现两个 numberItem span（旧值和新值）
 *    9.  新值内容正确渲染
 *    10. 旧 item 具有 aria-hidden="true"（slideOut 状态）
 *    11. 新 item aria-hidden="false"
 *    12. 500ms 后旧 item 被清理（只剩一个 numberItem）
 *  ─ 同一 triggerKey 下 value 变化
 *    13. 不更改 triggerKey 仅改 value 时，不触发双 item 状态（直接更新，无动画）
 *    14. 直接更新时显示新 value
 *  ─ 多次 triggerKey 变化
 *    15. 多次变化后最多同时存在两个 item
 *  ─ 无障碍
 *    16. 初始 item aria-hidden="false"
 */

import React, { act } from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import AnimatedNumber from '../data-display/AnimatedNumber/AnimatedNumber';

// ─────────────────────────────────────────────────────────────────────────────
// 辅助函数
// ─────────────────────────────────────────────────────────────────────────────
function renderAnimated(props: React.ComponentProps<typeof AnimatedNumber>) {
    return render(<AnimatedNumber {...props} />);
}

// ─── 1. 基本渲染 ──────────────────────────────────────────────────────────────
describe('AnimatedNumber – 基本渲染', () => {
    it('渲染外层 span 容器', () => {
        const { container } = renderAnimated({ value: '100', triggerKey: 'k1' });
        expect(container.querySelector('span')).toBeInTheDocument();
    });

    it('初始时渲染 value 内容（字符串）', () => {
        renderAnimated({ value: '¥1,234', triggerKey: 'k1' });
        expect(screen.getByText('¥1,234')).toBeInTheDocument();
    });

    it('初始时渲染 value 内容（数字）', () => {
        renderAnimated({ value: 42, triggerKey: 'k1' });
        expect(screen.getByText('42')).toBeInTheDocument();
    });

    it('value 可以是 JSX 节点', () => {
        renderAnimated({
            value: <strong data-testid="rich-val">富文本</strong>,
            triggerKey: 'k1',
        });
        expect(screen.getByTestId('rich-val')).toBeInTheDocument();
    });

    it('初始只有一个 numberItem span', () => {
        const { container } = renderAnimated({ value: '100', triggerKey: 'k1' });
        // numberItem spans（外层 span 的子元素）
        const outerSpan = container.querySelector('span');
        const items = Array.from(outerSpan!.children).filter(
            (el) => el.tagName === 'SPAN',
        );
        expect(items).toHaveLength(1);
    });
});

// ─── 2. className 透传 ────────────────────────────────────────────────────────
describe('AnimatedNumber – className 透传', () => {
    it('自定义 className 附加到外层 span 上', () => {
        const { container } = renderAnimated({ value: '100', triggerKey: 'k1', className: 'my-anim' });
        const outerSpan = container.querySelector('span');
        expect(outerSpan!.className).toContain('my-anim');
    });
});

// ─── 3. triggerKey 变化（动画触发） ──────────────────────────────────────────
describe('AnimatedNumber – triggerKey 变化', () => {
    beforeEach(() => vi.useFakeTimers());
    afterEach(() => { vi.runAllTimers(); vi.useRealTimers(); });

    it('triggerKey 变化后出现两个 numberItem span', () => {
        const { container, rerender } = renderAnimated({ value: '100', triggerKey: 'k1' });
        act(() => {
            rerender(<AnimatedNumber value="200" triggerKey="k2" />);
        });
        const outerSpan = container.querySelector('span')!;
        const items = Array.from(outerSpan.children).filter((el) => el.tagName === 'SPAN');
        expect(items).toHaveLength(2);
    });

    it('triggerKey 变化后新值内容正确渲染', () => {
        const { rerender } = renderAnimated({ value: '100', triggerKey: 'k1' });
        act(() => {
            rerender(<AnimatedNumber value="999" triggerKey="k2" />);
        });
        expect(screen.getByText('999')).toBeInTheDocument();
    });

    it('triggerKey 变化后旧 item 具有 aria-hidden="true"', () => {
        const { container, rerender } = renderAnimated({ value: '100', triggerKey: 'k1' });
        act(() => {
            rerender(<AnimatedNumber value="200" triggerKey="k2" />);
        });
        const outerSpan = container.querySelector('span')!;
        const spans = Array.from(outerSpan.children).filter((el) => el.tagName === 'SPAN') as HTMLElement[];
        // 第一个 span 是旧值
        expect(spans[0].getAttribute('aria-hidden')).toBe('true');
    });

    it('triggerKey 变化后新 item aria-hidden="false"', () => {
        const { container, rerender } = renderAnimated({ value: '100', triggerKey: 'k1' });
        act(() => {
            rerender(<AnimatedNumber value="200" triggerKey="k2" />);
        });
        const outerSpan = container.querySelector('span')!;
        const spans = Array.from(outerSpan.children).filter((el) => el.tagName === 'SPAN') as HTMLElement[];
        // 第二个 span 是新值
        expect(spans[1].getAttribute('aria-hidden')).toBe('false');
    });

    it('500ms 后旧 item 被清理（只剩一个 numberItem）', () => {
        const { container, rerender } = renderAnimated({ value: '100', triggerKey: 'k1' });
        act(() => {
            rerender(<AnimatedNumber value="200" triggerKey="k2" />);
        });
        act(() => { vi.advanceTimersByTime(600); });
        const outerSpan = container.querySelector('span')!;
        const items = Array.from(outerSpan.children).filter((el) => el.tagName === 'SPAN');
        expect(items).toHaveLength(1);
    });

    it('500ms 后显示新值', () => {
        const { rerender } = renderAnimated({ value: '100', triggerKey: 'k1' });
        act(() => {
            rerender(<AnimatedNumber value="200" triggerKey="k2" />);
        });
        act(() => { vi.advanceTimersByTime(600); });
        expect(screen.getByText('200')).toBeInTheDocument();
        expect(screen.queryByText('100')).toBeNull();
    });
});

// ─── 4. 同一 triggerKey 下 value 变化 ────────────────────────────────────────
describe('AnimatedNumber – 同一 triggerKey 下 value 变化', () => {
    beforeEach(() => vi.useFakeTimers());
    afterEach(() => { vi.runAllTimers(); vi.useRealTimers(); });

    it('相同 triggerKey 仅改 value 时，保持单个 numberItem（无动画）', () => {
        const { container, rerender } = renderAnimated({ value: 'A', triggerKey: 'same' });
        act(() => {
            rerender(<AnimatedNumber value="B" triggerKey="same" />);
        });
        const outerSpan = container.querySelector('span')!;
        const items = Array.from(outerSpan.children).filter((el) => el.tagName === 'SPAN');
        expect(items).toHaveLength(1);
    });

    it('相同 triggerKey 改 value 时显示新 value', () => {
        const { rerender } = renderAnimated({ value: 'OldVal', triggerKey: 'same' });
        act(() => {
            rerender(<AnimatedNumber value="NewVal" triggerKey="same" />);
        });
        expect(screen.getByText('NewVal')).toBeInTheDocument();
        expect(screen.queryByText('OldVal')).toBeNull();
    });
});

// ─── 5. 多次 triggerKey 变化 ─────────────────────────────────────────────────
describe('AnimatedNumber – 多次 triggerKey 变化', () => {
    beforeEach(() => vi.useFakeTimers());
    afterEach(() => { vi.runAllTimers(); vi.useRealTimers(); });

    it('多次变化时最多同时存在 2 个 item', () => {
        const { container, rerender } = renderAnimated({ value: '1', triggerKey: 'k1' });
        act(() => { rerender(<AnimatedNumber value="2" triggerKey="k2" />); });
        act(() => { rerender(<AnimatedNumber value="3" triggerKey="k3" />); });

        const outerSpan = container.querySelector('span')!;
        const items = Array.from(outerSpan.children).filter((el) => el.tagName === 'SPAN');
        expect(items.length).toBeLessThanOrEqual(2);
    });
});

// ─── 6. 无障碍 ────────────────────────────────────────────────────────────────
describe('AnimatedNumber – 无障碍', () => {
    it('初始 item aria-hidden="false"', () => {
        const { container } = renderAnimated({ value: '100', triggerKey: 'k1' });
        const outerSpan = container.querySelector('span')!;
        const items = Array.from(outerSpan.children).filter(
            (el) => el.tagName === 'SPAN',
        ) as HTMLElement[];
        expect(items[0].getAttribute('aria-hidden')).toBe('false');
    });
});
