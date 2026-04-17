/**
 * Form 组件集成测试
 *
 * 覆盖范围：
 *  - Form.useForm 静态属性绑定
 *  - FormContext 正确注入（contextValue 包含 submit）
 *  - onFinish 在校验通过时被调用
 *  - onFinishFailed 在校验失败时被调用
 *  - 外部 form 实例传入（form prop）
 *  - 内部自建 form 实例（不传 form prop）
 *  - form.submit() 触发真实 onFinish（__setSubmit 注入验证）
 *  - 表单 DOM 具有 noValidate 属性
 *  - className prop 透传到 <form>
 *  - onFinish 回调可热更新（ref 最新值）
 *  - children 正常渲染
 *  - 提交时调用 e.preventDefault()
 */

import React, { act, useRef } from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Form } from '../Form';
import { FormItem } from '../FormItem';
import { useForm } from '../useForm';
import { useFormContext } from '../context';
import type { ValidatorRule } from '../types';

// ─── 辅助组件：暴露 context ───────────────────────────────────────────────────
const ContextCapture = ({ onCapture }: { onCapture: (ctx: ReturnType<typeof useFormContext>) => void }) => {
    const ctx = useFormContext();
    onCapture(ctx);
    return null;
};

// ─── 辅助：简单 Input 组件 ───────────────────────────────────────────────────
const TextInput = ({ value = '', onChange, status, placeholder }: {
    value?: string;
    onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
    status?: 'error' | undefined;
    placeholder?: string;
}) => <input data-testid="input" data-status={status} value={value} onChange={onChange ?? (() => undefined)} placeholder={placeholder} />;

// ─── 1. 静态属性 ──────────────────────────────────────────────────────────────
describe('Form – 静态属性', () => {
    it('Form.useForm 等于 useForm hook', () => {
        expect(Form.useForm).toBe(useForm);
    });
});

// ─── 2. DOM 结构 ──────────────────────────────────────────────────────────────
describe('Form – DOM 结构', () => {
    it('渲染一个 <form> 元素', () => {
        const { container } = render(<Form>{null}</Form>);
        expect(container.querySelector('form')).toBeInTheDocument();
    });

    it('<form> 具有 noValidate 属性', () => {
        const { container } = render(<Form>{null}</Form>);
        expect(container.querySelector('form')).toHaveAttribute('novalidate');
    });

    it('className prop 被应用到 <form>', () => {
        const { container } = render(<Form className="my-form">{null}</Form>);
        expect(container.querySelector('form')).toHaveClass('my-form');
    });

    it('渲染 children', () => {
        render(<Form><span data-testid="child">hello</span></Form>);
        expect(screen.getByTestId('child')).toBeInTheDocument();
    });
});

// ─── 3. Context 注入 ──────────────────────────────────────────────────────────
describe('Form – Context 注入', () => {
    it('FormContext 中包含必要方法', () => {
        const capturedCtx: ReturnType<typeof useFormContext>[] = [];
        render(
            <Form>
                <ContextCapture onCapture={ctx => capturedCtx.push(ctx)} />
            </Form>,
        );
        const ctx = capturedCtx[0];
        expect(typeof ctx.registerField).toBe('function');
        expect(typeof ctx.unregisterField).toBe('function');
        expect(typeof ctx.setFieldValue).toBe('function');
        expect(typeof ctx.getFieldValue).toBe('function');
        expect(typeof ctx.getFieldError).toBe('function');
        expect(typeof ctx.submit).toBe('function');
        expect(typeof ctx.subscribeField).toBe('function');
    });

    it('外部传入 form 实例后 context 使用该实例', () => {
        const { result } = (() => {
            let capturedCtx: ReturnType<typeof useFormContext> | null = null;
            const Wrapper = () => {
                const [form] = useForm();
                form.setFieldValue('test', 'external');
                return (
                    <Form form={form}>
                        <ContextCapture onCapture={ctx => { capturedCtx = ctx; }} />
                    </Form>
                );
            };
            render(<Wrapper />);
            return { result: capturedCtx };
        })();
        expect((result as ReturnType<typeof useFormContext> | null)?.getFieldValue('test')).toBe('external');
    });
});

// ─── 4. onFinish ──────────────────────────────────────────────────────────────
describe('Form – onFinish 回调', () => {
    it('无校验规则时提交调用 onFinish', async () => {
        const user = userEvent.setup();
        const onFinish = vi.fn();
        render(
            <Form onFinish={onFinish}>
                <FormItem name="name">
                    <TextInput placeholder="name" />
                </FormItem>
                <button type="submit">提交</button>
            </Form>,
        );
        await user.type(screen.getByPlaceholderText('name'), 'Alice');
        await user.click(screen.getByRole('button'));
        await waitFor(() => {
            expect(onFinish).toHaveBeenCalledWith({ name: 'Alice' });
        });
    });

    it('校验通过时 onFinish 被调用', async () => {
        const user = userEvent.setup();
        const onFinish = vi.fn();
        const rules: ValidatorRule[] = [{ required: true, message: '必填' }];
        render(
            <Form onFinish={onFinish}>
                <FormItem name="email" rules={rules}>
                    <TextInput placeholder="email" />
                </FormItem>
                <button type="submit">提交</button>
            </Form>,
        );
        await user.type(screen.getByPlaceholderText('email'), 'test@example.com');
        await user.click(screen.getByRole('button'));
        await waitFor(() => {
            expect(onFinish).toHaveBeenCalledWith({ email: 'test@example.com' });
        });
    });

    it('onFinish 可动态更新（总使用最新引用）', async () => {
        const user = userEvent.setup();
        const onFinishV1 = vi.fn();
        const onFinishV2 = vi.fn();

        const Wrapper = () => {
            const callbackRef = useRef(onFinishV1);
            const [, forceRender] = React.useState(0);
            return (
                <>
                    <button data-testid="swap" onClick={() => {
                        callbackRef.current = onFinishV2;
                        forceRender(n => n + 1);
                    }}>swap</button>
                    <Form onFinish={(v) => callbackRef.current(v)}>
                        <button type="submit">提交</button>
                    </Form>
                </>
            );
        };
        render(<Wrapper />);
        // 先切换回调
        await user.click(screen.getByTestId('swap'));
        await user.click(screen.getByRole('button', { name: '提交' }));
        await waitFor(() => {
            expect(onFinishV2).toHaveBeenCalled();
            expect(onFinishV1).not.toHaveBeenCalled();
        });
    });
});

// ─── 5. onFinishFailed ────────────────────────────────────────────────────────
describe('Form – onFinishFailed 回调', () => {
    it('校验失败时 onFinishFailed 被调用，不调用 onFinish', async () => {
        const user = userEvent.setup();
        const onFinish = vi.fn();
        const onFinishFailed = vi.fn();
        render(
            <Form onFinish={onFinish} onFinishFailed={onFinishFailed}>
                <FormItem name="phone" rules={[{ required: true, message: '手机号必填' }]}>
                    <TextInput placeholder="phone" />
                </FormItem>
                <button type="submit">提交</button>
            </Form>,
        );
        await user.click(screen.getByRole('button'));
        await waitFor(() => {
            expect(onFinishFailed).toHaveBeenCalledWith({ phone: '手机号必填' });
            expect(onFinish).not.toHaveBeenCalled();
        });
    });

    it('未传 onFinishFailed 时校验失败不抛出', async () => {
        const user = userEvent.setup();
        render(
            <Form>
                <FormItem name="f" rules={[{ required: true, message: '必填' }]}>
                    <TextInput />
                </FormItem>
                <button type="submit">提交</button>
            </Form>,
        );
        await expect(user.click(screen.getByRole('button'))).resolves.not.toThrow();
    });
});

// ─── 6. form.submit() ────────────────────────────────────────────────────────
describe('Form – form.submit() 触发', () => {
    it('form.submit() 调用后触发 onFinish', async () => {
        const onFinish = vi.fn();
        let capturedForm: ReturnType<typeof useForm>[0] | null = null;

        const Wrapper = () => {
            const [form] = useForm();
            capturedForm = form;
            return (
                <Form form={form} onFinish={onFinish}>
                    <FormItem name="x">
                        <TextInput />
                    </FormItem>
                </Form>
            );
        };
        render(<Wrapper />);
        act(() => { capturedForm!.setFieldValue('x', 'val'); });
        await act(async () => { await capturedForm!.submit(); });
        await waitFor(() => {
            expect(onFinish).toHaveBeenCalledWith({ x: 'val' });
        });
    });

    it('form.submit() 校验失败时触发 onFinishFailed', async () => {
        const onFinishFailed = vi.fn();
        let capturedForm: ReturnType<typeof useForm>[0] | null = null;

        const Wrapper = () => {
            const [form] = useForm();
            capturedForm = form;
            return (
                <Form form={form} onFinishFailed={onFinishFailed}>
                    <FormItem name="req" rules={[{ required: true, message: '必填' }]}>
                        <TextInput />
                    </FormItem>
                </Form>
            );
        };
        render(<Wrapper />);
        await act(async () => { await capturedForm!.submit(); });
        await waitFor(() => {
            expect(onFinishFailed).toHaveBeenCalledWith({ req: '必填' });
        });
    });
});

// ─── 7. 表单提交阻止默认行为 ─────────────────────────────────────────────────
describe('Form – 阻止默认提交', () => {
    it('原生 submit 事件被 preventDefault', () => {
        const onFinish = vi.fn();
        const { container } = render(
            <Form onFinish={onFinish}><button type="submit">提交</button></Form>,
        );
        const form = container.querySelector('form')!;
        const event = new Event('submit', { bubbles: true, cancelable: true });
        fireEvent(form, event);
        // noValidate 阻止了浏览器默认行为，且 handleSubmit 也调用了 preventDefault
        expect(event.defaultPrevented).toBe(true);
    });
});
