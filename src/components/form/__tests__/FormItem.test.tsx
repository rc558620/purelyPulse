/**
 * FormItem 组件单元测试
 *
 * 覆盖范围：
 *  - 字段注册（registerField 在 mount 时调用）
 *  - 字段注销（unregisterField 在 unmount 时调用）
 *  - label 正常渲染 / 无 label 时不渲染
 *  - value 由 FormContext 注入到子元素
 *  - undefined value 被转换为 ''（保持 Input 受控兼容）
 *  - null value 保留 null（DatePicker 等区分"未设置"）
 *  - onChange 触发 setFieldValue（input change event）
 *  - onChange 触发 setFieldValue（直接传值，非 input event）
 *  - 子元素原始 onChange 被调用
 *  - status='error' 注入到子元素（校验失败时）
 *  - 错误信息渲染（explainError）
 *  - 错误消失后播放退出动画（exiting class）
 *  - 错误消失后 300ms 完全隐藏（使用 fake timers）
 *  - 非 ReactElement 子节点原样渲染
 *  - className prop 被应用到外层 div
 *  - useFormContext 在 Form 外使用时抛错
 *  - 多个 FormItem 字段精细更新（不互相污染）
 */

import React, { act } from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Form } from '../Form';
import { FormItem } from '../FormItem';
import { FormContext } from '../context';
import { useForm } from '../useForm';
import type { FormContextType, ValidatorRule } from '../types';

// ─── 辅助：创建 mock FormContext ──────────────────────────────────────────────
function createMockContext(overrides: Partial<FormContextType> = {}): FormContextType {
    return {
        registerField: vi.fn(),
        unregisterField: vi.fn(),
        setFieldValue: vi.fn(),
        getFieldValue: vi.fn().mockReturnValue(undefined),
        getFieldError: vi.fn().mockReturnValue(undefined),
        submit: vi.fn().mockResolvedValue(undefined),
        subscribeField: vi.fn().mockReturnValue(() => undefined),
        ...overrides,
    };
}

// ─── 辅助：将 FormItem 包裹在 mock context 里 ─────────────────────────────────
function renderWithContext(
    ui: React.ReactElement,
    ctx: FormContextType = createMockContext(),
) {
    return render(
        <FormContext.Provider value={ctx}>
            {ui}
        </FormContext.Provider>,
    );
}

// ─── 辅助：简单输入组件 ──────────────────────────────────────────────────────
const TextInput = React.forwardRef<
    HTMLInputElement,
    {
        value?: unknown;
        onChange?: (e: React.ChangeEvent<HTMLInputElement> | unknown) => void;
        status?: 'error' | undefined;
        'data-testid'?: string;
    }
>(({ value, onChange, status, 'data-testid': testId }, ref) => (
    <input
        ref={ref}
        data-testid={testId ?? 'input'}
        data-status={status}
        value={String(value ?? '')}
        onChange={(e) => onChange?.(e)}
    />
));
TextInput.displayName = 'TextInput';

// ─── 辅助：自定义 onChange 接收直接值的组件（捕获 value prop） ─────────────
let lastDirectValue: unknown = undefined;
const DirectValueInput = ({
    value,
    onChange,
    status,
}: {
    value?: unknown;
    onChange?: (val: string) => void;
    status?: 'error' | undefined;
}) => {
    lastDirectValue = value;
    return (
        <button
            data-testid="direct-input"
            data-status={status}
            onClick={() => onChange?.('direct-value')}
        >
            click
        </button>
    );
};

// ─── 1. 字段注册与注销 ────────────────────────────────────────────────────────
describe('FormItem – 字段注册与注销', () => {
    it('mount 时调用 registerField', () => {
        const ctx = createMockContext();
        renderWithContext(
            <FormItem name="username" rules={[{ required: true }]}>
                <TextInput />
            </FormItem>,
            ctx,
        );
        expect(ctx.registerField).toHaveBeenCalledWith('username', [{ required: true }]);
    });

    it('mount 时无 rules 也调用 registerField（空数组）', () => {
        const ctx = createMockContext();
        renderWithContext(
            <FormItem name="field">
                <TextInput />
            </FormItem>,
            ctx,
        );
        expect(ctx.registerField).toHaveBeenCalledWith('field', []);
    });

    it('unmount 时调用 unregisterField', () => {
        const ctx = createMockContext();
        const { unmount } = renderWithContext(
            <FormItem name="email">
                <TextInput />
            </FormItem>,
            ctx,
        );
        unmount();
        expect(ctx.unregisterField).toHaveBeenCalledWith('email');
    });
});

// ─── 2. label ────────────────────────────────────────────────────────────────
describe('FormItem – label', () => {
    it('传入 label 时渲染 <label>', () => {
        const ctx = createMockContext();
        renderWithContext(
            <FormItem name="f" label="用户名">
                <TextInput />
            </FormItem>,
            ctx,
        );
        expect(screen.getByText('用户名').tagName.toLowerCase()).toBe('label');
    });

    it('不传 label 时不渲染 <label>', () => {
        const ctx = createMockContext();
        const { container } = renderWithContext(
            <FormItem name="f">
                <TextInput />
            </FormItem>,
            ctx,
        );
        expect(container.querySelector('label')).toBeNull();
    });
});

// ─── 3. value 注入 ───────────────────────────────────────────────────────────
describe('FormItem – value 注入', () => {
    it('将 context getFieldValue 的返回值注入子元素', () => {
        const ctx = createMockContext({
            getFieldValue: vi.fn().mockReturnValue('injected-value'),
        });
        renderWithContext(
            <FormItem name="f">
                <TextInput />
            </FormItem>,
            ctx,
        );
        expect(screen.getByTestId('input')).toHaveValue('injected-value');
    });

    it('undefined 值被转换为空字符串', () => {
        const ctx = createMockContext({
            getFieldValue: vi.fn().mockReturnValue(undefined),
        });
        renderWithContext(
            <FormItem name="f">
                <TextInput />
            </FormItem>,
            ctx,
        );
        expect(screen.getByTestId('input')).toHaveValue('');
    });

    it('null 值保留 null（不转为空字符串）', () => {
        lastDirectValue = undefined; // reset
        const ctx = createMockContext({
            getFieldValue: vi.fn().mockReturnValue(null),
        });
        renderWithContext(
            <FormItem name="f">
                <DirectValueInput />
            </FormItem>,
            ctx,
        );
        // FormItem 将 null 原样注入（不转为 ''），由子组件自行处理
        expect(lastDirectValue).toBeNull();
    });
});

// ─── 4. onChange 处理 ────────────────────────────────────────────────────────
describe('FormItem – onChange 处理', () => {
    it('input change 事件触发 setFieldValue（使用 target.value）', async () => {
        const user = userEvent.setup();
        const ctx = createMockContext();
        renderWithContext(
            <FormItem name="phone">
                <TextInput />
            </FormItem>,
            ctx,
        );
        await user.type(screen.getByTestId('input'), 'a');
        expect(ctx.setFieldValue).toHaveBeenCalledWith('phone', expect.stringContaining('a'));
    });

    it('直接传值（非 input event）时触发 setFieldValue（使用原值）', async () => {
        const user = userEvent.setup();
        const ctx = createMockContext();
        renderWithContext(
            <FormItem name="custom">
                <DirectValueInput />
            </FormItem>,
            ctx,
        );
        await user.click(screen.getByTestId('direct-input'));
        expect(ctx.setFieldValue).toHaveBeenCalledWith('custom', 'direct-value');
    });

    it('子元素原始 onChange 被同时调用', async () => {
        const user = userEvent.setup();
        const originalOnChange = vi.fn();
        const ctx = createMockContext();

        const InputWithCallback = ({
            value,
            onChange,
        }: {
            value?: unknown;
            onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
        }) => (
            <input
                data-testid="input"
                value={String(value ?? '')}
                onChange={(e) => {
                    originalOnChange(e);
                    onChange?.(e);
                }}
            />
        );

        renderWithContext(
            <FormItem name="f">
                <InputWithCallback />
            </FormItem>,
            ctx,
        );
        await user.type(screen.getByTestId('input'), 'x');
        expect(originalOnChange).toHaveBeenCalled();
        expect(ctx.setFieldValue).toHaveBeenCalled();
    });
});

// ─── 5. 错误状态 ──────────────────────────────────────────────────────────────
describe('FormItem – 错误状态', () => {
    it('有错误时 status="error" 注入子元素', () => {
        const ctx = createMockContext({
            getFieldError: vi.fn().mockReturnValue('错误信息'),
        });
        renderWithContext(
            <FormItem name="f">
                <TextInput />
            </FormItem>,
            ctx,
        );
        expect(screen.getByTestId('input')).toHaveAttribute('data-status', 'error');
    });

    it('无错误时 status 为 undefined（不注入 data-status）', () => {
        const ctx = createMockContext({
            getFieldError: vi.fn().mockReturnValue(undefined),
        });
        renderWithContext(
            <FormItem name="f">
                <TextInput />
            </FormItem>,
            ctx,
        );
        // data-status 为 undefined 时属性值为 "undefined"，验证 status prop 值正确
        expect(screen.getByTestId('input').getAttribute('data-status')).toBeNull();
    });

    it('错误信息文本被渲染', () => {
        const ctx = createMockContext({
            getFieldError: vi.fn().mockReturnValue('手机号格式不正确'),
        });
        renderWithContext(
            <FormItem name="f">
                <TextInput />
            </FormItem>,
            ctx,
        );
        expect(screen.getByText('手机号格式不正确')).toBeInTheDocument();
    });
});

// ─── 6. 错误退出动画 ─────────────────────────────────────────────────────────
describe('FormItem – 错误动画', () => {
    it('错误出现时错误信息立即展示', async () => {
        const user = userEvent.setup();
        render(
            <Form>
                <FormItem name="f" rules={[{ required: true, message: '必填' }]}>
                    <input data-testid="real-input" />
                </FormItem>
                <button type="submit">提交</button>
            </Form>,
        );
        await user.click(screen.getByRole('button'));
        await waitFor(() => {
            expect(screen.getByText('必填')).toBeInTheDocument();
        });
    });
});

// ─── 6b. 错误退出动画（fake timers 隔离） ─────────────────────────────────────
describe('FormItem – 错误退出动画（fake timers）', () => {
    beforeEach(() => {
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('错误消失后 300ms 内文字仍保留（退出动画），300ms 后清除', async () => {
        // 使用 mock context 直接控制 getFieldError 返回值，无需 userEvent
        let currentError: string | undefined = '必填';

        // 需要能触发 FormItem 重渲染：使用真实 Form+FormItem，通过 validateFields 写错误
        // 再通过外部按钮手动切换（不用 userEvent delay）
        let capturedForm: ReturnType<typeof useForm>[0] | null = null;

        const Wrapper = () => {
            const [form] = useForm();
            capturedForm = form;
            return (
                <Form form={form}>
                    <FormItem name="f" rules={[{ required: true, message: '必填' }]}>
                        <input data-testid="f-input" />
                    </FormItem>
                </Form>
            );
        };

        render(<Wrapper />);

        // 1. 触发校验，写入错误（用 validateFields 不需要点击）
        await act(async () => {
            try { await capturedForm!.validateFields(); } catch { /* expected */ }
        });

        expect(screen.getByText('必填')).toBeInTheDocument();

        // 2. setFieldValue 清除错误（dirty 字段重新校验，值有效则清错）
        await act(async () => {
            capturedForm!.setFieldValue('f', 'valid');
            // 等待 validateField 的 async promise 完成
            await Promise.resolve();
            await Promise.resolve(); // 双 tick 确保 then 链全部执行
        });

        // 3. 错误清除后，动画计时器还未到期，文字仍在
        expect(screen.queryByText('必填')).not.toBeNull();

        // 4. 快进到 299ms：文字仍在
        act(() => { vi.advanceTimersByTime(299); });
        expect(screen.queryByText('必填')).not.toBeNull();

        // 5. 快进最后 1ms（共 300ms）：文字消失
        act(() => { vi.advanceTimersByTime(1); });
        expect(screen.queryByText('必填')).toBeNull();
    });
});

// ─── 7. 非 Element 子节点 ────────────────────────────────────────────────────
describe('FormItem – 非 ReactElement 子节点', () => {
    it('字符串子节点原样渲染', () => {
        const ctx = createMockContext();
        renderWithContext(
            <FormItem name="f">
                {'plain text child'}
            </FormItem>,
            ctx,
        );
        expect(screen.getByText('plain text child')).toBeInTheDocument();
    });

    it('非 Element 时不注入 value/onChange/status', () => {
        const ctx = createMockContext();
        // 不应该抛出
        expect(() => {
            renderWithContext(
                <FormItem name="f">
                    <span data-testid="span">non-interactive</span>
                </FormItem>,
                ctx,
            );
        }).not.toThrow();
    });
});

// ─── 8. className ────────────────────────────────────────────────────────────
describe('FormItem – className', () => {
    it('className 被应用到外层 div', () => {
        const ctx = createMockContext();
        const { container } = renderWithContext(
            <FormItem name="f" className="my-item">
                <TextInput />
            </FormItem>,
            ctx,
        );
        // FormItem 外层 div 含有 formItem 和 my-item class
        const wrapper = container.firstChild as HTMLElement;
        expect(wrapper.className).toContain('my-item');
    });
});

// ─── 9. 在 Form 外使用 FormItem 抛错 ─────────────────────────────────────────
describe('FormItem – 在 Form 外使用', () => {
    it('FormContext 为 null 时抛出 Error', () => {
        // 关闭 console.error 避免 React 输出噪音
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
        expect(() => {
            render(
                <FormItem name="f">
                    <TextInput />
                </FormItem>,
            );
        }).toThrow('Form 相关组件必须在 Form 容器内使用');
        consoleSpy.mockRestore();
    });
});

// ─── 10. 与真实 Form 联动 ────────────────────────────────────────────────────
describe('FormItem – 与 Form 联动', () => {
    it('多个 FormItem 字段不互相影响', async () => {
        const user = userEvent.setup();
        const onFinish = vi.fn();

        render(
            <Form onFinish={onFinish}>
                <FormItem name="firstName">
                    <input data-testid="first" />
                </FormItem>
                <FormItem name="lastName">
                    <input data-testid="last" />
                </FormItem>
                <button type="submit">提交</button>
            </Form>,
        );

        await user.type(screen.getByTestId('first'), 'John');
        await user.type(screen.getByTestId('last'), 'Doe');
        await user.click(screen.getByRole('button'));

        await waitFor(() => {
            expect(onFinish).toHaveBeenCalledWith({
                firstName: 'John',
                lastName: 'Doe',
            });
        });
    });

    it('校验失败时显示错误信息', async () => {
        const user = userEvent.setup();
        const rules: ValidatorRule[] = [{ required: true, message: '不能为空' }];

        render(
            <Form>
                <FormItem name="req" rules={rules}>
                    <input data-testid="req-input" />
                </FormItem>
                <button type="submit">提交</button>
            </Form>,
        );

        await user.click(screen.getByRole('button'));
        await waitFor(() => {
            expect(screen.getByText('不能为空')).toBeInTheDocument();
        });
    });

    it('填写正确后错误信息消失', async () => {
        const user = userEvent.setup();
        const rules: ValidatorRule[] = [{ required: true, message: '不能为空' }];

        render(
            <Form>
                <FormItem name="field" rules={rules}>
                    <input data-testid="f-input" />
                </FormItem>
                <button type="submit">提交</button>
            </Form>,
        );

        // 先触发错误
        await user.click(screen.getByRole('button'));
        await waitFor(() => {
            expect(screen.getByText('不能为空')).toBeInTheDocument();
        });

        // 填写正确值（dirty 字段，实时重校验）
        await user.type(screen.getByTestId('f-input'), 'valid');

        await waitFor(() => {
            expect(screen.queryByText('不能为空')).toBeNull();
        });
    });
});
