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
});
