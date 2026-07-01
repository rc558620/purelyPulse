/**
 * RadioGroup 组件单元测试
 *
 * 覆盖范围：
 *  - 基本渲染：options → radio 输入框与 label
 *  - 选中态：value 匹配的选项为 checked
 *  - 点击切换：onChange 收到正确值（通过 label 点击，因为 input 有 pointer-events:none）
 *  - 整组 disabled
 *  - 单项 disabled
 *  - status="error" 错误态 class
 *  - error prop 错误态 class
 *  - 自定义 name
 *  - 自动 name（不传 name）
 *  - color CSS 变量注入
 *  - 与 FormItem 的联动（value/onChange 注入）
 *  - 同组选项互斥（单选语义）
 *  - unknown 类型 value 兼容（FormItem 注入场景）
 *  - 无 onChange 时点击不抛错
 *  - 键盘可操作性（role="group"）
 */

import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import RadioGroup from '../RadioGroup';
import { Form } from '../../Form';
import { FormItem } from '../../FormItem';
import type { RadioOption } from '../RadioGroup';

// ─── 基础选项 ────────────────────────────────────────────────────────────────

const BASE_OPTIONS: RadioOption<string>[] = [
    { value: 'a', label: '选项 A' },
    { value: 'b', label: '选项 B' },
    { value: 'c', label: '选项 C' },
];

/**
 * 点击 label（input 有 pointer-events:none，只能通过关联 label 触发 change）
 * 使用 fireEvent.click(label) 模拟点击
 */
function clickLabel(labelText: string) {
    const label = screen.getByText(labelText).closest('label') ??
        screen.getByText(labelText);
    fireEvent.click(label);
}

// ─── 1. 基本渲染 ─────────────────────────────────────────────────────────────

describe('RadioGroup – 基本渲染', () => {
    it('渲染正确数量的 radio 输入框', () => {
        render(<RadioGroup options={BASE_OPTIONS} />);
        const radios = screen.getAllByRole('radio');
        expect(radios).toHaveLength(3);
    });

    it('渲染所有选项 label', () => {
        render(<RadioGroup options={BASE_OPTIONS} />);
        expect(screen.getByText('选项 A')).toBeInTheDocument();
        expect(screen.getByText('选项 B')).toBeInTheDocument();
        expect(screen.getByText('选项 C')).toBeInTheDocument();
    });

    it('根元素具有 role="group"', () => {
        const { container } = render(<RadioGroup options={BASE_OPTIONS} />);
        expect(container.querySelector('[role="group"]')).toBeInTheDocument();
    });

    it('空 options 不渲染任何 radio', () => {
        render(<RadioGroup options={[]} />);
        expect(screen.queryAllByRole('radio')).toHaveLength(0);
    });
});

// ─── 2. 选中态 ───────────────────────────────────────────────────────────────

describe('RadioGroup – 选中态', () => {
    it('value 对应的选项为 checked', () => {
        render(<RadioGroup options={BASE_OPTIONS} value="b" />);
        const radioA = screen.getByRole('radio', { name: '选项 A' });
        const radioB = screen.getByRole('radio', { name: '选项 B' });
        expect(radioA).not.toBeChecked();
        expect(radioB).toBeChecked();
    });

    it('value 为 null 时无选项被选中', () => {
        render(<RadioGroup options={BASE_OPTIONS} value={null} />);
        const radios = screen.getAllByRole('radio');
        radios.forEach(r => expect(r).not.toBeChecked());
    });

    it('value 为 undefined 时无选项被选中', () => {
        render(<RadioGroup options={BASE_OPTIONS} />);
        const radios = screen.getAllByRole('radio');
        radios.forEach(r => expect(r).not.toBeChecked());
    });

    it('value 为 unknown 类型（FormItem 注入）时正确匹配', () => {
        render(<RadioGroup options={BASE_OPTIONS} value={'c' as unknown} />);
        expect(screen.getByRole('radio', { name: '选项 C' })).toBeChecked();
    });
});

// ─── 3. onChange 回调 ────────────────────────────────────────────────────────

describe('RadioGroup – onChange 回调', () => {
    it('点击 label 后 onChange 收到对应 value', () => {
        const onChange = vi.fn();
        render(<RadioGroup options={BASE_OPTIONS} onChange={onChange} />);
        clickLabel('选项 A');
        expect(onChange).toHaveBeenCalledWith('a');
    });

    it('切换 label 时 onChange 收到新 value', () => {
        const onChange = vi.fn();
        render(<RadioGroup options={BASE_OPTIONS} value="a" onChange={onChange} />);
        clickLabel('选项 C');
        expect(onChange).toHaveBeenCalledWith('c');
    });

    it('无 onChange 时点击 label 不抛错', () => {
        render(<RadioGroup options={BASE_OPTIONS} />);
        expect(() => clickLabel('选项 B')).not.toThrow();
    });
});

// ─── 4. disabled ─────────────────────────────────────────────────────────────

describe('RadioGroup – disabled', () => {
    it('整组 disabled 时所有 radio 不可用', () => {
        render(<RadioGroup options={BASE_OPTIONS} disabled />);
        const radios = screen.getAllByRole('radio');
        radios.forEach(r => expect(r).toBeDisabled());
    });

    it('单项 disabled 时只有对应 radio 不可用', () => {
        const optionsWithDisabled: RadioOption<string>[] = [
            { value: 'x', label: '启用', disabled: false },
            { value: 'y', label: '禁用', disabled: true },
        ];
        render(<RadioGroup options={optionsWithDisabled} />);
        expect(screen.getByRole('radio', { name: '启用' })).not.toBeDisabled();
        expect(screen.getByRole('radio', { name: '禁用' })).toBeDisabled();
    });

    it('整组 disabled 同时单项也 disabled，合并结果为 disabled', () => {
        const opts: RadioOption<string>[] = [
            { value: 'p', label: 'P', disabled: true },
        ];
        render(<RadioGroup options={opts} disabled />);
        expect(screen.getByRole('radio', { name: 'P' })).toBeDisabled();
    });
});

// ─── 5. 错误态 ───────────────────────────────────────────────────────────────

describe('RadioGroup – 错误态', () => {
    it('status="error" 时根元素含 error class', () => {
        const { container } = render(<RadioGroup options={BASE_OPTIONS} status="error" />);
        const group = container.querySelector('[role="group"]')!;
        expect(group.className).toMatch(/Error/i);
    });

    it('error=true 时根元素含 error class', () => {
        const { container } = render(<RadioGroup options={BASE_OPTIONS} error />);
        const group = container.querySelector('[role="group"]')!;
        expect(group.className).toMatch(/Error/i);
    });

    it('status 和 error 都未设时无 error class', () => {
        const { container } = render(<RadioGroup options={BASE_OPTIONS} />);
        const group = container.querySelector('[role="group"]')!;
        expect(group.className).not.toMatch(/Error/i);
    });
});

// ─── 6. name 属性 ────────────────────────────────────────────────────────────

describe('RadioGroup – name 属性', () => {
    it('自定义 name 传递到 radio input', () => {
        render(<RadioGroup options={BASE_OPTIONS} name="my-group" />);
        const radios = screen.getAllByRole('radio');
        radios.forEach(r => expect(r).toHaveAttribute('name', 'my-group'));
    });

    it('不传 name 时自动生成 name（所有 radio 同组）', () => {
        render(<RadioGroup options={BASE_OPTIONS} />);
        const radios = screen.getAllByRole('radio') as HTMLInputElement[];
        const names = radios.map(r => r.name);
        const uniqueNames = new Set(names);
        expect(uniqueNames.size).toBe(1);
        expect(names[0]).toBeTruthy();
    });
});

// ─── 7. color CSS 变量 ───────────────────────────────────────────────────────

describe('RadioGroup – color CSS 变量', () => {
    it('传入 color 时根元素设置 --radio-color 变量', () => {
        const { container } = render(
            <RadioGroup options={BASE_OPTIONS} color="#ff0000" />,
        );
        const group = container.querySelector('[role="group"]')!;
        expect((group as HTMLElement).style.getPropertyValue('--radio-color')).toBe('#ff0000');
    });

    it('不传 color 时不设置 --radio-color 变量', () => {
        const { container } = render(<RadioGroup options={BASE_OPTIONS} />);
        const group = container.querySelector('[role="group"]')!;
        expect((group as HTMLElement).style.getPropertyValue('--radio-color')).toBe('');
    });
});

// ─── 8. className ────────────────────────────────────────────────────────────

describe('RadioGroup – className', () => {
    it('自定义 className 被应用到根元素', () => {
        const { container } = render(
            <RadioGroup options={BASE_OPTIONS} className="my-radio" />,
        );
        const group = container.querySelector('[role="group"]')!;
        expect(group.className).toContain('my-radio');
    });
});

// ─── 9. 与 FormItem 联动 ─────────────────────────────────────────────────────

describe('RadioGroup – 与 FormItem 联动', () => {
    it('选择后提交 onFinish 收到正确值', async () => {
        const user = userEvent.setup();
        const onFinish = vi.fn();

        render(
            <Form onFinish={onFinish}>
                <FormItem name="gender" rules={[{ required: true, message: '请选择' }]}>
                    <RadioGroup
                        options={[
                            { value: 'male', label: '男' },
                            { value: 'female', label: '女' },
                        ]}
                    />
                </FormItem>
                <button type="submit">提交</button>
            </Form>,
        );

        // 通过 fireEvent.click(label) 点击，绕过 pointer-events:none
        fireEvent.click(screen.getByText('男').closest('label')!);
        await user.click(screen.getByRole('button', { name: '提交' }));

        await waitFor(() => {
            expect(onFinish).toHaveBeenCalledWith({ gender: 'male' });
        });
    });

    it('未选择时提交触发必填错误', async () => {
        const user = userEvent.setup();
        render(
            <Form>
                <FormItem name="type" rules={[{ required: true, message: '请选择类型' }]}>
                    <RadioGroup
                        options={[
                            { value: '1', label: '类型 1' },
                            { value: '2', label: '类型 2' },
                        ]}
                    />
                </FormItem>
                <button type="submit">提交</button>
            </Form>,
        );

        await user.click(screen.getByRole('button', { name: '提交' }));
        await waitFor(() => {
            expect(screen.getByText('请选择类型')).toBeInTheDocument();
        });
    });
});

// ─── 10. 互斥行为 ────────────────────────────────────────────────────────────

describe('RadioGroup – 选项互斥', () => {
    it('受控模式：点击 label 触发 onChange 并携带正确 value', () => {
        const onChange = vi.fn();
        render(
            <RadioGroup options={BASE_OPTIONS} value="a" onChange={onChange} />,
        );
        // 初始 A 选中
        expect(screen.getByRole('radio', { name: '选项 A' })).toBeChecked();

        // 点击 B（通过 label）
        fireEvent.click(screen.getByText('选项 B').closest('label')!);
        expect(onChange).toHaveBeenCalledWith('b');
    });
});
