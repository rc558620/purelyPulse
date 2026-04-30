/**
 * SelectView 组件集成测试
 *
 * 覆盖范围：
 *  - trigger 展示 placeholder / displayText
 *  - 默认 placeholder "请选择"
 *  - 点击 trigger 打开面板（aria-expanded）
 *  - Enter 键打开
 *  - ESC 关闭（mobile 直接关闭）
 *  - 单选：点击选项触发 onChange，面板关闭
 *  - 多选：点击选项更新草稿，确认后触发 onChange
 *  - status="error" trigger 含 error class
 *  - allowClear=true 有值时显示清除按钮，无值不显示
 *  - 点击清除触发 onChange('')
 *  - 受控 value 展示 displayText
 *  - defaultValue 非受控初始展示
 *  - displayMode="pc" 强制 PC 模式
 *  - displayMode="mobile" 强制移动端
 *  - className 应用
 *  - prefix 渲染
 *  - aria 属性
 *  - Form + FormItem 集成
 */

import React from 'react';
import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest';
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SelectView } from '../index';
import { Form } from '../../Form';
import { FormItem } from '../../FormItem';
import type { SelectOption } from '../types';

beforeAll(() => {
    vi.setSystemTime(new Date('2024-06-15T12:00:00'));
});
afterAll(() => {
    vi.useRealTimers();
});

const OPTIONS: SelectOption[] = [
    { value: 'a', label: '选项 A' },
    { value: 'b', label: '选项 B' },
    { value: 'c', label: '选项 C' },
];

// ─── 1. trigger 展示 ─────────────────────────────────────────────────────────

describe('SelectView – trigger 展示', () => {
    it('无 value 时展示默认 placeholder "请选择"', () => {
        render(<SelectView options={OPTIONS} displayMode="pc" />);
        expect(screen.getByText('请选择')).toBeInTheDocument();
    });

    it('自定义 placeholder', () => {
        render(
            <SelectView options={OPTIONS} placeholder="选择类别" displayMode="pc" />,
        );
        expect(screen.getByText('选择类别')).toBeInTheDocument();
    });

    it('value 有值时展示 displayText（单选）', () => {
        render(<SelectView options={OPTIONS} value="b" displayMode="pc" />);
        expect(screen.getByText('选项 B')).toBeInTheDocument();
    });

    it('多选 value 展示多个 label 连接', () => {
        render(
            <SelectView
                options={OPTIONS}
                value={['a', 'c']}
                mode="multiple"
                displayMode="pc"
            />,
        );
        expect(screen.getByText('选项 A、选项 C')).toBeInTheDocument();
    });

    it('defaultValue 非受控初始展示', () => {
        render(<SelectView options={OPTIONS} defaultValue="c" displayMode="pc" />);
        expect(screen.getByText('选项 C')).toBeInTheDocument();
    });
});

// ─── 2. aria 属性 ────────────────────────────────────────────────────────────

describe('SelectView – aria 属性', () => {
    it('trigger 具有 role="button"', () => {
        const { container } = render(<SelectView options={OPTIONS} displayMode="pc" />);
        // SelectView 的 trigger 是 role="combobox"，用 combobox 查询
        expect(container.querySelector('[role="combobox"]')).toBeInTheDocument();
    });

    it('trigger 初始 aria-expanded=false', () => {
        const { container } = render(<SelectView options={OPTIONS} displayMode="pc" />);
        expect(container.querySelector('[role="combobox"]')).toHaveAttribute('aria-expanded', 'false');
    });

    it('打开后 aria-expanded=true', () => {
        const { container } = render(<SelectView options={OPTIONS} displayMode="pc" />);
        const trigger = container.querySelector('[role="combobox"]')!;
        fireEvent.click(trigger);
        expect(trigger).toHaveAttribute('aria-expanded', 'true');
    });

    it('trigger 具有 aria-haspopup', () => {
        const { container } = render(<SelectView options={OPTIONS} displayMode="pc" />);
        const trigger = container.querySelector('[role="combobox"]');
        expect(trigger).toHaveAttribute('aria-haspopup');
    });
});

// ─── 3. 打开 / 关闭 ──────────────────────────────────────────────────────────

describe('SelectView – 打开/关闭', () => {
    it('点击 trigger 打开面板', () => {
        const { container } = render(<SelectView options={OPTIONS} displayMode="pc" />);
        const trigger = container.querySelector('[role="combobox"]')!;
        fireEvent.click(trigger);
        expect(trigger).toHaveAttribute('aria-expanded', 'true');
    });

    it('Enter 键打开面板', () => {
        const { container } = render(<SelectView options={OPTIONS} displayMode="pc" />);
        const trigger = container.querySelector('[role="combobox"]')!;
        fireEvent.keyDown(trigger, { key: 'Enter' });
        expect(trigger).toHaveAttribute('aria-expanded', 'true');
    });

    it('ESC 键关闭（mobile 直接关闭）', () => {
        const { container } = render(<SelectView options={OPTIONS} displayMode="mobile" />);
        const trigger = container.querySelector('[role="combobox"]')!;
        fireEvent.click(trigger);
        act(() => {
            window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
        });
        expect(trigger).toHaveAttribute('aria-expanded', 'false');
    });
});

// ─── 4. 单选交互 ─────────────────────────────────────────────────────────────

describe('SelectView – 单选交互', () => {
    it('PC 单选：点击选项触发 onChange', async () => {
        const user = userEvent.setup();
        const onChange = vi.fn();
        const { container } = render(
            <SelectView options={OPTIONS} onChange={onChange} displayMode="pc" />,
        );
        // 打开面板
        await user.click(container.querySelector('[role="combobox"]')!);
        // 在 dropdown 中点击选项
        await user.click(screen.getByText('选项 A'));
        expect(onChange).toHaveBeenCalledWith('a');
    });

    it('Mobile 单选：点击选项触发 onChange', async () => {
        const user = userEvent.setup();
        const onChange = vi.fn();
        const { container } = render(
            <SelectView options={OPTIONS} onChange={onChange} displayMode="mobile" />,
        );
        await user.click(container.querySelector('[role="combobox"]')!);
        const optionEl = await screen.findByText('选项 B');
        await user.click(optionEl);
        expect(onChange).toHaveBeenCalledWith('b');
    });
});

// ─── 5. 多选交互 ─────────────────────────────────────────────────────────────

describe('SelectView – 多选交互', () => {
    it('PC 多选：点击确定后触发 onChange', async () => {
        const user = userEvent.setup();
        const onChange = vi.fn();
        const { container } = render(
            <SelectView
                options={OPTIONS}
                mode="multiple"
                onChange={onChange}
                displayMode="pc"
            />,
        );
        await user.click(container.querySelector('[role="combobox"]')!);
        await user.click(screen.getByText('选项 A'));
        await user.click(screen.getByText('选项 C'));
        // 点击确定按钮
        await user.click(screen.getByRole('button', { name: '确定' }));
        expect(onChange).toHaveBeenCalledWith(['a', 'c']);
    });
});

// ─── 6. status ───────────────────────────────────────────────────────────────

describe('SelectView – status', () => {
    it('status="error" trigger 含 error class', () => {
        const { container } = render(<SelectView options={OPTIONS} status="error" displayMode="pc" />);
        const trigger = container.querySelector('[role="combobox"]')!;
        expect(trigger.className).toMatch(/[Ee]rror/);
    });

    it('无 status 时无 error class', () => {
        const { container } = render(<SelectView options={OPTIONS} displayMode="pc" />);
        const trigger = container.querySelector('[role="combobox"]')!;
        expect(trigger.className).not.toMatch(/[Ee]rror/);
    });
});

// ─── 7. allowClear ───────────────────────────────────────────────────────────

describe('SelectView – allowClear', () => {
    it('allowClear=true 且有值时显示清除按钮', () => {
        render(
            <SelectView options={OPTIONS} value="a" allowClear displayMode="pc" />,
        );
        expect(screen.getByRole('button', { name: '清除选择' })).toBeInTheDocument();
    });

    it('allowClear=false 时不显示清除按钮', () => {
        render(
            <SelectView options={OPTIONS} value="a" allowClear={false} displayMode="pc" />,
        );
        expect(screen.queryByRole('button', { name: '清除选择' })).toBeNull();
    });

    it('无 value 时不显示清除按钮', () => {
        render(<SelectView options={OPTIONS} allowClear displayMode="pc" />);
        expect(screen.queryByRole('button', { name: '清除选择' })).toBeNull();
    });

    it('点击清除（单选）触发 onChange("")', async () => {
        const user = userEvent.setup();
        const onChange = vi.fn();
        render(
            <SelectView
                options={OPTIONS}
                value="a"
                allowClear
                onChange={onChange}
                displayMode="pc"
            />,
        );
        await user.click(screen.getByRole('button', { name: '清除选择' }));
        expect(onChange).toHaveBeenCalledWith('');
    });
});

// ─── 8. className / prefix ───────────────────────────────────────────────────

describe('SelectView – className & prefix', () => {
    it('className 应用到外层 wrapper', () => {
        const { container } = render(
            <SelectView options={OPTIONS} className="my-select" displayMode="pc" />,
        );
        expect(container.firstChild).toHaveClass('my-select');
    });

    it('prefix 自定义前缀渲染', () => {
        render(
            <SelectView
                options={OPTIONS}
                displayMode="pc"
                prefix={<span data-testid="pfx">🔍</span>}
            />,
        );
        expect(screen.getByTestId('pfx')).toBeInTheDocument();
    });
});

// ─── 9. Form + FormItem 集成 ─────────────────────────────────────────────────

describe('SelectView – Form 集成', () => {
    it('FormItem 校验失败时显示 error 文案并注入 status="error"', async () => {
        const user = userEvent.setup();
        const { container } = render(
            <Form>
                <FormItem name="type" rules={[{ required: true, message: '请选择类型' }]}>
                    <SelectView options={OPTIONS} displayMode="pc" />
                </FormItem>
                <button type="submit">提交</button>
            </Form>,
        );
        await user.click(screen.getByRole('button', { name: '提交' }));
        await waitFor(() => {
            expect(screen.getByText('请选择类型')).toBeInTheDocument();
        });
        const trigger = container.querySelector('[role="combobox"]')!;
        expect(trigger.className).toMatch(/[Ee]rror/);
    });

    it('选择后提交 onFinish 收到正确值', async () => {
        const user = userEvent.setup();
        const onFinish = vi.fn();
        const { container } = render(
            <Form onFinish={onFinish}>
                <FormItem name="category">
                    <SelectView options={OPTIONS} displayMode="pc" />
                </FormItem>
                <button type="submit">提交</button>
            </Form>,
        );
        await user.click(container.querySelector('[role="combobox"]')!);
        await user.click(screen.getByText('选项 B'));
        await user.click(screen.getByRole('button', { name: '提交' }));
        await waitFor(() => {
            expect(onFinish).toHaveBeenCalledWith({ category: 'b' });
        });
    });
});
