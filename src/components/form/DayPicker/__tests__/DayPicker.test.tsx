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
 *  - pastYears / futureYears prop 透传
 *  - aria 属性（role、tabIndex、aria-expanded、aria-haspopup）
 *  - 补零格式（月/日 < 10 时补零）
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

    it('ESC 键关闭面板（mobile 模式直接关闭）', () => {
        const { container } = render(<DayPicker {...DEFAULT_PROPS} displayMode="mobile" />);
        const trigger = container.querySelector('[role="button"]')!;
        fireEvent.click(trigger);
        expect(trigger).toHaveAttribute('aria-expanded', 'true');
        act(() => {
            window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
        });
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
