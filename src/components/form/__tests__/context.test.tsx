/**
 * Form Context 单元测试
 *
 * 覆盖范围：
 *  - FormContext 创建（默认值为 null）
 *  - useFormContext 在 Provider 内正常返回 context
 *  - useFormContext 在 Provider 外（context=null）抛出 Error
 *  - useFormContext 错误信息符合预期
 *  - Provider value 变化时 consumer 得到最新值
 */

import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { renderHook } from '@testing-library/react';
import { FormContext, useFormContext } from '../context';
import type { FormContextType } from '../types';

// ─── 辅助：创建 mock FormContext value ──────────────────────────────────────
function createMockCtx(overrides: Partial<FormContextType> = {}): FormContextType {
    return {
        requiredMark: true,
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

// ─── 1. FormContext 默认值 ────────────────────────────────────────────────────
describe('FormContext – 默认值', () => {
    it('FormContext 默认值为 null', () => {
        const { result } = renderHook(() => React.useContext(FormContext));
        expect(result.current).toBeNull();
    });
});

// ─── 2. useFormContext 正常使用 ───────────────────────────────────────────────
describe('useFormContext – 正常使用', () => {
    it('在 Provider 内返回 context 对象', () => {
        const ctx = createMockCtx();
        const { result } = renderHook(() => useFormContext(), {
            wrapper: ({ children }) => (
                <FormContext.Provider value={ctx}>
                    {children}
                </FormContext.Provider>
            ),
        });
        expect(result.current).toBe(ctx);
    });

    it('context 包含所有必要方法', () => {
        const ctx = createMockCtx();
        const { result } = renderHook(() => useFormContext(), {
            wrapper: ({ children }) => (
                <FormContext.Provider value={ctx}>
                    {children}
                </FormContext.Provider>
            ),
        });
        const c = result.current;
        expect(typeof c.registerField).toBe('function');
        expect(typeof c.unregisterField).toBe('function');
        expect(typeof c.setFieldValue).toBe('function');
        expect(typeof c.getFieldValue).toBe('function');
        expect(typeof c.getFieldError).toBe('function');
        expect(typeof c.submit).toBe('function');
        expect(typeof c.subscribeField).toBe('function');
    });

    it('Provider value 更新后 consumer 得到最新值', () => {
        const ctx1 = createMockCtx({ getFieldValue: vi.fn().mockReturnValue('v1') });
        const ctx2 = createMockCtx({ getFieldValue: vi.fn().mockReturnValue('v2') });

        const Consumer = ({ val }: { val: string }) => {
            return <span data-testid="val">{val}</span>;
        };

        const Wrapper = () => {
            const c = useFormContext();
            return <Consumer val={String(c.getFieldValue('f'))} />;
        };

        const { rerender } = render(
            <FormContext.Provider value={ctx1}>
                <Wrapper />
            </FormContext.Provider>,
        );
        expect(screen.getByTestId('val').textContent).toBe('v1');

        rerender(
            <FormContext.Provider value={ctx2}>
                <Wrapper />
            </FormContext.Provider>,
        );
        expect(screen.getByTestId('val').textContent).toBe('v2');
    });
});

// ─── 3. useFormContext 抛错 ───────────────────────────────────────────────────
describe('useFormContext – 在 Form 外使用', () => {
    it('context 为 null 时抛出 Error', () => {
        // 抑制 React 的错误边界日志输出
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);

        expect(() => {
            renderHook(() => useFormContext());
        }).toThrow();

        consoleSpy.mockRestore();
    });

    it('错误信息包含"Form 相关组件必须在 Form 容器内使用"', () => {
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);

        expect(() => {
            renderHook(() => useFormContext());
        }).toThrow('Form 相关组件必须在 Form 容器内使用');

        consoleSpy.mockRestore();
    });

    it('context 非 null 时不抛出错误', () => {
        const ctx = createMockCtx();
        expect(() => {
            renderHook(() => useFormContext(), {
                wrapper: ({ children }) => (
                    <FormContext.Provider value={ctx}>
                        {children}
                    </FormContext.Provider>
                ),
            });
        }).not.toThrow();
    });
});

// ─── 4. FormContext Provider 多层嵌套 ────────────────────────────────────────
describe('FormContext – 多层嵌套', () => {
    it('内层 Provider 覆盖外层 Provider', () => {
        const outerCtx = createMockCtx({ getFieldValue: vi.fn().mockReturnValue('outer') });
        const innerCtx = createMockCtx({ getFieldValue: vi.fn().mockReturnValue('inner') });

        const Consumer = () => {
            const ctx = useFormContext();
            return <span data-testid="inner-val">{String(ctx.getFieldValue('x'))}</span>;
        };

        render(
            <FormContext.Provider value={outerCtx}>
                <FormContext.Provider value={innerCtx}>
                    <Consumer />
                </FormContext.Provider>
            </FormContext.Provider>,
        );

        expect(screen.getByTestId('inner-val').textContent).toBe('inner');
    });
});
