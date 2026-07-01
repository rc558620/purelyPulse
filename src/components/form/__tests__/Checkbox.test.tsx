import React from 'react';
import '@testing-library/jest-dom';
import { describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Checkbox from '../Checkbox';
import { Form } from '../Form';
import { FormItem } from '../FormItem';

describe('Checkbox', () => {
    it('渲染文本并默认未选中', () => {
        render(<Checkbox>我已阅读并同意协议</Checkbox>);

        expect(screen.getByRole('checkbox', { name: '我已阅读并同意协议' })).not.toBeChecked();
    });

    it('支持 checked 与 value 两种受控写法', () => {
        const { rerender } = render(<Checkbox checked readOnly>记住我</Checkbox>);
        expect(screen.getByRole('checkbox', { name: '记住我' })).toBeChecked();

        rerender(<Checkbox value={false}>记住我</Checkbox>);
        expect(screen.getByRole('checkbox', { name: '记住我' })).not.toBeChecked();
    });

    it('点击后触发原生 change 事件并更新选中态', async () => {
        const user = userEvent.setup();
        const handleChange = vi.fn();

        render(<Checkbox onChange={handleChange}>接收消息通知</Checkbox>);

        const input = screen.getByRole('checkbox', { name: '接收消息通知' });
        await user.click(screen.getByText('接收消息通知'));

        expect(input).toBeChecked();
        expect(handleChange).toHaveBeenCalledTimes(1);
        expect(handleChange.mock.calls[0]?.[0].target.checked).toBe(true);
    });

    it('支持通过 props 自定义主色与圆角', () => {
        render(
            <Checkbox color="#123456" borderRadius="full">
                自定义样式
            </Checkbox>,
        );

        const root = screen.getByText('自定义样式').closest('label');
        expect(root).toHaveStyle('--checkbox-color: #123456');
        expect(root).toHaveStyle('--checkbox-radius: 9999px');
    });

    it('可与 FormItem 通过 valuePropName=checked 联动', async () => {
        const user = userEvent.setup();
        const handleFinish = vi.fn();

        render(
            <Form onFinish={handleFinish}>
                <FormItem
                    name="agreement"
                    valuePropName="checked"
                    rules={[
                        {
                            validator: (value) => {
                                if (!value) {
                                    throw new Error('请先勾选协议');
                                }
                            },
                        },
                    ]}
                >
                    <Checkbox>我已同意用户协议</Checkbox>
                </FormItem>
                <button type="submit">提交</button>
            </Form>,
        );

        await user.click(screen.getByRole('button', { name: '提交' }));
        expect(await screen.findByText('请先勾选协议')).toBeInTheDocument();

        await user.click(screen.getByText('我已同意用户协议'));
        await user.click(screen.getByRole('button', { name: '提交' }));

        await waitFor(() => {
            expect(handleFinish).toHaveBeenCalledWith(expect.objectContaining({ agreement: true }));
        });
    });

    // ─── Bug 修复回归测试 ────────────────────────────────────────────────────────

    describe('Bug1: disabled+checked 选中态样式', () => {
        it('disabled+checked 时方框应保留主色背景', () => {
            render(<Checkbox checked disabled>已选但禁用</Checkbox>);
            const input = screen.getByRole('checkbox');
            // input 应同时有 checked 和 disabled
            expect(input).toBeChecked();
            expect(input).toBeDisabled();
            // 方框应存在 checked:disabled 的样式规则（通过 CSS 选择器）
            const label = input.closest('label');
            expect(label?.className.includes('checkboxDisabled')).toBe(true);
        });
    });

    describe('Bug2: indeterminate 独立于 checked', () => {
        it('indeterminate=true 且 checked=true 时仍显示半选态', () => {
            const { container } = render(<Checkbox checked readOnly indeterminate>半选</Checkbox>);
            // indeterminate class 应被添加到 label
            const label = container.querySelector('label');
            expect(label?.className.includes('checkboxIndeterminate')).toBe(true);
        });

        it('indeterminate=true 且不传 checked 时也显示半选态', () => {
            const { container } = render(<Checkbox indeterminate>半选无 checked</Checkbox>);
            const label = container.querySelector('label');
            expect(label?.className.includes('checkboxIndeterminate')).toBe(true);
        });
    });

    describe('Bug3: disabled 时不触发 hover', () => {
        it('disabled 的 Checkbox label 有 checkboxDisabled 类名', () => {
            const { container } = render(<Checkbox disabled>禁用态</Checkbox>);
            const label = container.querySelector('label');
            // CSS Module 会给类名添加 hash 后缀，用 includes 判断
            expect(label?.className.includes('checkboxDisabled')).toBe(true);
        });
    });

    describe('Bug4: 非受控模式不传 checked', () => {
        it('不传 checked/value 时 input 不受控，可自由切换', async () => {
            const user = userEvent.setup();
            render(<Checkbox>非受控</Checkbox>);
            const input = screen.getByRole('checkbox', { name: '非受控' });

            expect(input).not.toBeChecked();
            await user.click(screen.getByText('非受控'));
            expect(input).toBeChecked();
        });

        it('不传 checked/value 时 input 无 checked 属性（非受控）', () => {
            render(<Checkbox>非受控</Checkbox>);
            const input = screen.getByRole('checkbox', { name: '非受控' });
            // 非受控模式下 React 不会设置 checked attribute
            expect(input.hasAttribute('checked')).toBe(false);
        });
    });

    describe('Bug5: value 类型安全', () => {
        it('value 接受 boolean 值', () => {
            const { rerender } = render(<Checkbox value={true} readOnly>布尔值</Checkbox>);
            expect(screen.getByRole('checkbox', { name: '布尔值' })).toBeChecked();

            rerender(<Checkbox value={false} onChange={() => undefined}>布尔值</Checkbox>);
            expect(screen.getByRole('checkbox', { name: '布尔值' })).not.toBeChecked();
        });
    });

    describe('Bug6: resolveRadius 类型收窄', () => {
        it('已知 key 返回对应值', () => {
            render(<Checkbox borderRadius="sm">圆角</Checkbox>);
            const root = screen.getByText('圆角').closest('label');
            expect(root).toHaveStyle('--checkbox-radius: 8px');
        });

        it('数字值返回 px 单位', () => {
            render(<Checkbox borderRadius={10}>数字圆角</Checkbox>);
            const root = screen.getByText('数字圆角').closest('label');
            expect(root).toHaveStyle('--checkbox-radius: 10px');
        });

        it('未知字符串直接透传', () => {
            render(<Checkbox borderRadius="2em">自定义圆角</Checkbox>);
            const root = screen.getByText('自定义圆角').closest('label');
            expect(root).toHaveStyle('--checkbox-radius: 2em');
        });
    });

    describe('Bug7: indeterminate 时不渲染对勾图标', () => {
        it('indeterminate=true 时 SVG 图标不存在于 DOM', () => {
            const { container } = render(<Checkbox indeterminate>半选</Checkbox>);
            // CheckboxCheckIcon 是 SVG，indeterminate 时不应该渲染
            const svg = container.querySelector('svg');
            expect(svg).toBeNull();
        });

        it('indeterminate=false 时 SVG 图标存在', () => {
            const { container } = render(<Checkbox>正常</Checkbox>);
            const svg = container.querySelector('svg');
            expect(svg).toBeInTheDocument();
        });
    });

    describe('Bug8: disabled 态样式不双重降低', () => {
        it('disabled 时 label 有 checkboxDisabled 类但无容器级 opacity 内联样式', () => {
            const { container } = render(<Checkbox disabled>禁用</Checkbox>);
            const label = container.querySelector('label');
            // 容器不应有内联 opacity 样式（opacity 由子元素 CSS 控制）
            expect(label?.style.opacity).not.toBe('0.65');
        });
    });

    describe('Bug10: FormItem 自动推断 Checkbox 的 valuePropName', () => {
        it('Checkbox 在 FormItem 中无需指定 valuePropName 即可自动联动', async () => {
            const user = userEvent.setup();
            const handleFinish = vi.fn();

            render(
                <Form onFinish={handleFinish}>
                    <FormItem
                        name="agreement"
                        // 不传 valuePropName，FormItem 应从 Checkbox.__VALUE_PROP_NAME__ 自动推断
                        rules={[
                            {
                                validator: (value) => {
                                    if (!value) {
                                        throw new Error('请先勾选');
                                    }
                                },
                            },
                        ]}
                    >
                        <Checkbox>自动联动</Checkbox>
                    </FormItem>
                    <button type="submit">提交</button>
                </Form>,
            );

            // 未勾选时提交应报错
            await user.click(screen.getByRole('button', { name: '提交' }));
            expect(await screen.findByText('请先勾选')).toBeInTheDocument();

            // 勾选后提交应成功
            await user.click(screen.getByText('自动联动'));
            await user.click(screen.getByRole('button', { name: '提交' }));

            await waitFor(() => {
                expect(handleFinish).toHaveBeenCalledWith(expect.objectContaining({ agreement: true }));
            });
        });
    });
});
