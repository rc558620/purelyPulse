/**
 * MonthPicker 组件单元测试
 *
 * 覆盖范围：
 *  - trigger 展示格式 "YYYY/MM"
 *  - 月份 < 10 时补零
 *  - 点击 trigger 打开面板
 *  - Enter 键打开面板
 *  - ESC 键关闭（mobile 模式直接关闭）
 *  - onClear：有时展示清除按钮，无时不展示
 *  - 点击清除触发 onClear
 *  - 点击清除 stopPropagation（不打开面板）
 *  - displayMode="pc" / "mobile"
 *  - className 应用
 *  - aria 属性
 */

import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import MonthPicker from '../index';

const DEFAULT_PROPS = {
    year: 2024,
    month: 6,
    onChange: vi.fn(),
};

// ─── 1. trigger 展示 ─────────────────────────────────────────────────────────

describe('MonthPicker – trigger 展示', () => {
    it('展示 "YYYY/MM" 格式', () => {
        render(<MonthPicker {...DEFAULT_PROPS} displayMode="pc" />);
        expect(screen.getByText('2024/06')).toBeInTheDocument();
    });

    it('月份 < 10 时补零', () => {
        render(<MonthPicker year={2024} month={3} onChange={vi.fn()} displayMode="pc" />);
        expect(screen.getByText('2024/03')).toBeInTheDocument();
    });
});

// ─── 2. aria 属性 ────────────────────────────────────────────────────────────

describe('MonthPicker – aria 属性', () => {
    it('trigger 具有 role="button"', () => {
        const { container } = render(<MonthPicker {...DEFAULT_PROPS} displayMode="pc" />);
        expect(container.querySelector('[role="button"]')).toBeInTheDocument();
    });

    it('trigger 初始 aria-expanded=false', () => {
        const { container } = render(<MonthPicker {...DEFAULT_PROPS} displayMode="pc" />);
        expect(container.querySelector('[role="button"]')).toHaveAttribute('aria-expanded', 'false');
    });

    it('trigger aria-label 为展示文本', () => {
        const { container } = render(<MonthPicker {...DEFAULT_PROPS} displayMode="pc" />);
        expect(container.querySelector('[role="button"]')).toHaveAttribute('aria-label', '2024/06');
    });

    it('trigger 具有 aria-haspopup="dialog"', () => {
        const { container } = render(<MonthPicker {...DEFAULT_PROPS} displayMode="pc" />);
        expect(container.querySelector('[role="button"]')).toHaveAttribute('aria-haspopup', 'dialog');
    });
});

// ─── 3. 打开 / 关闭 ──────────────────────────────────────────────────────────

describe('MonthPicker – 打开/关闭', () => {
    it('点击 trigger 后 aria-expanded=true', () => {
        const { container } = render(<MonthPicker {...DEFAULT_PROPS} displayMode="pc" />);
        const trigger = container.querySelector('[role="button"]')!;
        fireEvent.click(trigger);
        expect(trigger).toHaveAttribute('aria-expanded', 'true');
    });

    it('Enter 键打开面板', () => {
        const { container } = render(<MonthPicker {...DEFAULT_PROPS} displayMode="pc" />);
        const trigger = container.querySelector('[role="button"]')!;
        fireEvent.keyDown(trigger, { key: 'Enter' });
        expect(trigger).toHaveAttribute('aria-expanded', 'true');
    });

    it('ESC 键触发关闭（mobile 走退场动画）', () => {
        const { container } = render(<MonthPicker {...DEFAULT_PROPS} displayMode="mobile" />);
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

describe('MonthPicker – 清除按钮', () => {
    it('有 onClear 时显示清除按钮', () => {
        render(<MonthPicker {...DEFAULT_PROPS} onClear={vi.fn()} displayMode="pc" />);
        expect(screen.getByRole('button', { name: '清除年月' })).toBeInTheDocument();
    });

    it('无 onClear 时不显示清除按钮', () => {
        render(<MonthPicker {...DEFAULT_PROPS} displayMode="pc" />);
        expect(screen.queryByRole('button', { name: '清除年月' })).toBeNull();
    });

    it('点击清除触发 onClear', async () => {
        const user = userEvent.setup();
        const onClear = vi.fn();
        render(<MonthPicker {...DEFAULT_PROPS} onClear={onClear} displayMode="pc" />);
        await user.click(screen.getByRole('button', { name: '清除年月' }));
        expect(onClear).toHaveBeenCalledTimes(1);
    });

    it('点击清除不打开面板', async () => {
        const user = userEvent.setup();
        const { container } = render(
            <MonthPicker {...DEFAULT_PROPS} onClear={vi.fn()} displayMode="pc" />,
        );
        await user.click(screen.getByRole('button', { name: '清除年月' }));
        expect(container.querySelector('[role="button"]')).toHaveAttribute('aria-expanded', 'false');
    });
});

// ─── 5. displayMode ──────────────────────────────────────────────────────────

describe('MonthPicker – displayMode', () => {
    it('displayMode="pc" 打开后 aria-expanded=true', () => {
        const { container } = render(<MonthPicker {...DEFAULT_PROPS} displayMode="pc" />);
        fireEvent.click(container.querySelector('[role="button"]')!);
        expect(container.querySelector('[role="button"]')).toHaveAttribute('aria-expanded', 'true');
    });

    it('displayMode="mobile" 打开后 aria-expanded=true', () => {
        const { container } = render(<MonthPicker {...DEFAULT_PROPS} displayMode="mobile" />);
        fireEvent.click(container.querySelector('[role="button"]')!);
        expect(container.querySelector('[role="button"]')).toHaveAttribute('aria-expanded', 'true');
    });
});

// ─── 6. className ────────────────────────────────────────────────────────────

describe('MonthPicker – className', () => {
    it('自定义 className 应用到外层 wrapper', () => {
        const { container } = render(
            <MonthPicker {...DEFAULT_PROPS} className="my-month" displayMode="pc" />,
        );
        expect(container.firstChild).toHaveClass('my-month');
    });
});
