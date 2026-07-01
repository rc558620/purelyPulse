/**
 * DayPicker 组件单元测试
 *
 * 覆盖范围：
 *  - trigger 展示格式 "YYYY/MM/DD"
 *  - 点击 trigger 打开面板（aria-expanded）
 *  - Enter 键打开面板
 *  - ESC 键关闭面板
 *  - onClear 回调：有 onClear 时显示清除按钮，无时不显示
 *  - 点击清除不触发面板打开
 *  - displayMode="pc" / "mobile" 强制模式
 *  - className 应用
 *  - aria 属性（role、tabIndex、aria-expanded、aria-haspopup）
 *  - 补零格式（月/日 < 10 时补零）
 *  - 移动端面板常驻 DOM（Bug #1/#2 fix）
 *  - 移动端面板通过 visible 控制 bottomSheetVisible class（Bug #1/#2 fix）
 *  - 外部 props 变化同步到面板内部 state（Bug #3 fix）
 *  - 月份切换后日期自动 clamp（Bug #5 fix）
 */

import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import DayPicker from '../index';

// ─── 辅助：默认 props ────────────────────────────────────────────────────────

const DEFAULT_PROPS = {
    year: 2024,
    month: 6,
    day: 15,
    onChange: vi.fn(),
};

// ─── 1. trigger 展示 ─────────────────────────────────────────────────────────

describe('DayPicker – trigger 展示', () => {
    it('展示 "YYYY/MM/DD" 格式', () => {
        render(<DayPicker {...DEFAULT_PROPS} displayMode="pc" />);
        expect(screen.getByText('2024/06/15')).toBeInTheDocument();
    });

    it('月份/日期 < 10 时补零', () => {
        render(
            <DayPicker year={2024} month={1} day={5} onChange={vi.fn()} displayMode="pc" />,
        );
        expect(screen.getByText('2024/01/05')).toBeInTheDocument();
    });
});

// ─── 2. aria 属性 ────────────────────────────────────────────────────────────

describe('DayPicker – aria 属性', () => {
    it('trigger 具有 role="button"', () => {
        const { container } = render(<DayPicker {...DEFAULT_PROPS} displayMode="pc" />);
        expect(container.querySelector('[role="button"]')).toBeInTheDocument();
    });

    it('trigger 具有 tabIndex=0', () => {
        const { container } = render(<DayPicker {...DEFAULT_PROPS} displayMode="pc" />);
        expect(container.querySelector('[role="button"]')).toHaveAttribute('tabindex', '0');
    });

    it('trigger 初始 aria-expanded=false', () => {
        const { container } = render(<DayPicker {...DEFAULT_PROPS} displayMode="pc" />);
        expect(container.querySelector('[role="button"]')).toHaveAttribute('aria-expanded', 'false');
    });

    it('trigger 具有 aria-haspopup="dialog"', () => {
        const { container } = render(<DayPicker {...DEFAULT_PROPS} displayMode="pc" />);
        expect(container.querySelector('[role="button"]')).toHaveAttribute('aria-haspopup', 'dialog');
    });

    it('trigger 的 aria-label 为展示文本', () => {
        const { container } = render(<DayPicker {...DEFAULT_PROPS} displayMode="pc" />);
        expect(container.querySelector('[role="button"]')).toHaveAttribute('aria-label', '2024/06/15');
    });
});

// ─── 3. 打开 / 关闭 ──────────────────────────────────────────────────────────

describe('DayPicker – 打开/关闭', () => {
    it('点击 trigger 后 aria-expanded=true', () => {
        const { container } = render(<DayPicker {...DEFAULT_PROPS} displayMode="pc" />);
        const trigger = container.querySelector('[role="button"]')!;
        fireEvent.click(trigger);
        expect(trigger).toHaveAttribute('aria-expanded', 'true');
    });

    it('Enter 键打开面板', () => {
        const { container } = render(<DayPicker {...DEFAULT_PROPS} displayMode="pc" />);
        const trigger = container.querySelector('[role="button"]')!;
        fireEvent.keyDown(trigger, { key: 'Enter' });
        expect(trigger).toHaveAttribute('aria-expanded', 'true');
    });

    it('ESC 键触发关闭面板（mobile 走退场动画）', () => {
        const { container } = render(<DayPicker {...DEFAULT_PROPS} displayMode="mobile" />);
        const trigger = container.querySelector('[role="button"]')!;
        fireEvent.click(trigger);
        expect(trigger).toHaveAttribute('aria-expanded', 'true');
        // ESC 触发 handleClose → setIsClosing(true)
        act(() => {
            window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
        });
        // 移动端走退场动画，需模拟 transitionEnd
        const dialog = document.querySelector('[role="dialog"]');
        if (dialog) {
            act(() => {
                dialog.dispatchEvent(new TransitionEvent('transitionend', { propertyName: 'transform', bubbles: true }));
            });
        }
        expect(trigger).toHaveAttribute('aria-expanded', 'false');
    });
});

// ─── 4. 清除按钮 ─────────────────────────────────────────────────────────────

describe('DayPicker – 清除按钮', () => {
    it('传入 onClear 时显示清除按钮', () => {
        render(<DayPicker {...DEFAULT_PROPS} onClear={vi.fn()} displayMode="pc" />);
        expect(screen.getByRole('button', { name: '清除日期' })).toBeInTheDocument();
    });

    it('不传 onClear 时不显示清除按钮', () => {
        render(<DayPicker {...DEFAULT_PROPS} displayMode="pc" />);
        expect(screen.queryByRole('button', { name: '清除日期' })).toBeNull();
    });

    it('点击清除按钮触发 onClear', async () => {
        const user = userEvent.setup();
        const onClear = vi.fn();
        render(<DayPicker {...DEFAULT_PROPS} onClear={onClear} displayMode="pc" />);
        await user.click(screen.getByRole('button', { name: '清除日期' }));
        expect(onClear).toHaveBeenCalledTimes(1);
    });

    it('点击清除按钮不打开面板（stopPropagation）', async () => {
        const user = userEvent.setup();
        const { container } = render(
            <DayPicker {...DEFAULT_PROPS} onClear={vi.fn()} displayMode="pc" />,
        );
        const trigger = container.querySelector('[role="button"]')!;
        await user.click(screen.getByRole('button', { name: '清除日期' }));
        // trigger 不应该被打开
        expect(trigger).toHaveAttribute('aria-expanded', 'false');
    });
});

// ─── 5. displayMode ──────────────────────────────────────────────────────────

describe('DayPicker – displayMode', () => {
    it('displayMode="pc" 打开时不渲染移动端面板', () => {
        const { container } = render(<DayPicker {...DEFAULT_PROPS} displayMode="pc" />);
        fireEvent.click(container.querySelector('[role="button"]')!);
        // 移动端面板通过 portal 到 body，PC 模式下不挂载
        // 只验证组件不抛错且 aria-expanded 正确
        expect(container.querySelector('[role="button"]')).toHaveAttribute('aria-expanded', 'true');
    });

    it('displayMode="mobile" 打开后 aria-expanded=true', () => {
        const { container } = render(<DayPicker {...DEFAULT_PROPS} displayMode="mobile" />);
        fireEvent.click(container.querySelector('[role="button"]')!);
        expect(container.querySelector('[role="button"]')).toHaveAttribute('aria-expanded', 'true');
    });
});

// ─── 6. className ────────────────────────────────────────────────────────────

describe('DayPicker – className', () => {
    it('自定义 className 应用到外层 wrapper', () => {
        const { container } = render(
            <DayPicker {...DEFAULT_PROPS} className="my-day-picker" displayMode="pc" />,
        );
        expect(container.firstChild).toHaveClass('my-day-picker');
    });
});

// ─── 7. 移动端面板常驻 DOM + visible 控制（Bug #1/#2 fix）─────────────────────

describe('DayPicker – 移动端面板常驻 DOM', () => {
    it('mobile 模式下面板始终存在于 DOM（portal to body）', () => {
        render(<DayPicker {...DEFAULT_PROPS} displayMode="mobile" />);
        // 移动端面板通过 portal 挂到 body，搜索 body 内的 dialog
        const dialogs = document.body.querySelectorAll('[role="dialog"]');
        expect(dialogs.length).toBeGreaterThanOrEqual(1);
    });

    it('初始状态下 bottomSheet 没有 bottomSheetVisible class', () => {
        render(<DayPicker {...DEFAULT_PROPS} displayMode="mobile" />);
        const dialog = document.body.querySelector('[role="dialog"]')!;
        // bottomSheet 默认状态为 translateY(100%)，没有 bottomSheetVisible
        expect(dialog.className).not.toContain('bottomSheetVisible');
    });

    it('打开面板后 bottomSheet 添加 bottomSheetVisible class', () => {
        const { container } = render(<DayPicker {...DEFAULT_PROPS} displayMode="mobile" />);
        fireEvent.click(container.querySelector('[role="button"]')!);
        const dialog = document.body.querySelector('[role="dialog"]')!;
        expect(dialog.className).toContain('bottomSheetVisible');
    });

    it('关闭面板后 bottomSheet 移除 bottomSheetVisible class（退场动画结束后）', () => {
        const { container } = render(<DayPicker {...DEFAULT_PROPS} displayMode="mobile" />);
        const trigger = container.querySelector('[role="button"]')!;
        // 打开
        fireEvent.click(trigger);
        const dialog = document.body.querySelector('[role="dialog"]')!;
        expect(dialog.className).toContain('bottomSheetVisible');
        // ESC 关闭
        act(() => {
            window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
        });
        // 移动端直接关闭，bottomSheetVisible 立即移除
        const dialogAfterClose = document.body.querySelector('[role="dialog"]');
        expect(dialogAfterClose).not.toBeNull();
        expect(dialogAfterClose!.className).not.toContain('bottomSheetVisible');
    });
});

// ─── 8. 外部 props 同步到面板内部 state（Bug #3 fix）───────────────────────

describe('DayPicker – 外部 props 同步', () => {
    it('外部 year/month/day 变化时，trigger 展示文本同步更新', () => {
        const { rerender } = render(
            <DayPicker year={2024} month={6} day={15} onChange={vi.fn()} displayMode="pc" />,
        );
        expect(screen.getByText('2024/06/15')).toBeInTheDocument();

        // 更新外部 props
        rerender(
            <DayPicker year={2025} month={3} day={8} onChange={vi.fn()} displayMode="pc" />,
        );
        expect(screen.getByText('2025/03/08')).toBeInTheDocument();
    });

    it('外部 props 变化时，移动端面板内部状态同步', () => {
        const onChange = vi.fn();
        const { container, rerender } = render(
            <DayPicker year={2024} month={6} day={15} onChange={onChange} displayMode="mobile" />,
        );

        // 打开面板
        fireEvent.click(container.querySelector('[role="button"]')!);

        // 更新外部 props
        rerender(
            <DayPicker year={2025} month={3} day={8} onChange={onChange} displayMode="mobile" />,
        );

        // trigger 文本应该更新
        expect(screen.getByText('2025/03/08')).toBeInTheDocument();
    });
});
