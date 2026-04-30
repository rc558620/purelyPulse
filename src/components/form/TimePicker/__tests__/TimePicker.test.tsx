/**
 * TimePicker 组件单元测试
 *
 * 覆盖范围：
 *  - trigger 展示 value / placeholder
 *  - 默认 placeholder "请选择时间"
 *  - 自定义 placeholder
 *  - value=null 显示 placeholder
 *  - value 有值展示时间
 *  - 点击 trigger 打开（aria-expanded）
 *  - Enter 键打开
 *  - ESC 关闭（mobile 直接关闭）
 *  - status="error" trigger 含 error class
 *  - allowClear=true 且有值时显示清除按钮
 *  - allowClear=false 时不显示清除按钮
 *  - 无值时不显示清除按钮
 *  - 点击清除触发 onChange(null)
 *  - 受控 / 非受控（defaultValue）
 *  - displayMode="pc" / "mobile"
 *  - className 应用
 *  - aria 属性
 */

import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TimePicker from '../index';

// ─── 1. trigger 展示 ─────────────────────────────────────────────────────────

describe('TimePicker – trigger 展示', () => {
    it('value 有值时展示时间', () => {
        render(<TimePicker value="14:30" displayMode="pc" />);
        expect(screen.getByText('14:30')).toBeInTheDocument();
    });

    it('value=null 时展示 placeholder', () => {
        render(<TimePicker value={null} displayMode="pc" />);
        expect(screen.getByText('请选择时间')).toBeInTheDocument();
    });

    it('不传 value 时展示 placeholder', () => {
        render(<TimePicker displayMode="pc" />);
        expect(screen.getByText('请选择时间')).toBeInTheDocument();
    });

    it('自定义 placeholder', () => {
        render(<TimePicker value={null} placeholder="选择打烊时间" displayMode="pc" />);
        expect(screen.getByText('选择打烊时间')).toBeInTheDocument();
    });

    it('非受控 defaultValue 初始展示', () => {
        render(<TimePicker defaultValue="09:00" displayMode="pc" />);
        expect(screen.getByText('09:00')).toBeInTheDocument();
    });
});

// ─── 2. aria 属性 ────────────────────────────────────────────────────────────

describe('TimePicker – aria 属性', () => {
    it('trigger 具有 role="button"', () => {
        const { container } = render(<TimePicker displayMode="pc" />);
        expect(container.querySelector('[role="button"]')).toBeInTheDocument();
    });

    it('trigger 初始 aria-expanded=false', () => {
        const { container } = render(<TimePicker displayMode="pc" />);
        expect(container.querySelector('[role="button"]')).toHaveAttribute('aria-expanded', 'false');
    });

    it('trigger 具有 aria-haspopup="dialog"', () => {
        const { container } = render(<TimePicker displayMode="pc" />);
        expect(container.querySelector('[role="button"]')).toHaveAttribute('aria-haspopup', 'dialog');
    });
});

// ─── 3. 打开 / 关闭 ──────────────────────────────────────────────────────────

describe('TimePicker – 打开/关闭', () => {
    it('点击 trigger 后 aria-expanded=true', () => {
        const { container } = render(<TimePicker displayMode="pc" />);
        const trigger = container.querySelector('[role="button"]')!;
        fireEvent.click(trigger);
        expect(trigger).toHaveAttribute('aria-expanded', 'true');
    });

    it('Enter 键打开面板', () => {
        const { container } = render(<TimePicker displayMode="pc" />);
        const trigger = container.querySelector('[role="button"]')!;
        fireEvent.keyDown(trigger, { key: 'Enter' });
        expect(trigger).toHaveAttribute('aria-expanded', 'true');
    });

    it('ESC 键关闭（mobile 直接关闭）', () => {
        const { container } = render(<TimePicker displayMode="mobile" />);
        const trigger = container.querySelector('[role="button"]')!;
        fireEvent.click(trigger);
        act(() => {
            window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
        });
        expect(trigger).toHaveAttribute('aria-expanded', 'false');
    });
});

// ─── 4. status ───────────────────────────────────────────────────────────────

describe('TimePicker – status', () => {
    it('status="error" trigger 含 error class', () => {
        const { container } = render(<TimePicker status="error" displayMode="pc" />);
        const trigger = container.querySelector('[role="button"]')!;
        expect(trigger.className).toMatch(/[Ee]rror/);
    });

    it('无 status 时无 error class', () => {
        const { container } = render(<TimePicker displayMode="pc" />);
        const trigger = container.querySelector('[role="button"]')!;
        expect(trigger.className).not.toMatch(/[Ee]rror/);
    });
});

// ─── 5. 清除按钮 ─────────────────────────────────────────────────────────────

describe('TimePicker – 清除按钮', () => {
    it('allowClear=true 且有值时显示清除按钮', () => {
        render(<TimePicker value="14:30" allowClear displayMode="pc" />);
        expect(screen.getByRole('button', { name: '清除时间' })).toBeInTheDocument();
    });

    it('allowClear=false 时不显示清除按钮', () => {
        render(<TimePicker value="14:30" allowClear={false} displayMode="pc" />);
        expect(screen.queryByRole('button', { name: '清除时间' })).toBeNull();
    });

    it('value=null 时不显示清除按钮（即使 allowClear=true）', () => {
        render(<TimePicker value={null} allowClear displayMode="pc" />);
        expect(screen.queryByRole('button', { name: '清除时间' })).toBeNull();
    });

    it('点击清除触发 onChange(null)', async () => {
        const user = userEvent.setup();
        const onChange = vi.fn();
        render(<TimePicker value="14:30" allowClear onChange={onChange} displayMode="pc" />);
        await user.click(screen.getByRole('button', { name: '清除时间' }));
        expect(onChange).toHaveBeenCalledWith(null);
    });
});

// ─── 6. 受控 / 非受控 ───────────────────────────────────────────────────────

describe('TimePicker – 受控与非受控', () => {
    it('受控模式：value 更新时展示新值', () => {
        const { rerender } = render(<TimePicker value="09:00" displayMode="pc" />);
        expect(screen.getByText('09:00')).toBeInTheDocument();
        rerender(<TimePicker value="18:30" displayMode="pc" />);
        expect(screen.getByText('18:30')).toBeInTheDocument();
    });
});

// ─── 7. displayMode ──────────────────────────────────────────────────────────

describe('TimePicker – displayMode', () => {
    it('displayMode="pc" 打开后 aria-expanded=true', () => {
        const { container } = render(<TimePicker displayMode="pc" />);
        fireEvent.click(container.querySelector('[role="button"]')!);
        expect(container.querySelector('[role="button"]')).toHaveAttribute('aria-expanded', 'true');
    });

    it('displayMode="mobile" 打开后 aria-expanded=true', () => {
        const { container } = render(<TimePicker displayMode="mobile" />);
        fireEvent.click(container.querySelector('[role="button"]')!);
        expect(container.querySelector('[role="button"]')).toHaveAttribute('aria-expanded', 'true');
    });
});

// ─── 8. className ────────────────────────────────────────────────────────────

describe('TimePicker – className', () => {
    it('自定义 className 应用到外层 wrapper', () => {
        const { container } = render(
            <TimePicker className="my-time" displayMode="pc" />,
        );
        expect(container.firstChild).toHaveClass('my-time');
    });
});
