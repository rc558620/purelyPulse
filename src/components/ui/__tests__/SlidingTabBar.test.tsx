/**
 * SlidingTabBar 组件单元测试
 *
 * 覆盖范围：
 *  ─ 基本渲染
 *    1.  渲染 role="tablist" 容器
 *    2.  渲染 options.length 个 tab 按钮
 *    3.  每个按钮有 role="tab"
 *    4.  按钮文字与 option.label 一致
 *    5.  button type="button"
 *  ─ 选中态
 *    6.  value 匹配的按钮含激活 class
 *    7.  value 匹配的按钮 aria-selected="true"
 *    8.  未匹配的按钮 aria-selected="false"
 *  ─ 点击切换
 *    9.  点击某 tab 调用 onChange(opt.value)
 *    10. 点击只触发一次
 *  ─ variant 样式
 *    11. variant="pill" 容器含 pillContainer class
 *    12. variant="segment" 容器含 segmentContainer class
 *    13. variant="primary" 容器含 primaryContainer class
 *    14. variant="pill" 按钮含 pillBtn class
 *    15. variant="segment" 按钮含 segmentBtn class
 *    16. variant="primary" 按钮含 primaryBtn class
 *  ─ dimmed
 *    17. dimmed=true 时容器含 dimmed class
 *    18. dimmed=true 时所有按钮 aria-selected="false"
 *    19. dimmed=false（默认）时不含 dimmed class
 *  ─ renderLabel
 *    20. 传入 renderLabel 时使用自定义渲染
 *    21. renderLabel 接收 opt 和 isActive 参数
 *  ─ className / btnClassName / ariaLabel
 *    22. className 附加到容器
 *    23. btnClassName 附加到每个按钮
 *    24. ariaLabel 设置到 tablist 的 aria-label
 *  ─ React.memo
 *    25. SlidingTabBar 是 React.memo 包裹的组件
 */

import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SlidingTabBar from '../filter/SlidingTabBar/SlidingTabBar';
import type { SlidingTabOption } from '../filter/SlidingTabBar/SlidingTabBar';

// ─────────────────────────────────────────────────────────────────────────────
// mock usePeriodTabIndicator：在 JSDOM 中无法真实测量 tab 宽度/位置
// ─────────────────────────────────────────────────────────────────────────────
vi.mock('@hooks/usePeriodTabIndicator', () => ({
    usePeriodTabIndicator: () => ({
        setTabRef: () => () => { /* noop */ },
        indicatorStyle: {},
        containerStyle: {},
    }),
}));

// ─────────────────────────────────────────────────────────────────────────────
// 测试数据
// ─────────────────────────────────────────────────────────────────────────────
type TabVal = 'day' | 'week' | 'month';
const OPTIONS: SlidingTabOption<TabVal>[] = [
    { value: 'day', label: '日' },
    { value: 'week', label: '周' },
    { value: 'month', label: '月' },
];

function renderTab(overrides: Partial<React.ComponentProps<typeof SlidingTabBar<TabVal>>> = {}) {
    const defaults = {
        options: OPTIONS,
        value: 'day' as TabVal,
        onChange: vi.fn(),
    };
    return render(<SlidingTabBar {...defaults} {...overrides} />);
}

// ─── 1. 基本渲染 ──────────────────────────────────────────────────────────────
describe('SlidingTabBar – 基本渲染', () => {
    it('渲染 role="tablist" 容器', () => {
        renderTab();
        expect(screen.getByRole('tablist')).toBeInTheDocument();
    });

    it('渲染 options.length 个 tab 按钮', () => {
        renderTab();
        expect(screen.getAllByRole('tab')).toHaveLength(OPTIONS.length);
    });

    it('每个按钮有 role="tab"', () => {
        renderTab();
        screen.getAllByRole('tab').forEach((btn) => {
            expect(btn).toHaveAttribute('role', 'tab');
        });
    });

    it('按钮文字与 option.label 一致', () => {
        renderTab();
        OPTIONS.forEach((opt) => {
            expect(screen.getByRole('tab', { name: opt.label })).toBeInTheDocument();
        });
    });

    it('button type="button"', () => {
        renderTab();
        screen.getAllByRole('tab').forEach((btn) => {
            expect(btn).toHaveAttribute('type', 'button');
        });
    });
});

// ─── 2. 选中态 ────────────────────────────────────────────────────────────────
describe('SlidingTabBar – 选中态', () => {
    it('value 匹配的按钮含激活 class（pill 默认）', () => {
        renderTab({ value: 'week' });
        const weekBtn = screen.getByRole('tab', { name: '周' });
        expect(weekBtn.className).toMatch(/pillBtnActive/);
    });

    it('value 匹配的按钮 aria-selected="true"', () => {
        renderTab({ value: 'day' });
        expect(screen.getByRole('tab', { name: '日' })).toHaveAttribute('aria-selected', 'true');
    });

    it('未匹配的按钮 aria-selected="false"', () => {
        renderTab({ value: 'day' });
        ['周', '月'].forEach((label) => {
            expect(screen.getByRole('tab', { name: label })).toHaveAttribute('aria-selected', 'false');
        });
    });
});

// ─── 3. 点击切换 ──────────────────────────────────────────────────────────────
describe('SlidingTabBar – 点击切换', () => {
    it('点击某 tab 调用 onChange(opt.value)', async () => {
        const user = userEvent.setup();
        const onChange = vi.fn();
        renderTab({ onChange });
        await user.click(screen.getByRole('tab', { name: '月' }));
        expect(onChange).toHaveBeenCalledWith('month');
    });

    it('点击只触发一次', async () => {
        const user = userEvent.setup();
        const onChange = vi.fn();
        renderTab({ onChange });
        await user.click(screen.getByRole('tab', { name: '周' }));
        expect(onChange).toHaveBeenCalledTimes(1);
    });
});

// ─── 4. variant 样式 ──────────────────────────────────────────────────────────
describe('SlidingTabBar – variant 样式', () => {
    it('variant="pill" 容器含 pillContainer class', () => {
        renderTab({ variant: 'pill' });
        expect(screen.getByRole('tablist').className).toMatch(/pillContainer/);
    });

    it('variant="segment" 容器含 segmentContainer class', () => {
        renderTab({ variant: 'segment' });
        expect(screen.getByRole('tablist').className).toMatch(/segmentContainer/);
    });

    it('variant="primary" 容器含 primaryContainer class', () => {
        renderTab({ variant: 'primary' });
        expect(screen.getByRole('tablist').className).toMatch(/primaryContainer/);
    });

    it('variant="pill" 按钮含 pillBtn class', () => {
        renderTab({ variant: 'pill' });
        screen.getAllByRole('tab').forEach((btn) => {
            expect(btn.className).toMatch(/pillBtn/);
        });
    });

    it('variant="segment" 按钮含 segmentBtn class', () => {
        renderTab({ variant: 'segment' });
        screen.getAllByRole('tab').forEach((btn) => {
            expect(btn.className).toMatch(/segmentBtn/);
        });
    });

    it('variant="primary" 按钮含 primaryBtn class', () => {
        renderTab({ variant: 'primary' });
        screen.getAllByRole('tab').forEach((btn) => {
            expect(btn.className).toMatch(/primaryBtn/);
        });
    });
});

// ─── 5. dimmed ────────────────────────────────────────────────────────────────
describe('SlidingTabBar – dimmed', () => {
    it('dimmed=true 时容器含 dimmed class', () => {
        renderTab({ dimmed: true });
        expect(screen.getByRole('tablist').className).toMatch(/dimmed/);
    });

    it('dimmed=true 时所有按钮 aria-selected="false"（不管 value）', () => {
        renderTab({ dimmed: true, value: 'day' });
        screen.getAllByRole('tab').forEach((btn) => {
            expect(btn).toHaveAttribute('aria-selected', 'false');
        });
    });

    it('dimmed=false（默认）时容器不含 dimmed class', () => {
        renderTab({ dimmed: false });
        expect(screen.getByRole('tablist').className).not.toMatch(/dimmed/);
    });
});

// ─── 6. renderLabel ───────────────────────────────────────────────────────────
describe('SlidingTabBar – renderLabel', () => {
    it('传入 renderLabel 时使用自定义渲染', () => {
        renderTab({
            renderLabel: (opt) => <span data-testid={`label-${opt.value}`}>{opt.label}-custom</span>,
        });
        expect(screen.getByTestId('label-day')).toBeInTheDocument();
        expect(screen.getByTestId('label-day').textContent).toBe('日-custom');
    });

    it('renderLabel 接收 isActive 参数', () => {
        renderTab({
            value: 'week',
            renderLabel: (opt, isActive) => (
                <span data-testid={`active-${opt.value}`} data-active={String(isActive)} />
            ),
        });
        expect(screen.getByTestId('active-week')).toHaveAttribute('data-active', 'true');
        expect(screen.getByTestId('active-day')).toHaveAttribute('data-active', 'false');
    });
});

// ─── 7. className / btnClassName / ariaLabel ─────────────────────────────────
describe('SlidingTabBar – className / btnClassName / ariaLabel', () => {
    it('className 附加到容器 tablist', () => {
        renderTab({ className: 'my-tab' });
        expect(screen.getByRole('tablist').className).toContain('my-tab');
    });

    it('btnClassName 附加到每个 tab 按钮', () => {
        renderTab({ btnClassName: 'custom-btn' });
        screen.getAllByRole('tab').forEach((btn) => {
            expect(btn.className).toContain('custom-btn');
        });
    });

    it('ariaLabel 设置到 tablist 的 aria-label', () => {
        renderTab({ ariaLabel: '时间段选择' });
        expect(screen.getByRole('tablist')).toHaveAttribute('aria-label', '时间段选择');
    });
});

// ─── 8. React.memo ────────────────────────────────────────────────────────────
describe('SlidingTabBar – React.memo', () => {
    it('SlidingTabBar 是 React.memo 包裹的组件', () => {
        expect((SlidingTabBar as unknown as { $$typeof?: symbol }).$$typeof?.toString()).toContain('memo');
    });
});
