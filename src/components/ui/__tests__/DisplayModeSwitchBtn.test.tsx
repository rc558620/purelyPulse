/**
 * DisplayModeSwitchBtn 组件单元测试
 *
 * 覆盖范围：
 *  ─ 基本渲染
 *    1.  渲染 button 元素
 *    2.  button type="button"
 *    3.  渲染 svg 图标（IconBars）
 *  ─ 三种模式 aria-label
 *    4.  displayMode="detailed" aria-label="切换简约模式"
 *    5.  displayMode="compact" aria-label="切换极简模式"
 *    6.  displayMode="minimal" aria-label="切换详细模式"
 *  ─ 三种模式 class
 *    7.  displayMode="detailed" 按钮不含 compact/minimal class
 *    8.  displayMode="compact" 按钮含 modeSwitchCompact class
 *    9.  displayMode="minimal" 按钮含 modeSwitchMinimal class
 *  ─ 三种模式 iconWrapper class
 *    10. displayMode="detailed" iconWrapper 不含 compact/minimal class
 *    11. displayMode="compact" iconWrapper 含 iconWrapperCompact class
 *    12. displayMode="minimal" iconWrapper 含 iconWrapperMinimal class
 *  ─ Tooltip 集成
 *    13. displayMode="detailed" 时 tooltip 文字包含"详细模式"
 *    14. displayMode="compact" 时 tooltip 文字包含"简约模式"
 *    15. displayMode="minimal" 时 tooltip 文字包含"极简模式"
 *  ─ 点击事件
 *    16. 点击触发 onCycleDisplayMode
 *    17. 点击只触发一次
 *  ─ className 透传
 *    18. className 附加到 button
 *  ─ React.memo
 *    19. DisplayModeSwitchBtn 是 React.memo 包裹的组件
 */

import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import DisplayModeSwitchBtn from '../action/DisplayModeSwitchBtn/DisplayModeSwitchBtn';
import type { DisplayMode } from '@hooks/useDisplayMode';

// ─────────────────────────────────────────────────────────────────────────────
// 辅助函数
// ─────────────────────────────────────────────────────────────────────────────
function renderBtn(
    displayMode: DisplayMode = 'detailed',
    overrides: Partial<React.ComponentProps<typeof DisplayModeSwitchBtn>> = {},
) {
    const defaults = { displayMode, onCycleDisplayMode: vi.fn() };
    return render(<DisplayModeSwitchBtn {...defaults} {...overrides} />);
}

// ─── 1. 基本渲染 ──────────────────────────────────────────────────────────────
describe('DisplayModeSwitchBtn – 基本渲染', () => {
    it('渲染 button 元素', () => {
        renderBtn();
        expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('button type="button"', () => {
        renderBtn();
        expect(screen.getByRole('button')).toHaveAttribute('type', 'button');
    });

    it('渲染 svg 图标（IconBars）', () => {
        const { container } = renderBtn();
        expect(container.querySelector('svg')).toBeInTheDocument();
    });
});

// ─── 2. 三种模式 aria-label ──────────────────────────────────────────────────
describe('DisplayModeSwitchBtn – aria-label', () => {
    it('displayMode="detailed" aria-label="切换简约模式"', () => {
        renderBtn('detailed');
        expect(screen.getByRole('button', { name: '切换简约模式' })).toBeInTheDocument();
    });

    it('displayMode="compact" aria-label="切换极简模式"', () => {
        renderBtn('compact');
        expect(screen.getByRole('button', { name: '切换极简模式' })).toBeInTheDocument();
    });

    it('displayMode="minimal" aria-label="切换详细模式"', () => {
        renderBtn('minimal');
        expect(screen.getByRole('button', { name: '切换详细模式' })).toBeInTheDocument();
    });
});

// ─── 3. 三种模式按钮 class ───────────────────────────────────────────────────
describe('DisplayModeSwitchBtn – 按钮 class', () => {
    it('displayMode="detailed" 按钮不含 compact/minimal class', () => {
        renderBtn('detailed');
        const btn = screen.getByRole('button');
        expect(btn.className).not.toMatch(/modeSwitchCompact/);
        expect(btn.className).not.toMatch(/modeSwitchMinimal/);
    });

    it('displayMode="compact" 按钮含 modeSwitchCompact class', () => {
        renderBtn('compact');
        expect(screen.getByRole('button').className).toMatch(/modeSwitchCompact/);
    });

    it('displayMode="minimal" 按钮含 modeSwitchMinimal class', () => {
        renderBtn('minimal');
        expect(screen.getByRole('button').className).toMatch(/modeSwitchMinimal/);
    });
});

// ─── 4. 三种模式 iconWrapper class ──────────────────────────────────────────
describe('DisplayModeSwitchBtn – iconWrapper class', () => {
    it('displayMode="detailed" iconWrapper 不含 compact/minimal class', () => {
        const { container } = renderBtn('detailed');
        const iconWrapper = container.querySelector('[class*="iconWrapper"]');
        expect(iconWrapper).toBeInTheDocument();
        expect(iconWrapper!.className).not.toMatch(/Compact/);
        expect(iconWrapper!.className).not.toMatch(/Minimal/);
    });

    it('displayMode="compact" iconWrapper 含 iconWrapperCompact class', () => {
        const { container } = renderBtn('compact');
        const iconWrapper = container.querySelector('[class*="iconWrapper"]');
        expect(iconWrapper!.className).toMatch(/iconWrapperCompact/);
    });

    it('displayMode="minimal" iconWrapper 含 iconWrapperMinimal class', () => {
        const { container } = renderBtn('minimal');
        const iconWrapper = container.querySelector('[class*="iconWrapper"]');
        expect(iconWrapper!.className).toMatch(/iconWrapperMinimal/);
    });
});

// ─── 5. Tooltip 集成 ─────────────────────────────────────────────────────────
describe('DisplayModeSwitchBtn – Tooltip', () => {
    it('displayMode="detailed" 时 tooltip 文字包含"详细模式"', () => {
        const { container } = renderBtn('detailed');
        const tooltip = container.querySelector('[role="tooltip"]');
        expect(tooltip).toBeInTheDocument();
        expect(tooltip!.textContent).toContain('详细模式');
    });

    it('displayMode="compact" 时 tooltip 文字包含"简约模式"', () => {
        const { container } = renderBtn('compact');
        const tooltip = container.querySelector('[role="tooltip"]');
        expect(tooltip!.textContent).toContain('简约模式');
    });

    it('displayMode="minimal" 时 tooltip 文字包含"极简模式"', () => {
        const { container } = renderBtn('minimal');
        const tooltip = container.querySelector('[role="tooltip"]');
        expect(tooltip!.textContent).toContain('极简模式');
    });
});

// ─── 6. 点击事件 ──────────────────────────────────────────────────────────────
describe('DisplayModeSwitchBtn – 点击事件', () => {
    it('点击触发 onCycleDisplayMode', async () => {
        const user = userEvent.setup();
        const onCycle = vi.fn();
        renderBtn('detailed', { onCycleDisplayMode: onCycle });
        await user.click(screen.getByRole('button'));
        expect(onCycle).toHaveBeenCalledTimes(1);
    });

    it('每次点击只触发一次', async () => {
        const user = userEvent.setup();
        const onCycle = vi.fn();
        renderBtn('compact', { onCycleDisplayMode: onCycle });
        await user.click(screen.getByRole('button'));
        await user.click(screen.getByRole('button'));
        expect(onCycle).toHaveBeenCalledTimes(2);
    });
});

// ─── 7. className 透传 ────────────────────────────────────────────────────────
describe('DisplayModeSwitchBtn – className 透传', () => {
    it('className 附加到 button', () => {
        renderBtn('detailed', { className: 'extra-btn' });
        expect(screen.getByRole('button').className).toContain('extra-btn');
    });
});

// ─── 8. React.memo ────────────────────────────────────────────────────────────
describe('DisplayModeSwitchBtn – React.memo', () => {
    it('DisplayModeSwitchBtn 是 React.memo 包裹的组件', () => {
        expect((DisplayModeSwitchBtn as unknown as { $$typeof?: symbol }).$$typeof?.toString()).toContain('memo');
    });
});
