/**
 * ProtectedRoute 组件单元测试
 *
 * 覆盖范围：
 *  ─ 通过校验（check 返回 true）
 *    1.  渲染 children 内容
 *    2.  不渲染 Navigate（不重定向）
 *    3.  不调用 showToast
 *    4.  children 为复杂节点时正常渲染
 *    5.  多个 children 正常渲染
 *  ─ 拦截校验（check 返回 false）
 *    6.  不渲染 children 内容
 *    7.  渲染 Navigate（重定向到 fallback 路径）
 *    8.  showToast 被调用（message 为自定义文案）
 *    9.  showToast 类型为 'warning'
 *    10. showToast 仅被调用一次（不重复触发）
 *    11. fallback 路径为 "/" 时 Navigate to="/"
 *    12. fallback 路径为 "/login" 时 Navigate to="/login"
 *  ─ 默认 message
 *    13. 不传 message 时 showToast 使用默认文案「访问受限，请重新操作」
 *  ─ 自定义 message
 *    14. 传入 message="请先登录" 时 showToast 使用该文案
 *  ─ check 变化场景
 *    15. check 从 false 变为 true 时 children 重新出现
 *    16. check 从 true 变为 false 时 children 消失并 showToast 被调用
 *  ─ Navigate 属性
 *    17. Navigate 使用 replace 模式（replace prop 为 true）
 *  ─ showToast 幂等性
 *    18. 相同 false check rerender 多次，showToast 不重复调用（hasShownToast ref 保护）
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import ProtectedRoute from '../ProtectedRoute/index';

// ─── mock showToast ───────────────────────────────────────────────────────────
const mockShowToast = vi.fn();
vi.mock('@components/ui/feedback/Toast', () => ({
    showToast: (...args: unknown[]) => mockShowToast(...args),
}));

// ─── mock react-router-dom Navigate ──────────────────────────────────────────
// 用 data-testid 标记 Navigate 被渲染，并暴露 to/replace 属性
vi.mock('react-router-dom', async (importOriginal) => {
    const actual = await importOriginal<typeof import('react-router-dom')>();
    return {
        ...actual,
        Navigate: ({ to, replace }: { to: string; replace?: boolean }) => (
            <div
                data-testid="mock-navigate"
                data-to={to}
                data-replace={String(replace)}
            />
        ),
    };
});

// ─────────────────────────────────────────────────────────────────────────────
// 辅助：渲染 ProtectedRoute
// ─────────────────────────────────────────────────────────────────────────────
function renderRoute(overrides: Partial<React.ComponentProps<typeof ProtectedRoute>> = {}) {
    const defaults = {
        check: () => true,
        fallback: '/login',
        children: <span data-testid="protected-content">受保护内容</span>,
    };
    return render(
        <MemoryRouter>
            <ProtectedRoute {...defaults} {...overrides} />
        </MemoryRouter>,
    );
}

// ─── 1. 通过校验（check 返回 true） ──────────────────────────────────────────
describe('ProtectedRoute – 校验通过', () => {
    beforeEach(() => {
        mockShowToast.mockClear();
    });

    it('渲染 children 内容', () => {
        renderRoute({ check: () => true });
        expect(screen.getByTestId('protected-content')).toBeInTheDocument();
        expect(screen.getByText('受保护内容')).toBeInTheDocument();
    });

    it('不渲染 Navigate（不重定向）', () => {
        renderRoute({ check: () => true });
        expect(screen.queryByTestId('mock-navigate')).toBeNull();
    });

    it('校验通过时不调用 showToast', () => {
        renderRoute({ check: () => true });
        expect(mockShowToast).not.toHaveBeenCalled();
    });

    it('children 为复杂节点时正常渲染', () => {
        renderRoute({
            check: () => true,
            children: (
                <div data-testid="complex-child">
                    <h1>标题</h1>
                    <p>段落</p>
                </div>
            ),
        });
        expect(screen.getByTestId('complex-child')).toBeInTheDocument();
        expect(screen.getByText('标题')).toBeInTheDocument();
        expect(screen.getByText('段落')).toBeInTheDocument();
    });

    it('多个 children 包裹在 Fragment 中正常渲染', () => {
        renderRoute({
            check: () => true,
            children: (
                <>
                    <span data-testid="child-1">子节点1</span>
                    <span data-testid="child-2">子节点2</span>
                </>
            ),
        });
        expect(screen.getByTestId('child-1')).toBeInTheDocument();
        expect(screen.getByTestId('child-2')).toBeInTheDocument();
    });
});

// ─── 2. 拦截校验（check 返回 false） ─────────────────────────────────────────
describe('ProtectedRoute – 校验拦截', () => {
    beforeEach(() => {
        mockShowToast.mockClear();
    });

    it('不渲染 children 内容', () => {
        renderRoute({ check: () => false });
        expect(screen.queryByTestId('protected-content')).toBeNull();
        expect(screen.queryByText('受保护内容')).toBeNull();
    });

    it('渲染 Navigate 组件（重定向）', () => {
        renderRoute({ check: () => false });
        expect(screen.getByTestId('mock-navigate')).toBeInTheDocument();
    });

    it('Navigate to 为传入的 fallback 路径', () => {
        renderRoute({ check: () => false, fallback: '/register' });
        expect(screen.getByTestId('mock-navigate')).toHaveAttribute('data-to', '/register');
    });

    it('fallback 为 "/" 时 Navigate to="/"', () => {
        renderRoute({ check: () => false, fallback: '/' });
        expect(screen.getByTestId('mock-navigate')).toHaveAttribute('data-to', '/');
    });

    it('fallback 为 "/login" 时 Navigate to="/login"', () => {
        renderRoute({ check: () => false, fallback: '/login' });
        expect(screen.getByTestId('mock-navigate')).toHaveAttribute('data-to', '/login');
    });

    it('showToast 被调用（message 为传入的自定义文案）', () => {
        renderRoute({ check: () => false, message: '请先完成信息填写' });
        expect(mockShowToast).toHaveBeenCalledWith(
            expect.objectContaining({ message: '请先完成信息填写' }),
        );
    });

    it('showToast type 为 "warning"', () => {
        renderRoute({ check: () => false, message: '无权访问' });
        expect(mockShowToast).toHaveBeenCalledWith(
            expect.objectContaining({ type: 'warning' }),
        );
    });

    it('showToast 仅被调用一次（初次渲染后不重复）', () => {
        renderRoute({ check: () => false });
        expect(mockShowToast).toHaveBeenCalledTimes(1);
    });

    it('Navigate 使用 replace=true 模式', () => {
        renderRoute({ check: () => false });
        expect(screen.getByTestId('mock-navigate')).toHaveAttribute('data-replace', 'true');
    });
});

// ─── 3. 默认 message ──────────────────────────────────────────────────────────
describe('ProtectedRoute – 默认 message', () => {
    beforeEach(() => {
        mockShowToast.mockClear();
    });

    it('不传 message 时使用默认文案「访问受限，请重新操作」', () => {
        renderRoute({ check: () => false });
        expect(mockShowToast).toHaveBeenCalledWith(
            expect.objectContaining({ message: '访问受限，请重新操作' }),
        );
    });
});

// ─── 4. 自定义 message ────────────────────────────────────────────────────────
describe('ProtectedRoute – 自定义 message', () => {
    beforeEach(() => {
        mockShowToast.mockClear();
    });

    it('传入 message="请先登录" 时 showToast 使用该文案', () => {
        renderRoute({ check: () => false, message: '请先登录' });
        expect(mockShowToast).toHaveBeenCalledWith(
            expect.objectContaining({ message: '请先登录' }),
        );
    });

    it('传入 message="请先完成账号信息填写" 时 showToast 使用该文案', () => {
        renderRoute({ check: () => false, message: '请先完成账号信息填写' });
        expect(mockShowToast).toHaveBeenCalledWith(
            expect.objectContaining({ message: '请先完成账号信息填写' }),
        );
    });
});

// ─── 5. check 变化场景 ────────────────────────────────────────────────────────
describe('ProtectedRoute – check 动态变化', () => {
    beforeEach(() => {
        mockShowToast.mockClear();
    });

    it('check 从 false 变为 true 时 children 出现，Navigate 消失', () => {
        let allowed = false;
        const { rerender } = renderRoute({ check: () => allowed });
        expect(screen.queryByTestId('protected-content')).toBeNull();
        expect(screen.getByTestId('mock-navigate')).toBeInTheDocument();

        // 更新 allowed
        allowed = true;
        rerender(
            <MemoryRouter>
                <ProtectedRoute check={() => allowed} fallback="/login">
                    <span data-testid="protected-content">受保护内容</span>
                </ProtectedRoute>
            </MemoryRouter>,
        );

        expect(screen.getByTestId('protected-content')).toBeInTheDocument();
        expect(screen.queryByTestId('mock-navigate')).toBeNull();
    });

    it('check 从 true 变为 false 时 children 消失，Navigate 出现', () => {
        let allowed = true;
        const { rerender } = renderRoute({ check: () => allowed });
        expect(screen.getByTestId('protected-content')).toBeInTheDocument();

        allowed = false;
        rerender(
            <MemoryRouter>
                <ProtectedRoute check={() => allowed} fallback="/login">
                    <span data-testid="protected-content">受保护内容</span>
                </ProtectedRoute>
            </MemoryRouter>,
        );

        expect(screen.queryByTestId('protected-content')).toBeNull();
        expect(screen.getByTestId('mock-navigate')).toBeInTheDocument();
    });

    it('check 从 true 变为 false 后 showToast 被调用', () => {
        let allowed = true;
        const { rerender } = renderRoute({ check: () => allowed, message: '权限已失效' });
        expect(mockShowToast).not.toHaveBeenCalled();

        allowed = false;
        rerender(
            <MemoryRouter>
                <ProtectedRoute check={() => allowed} fallback="/login" message="权限已失效">
                    <span data-testid="protected-content">受保护内容</span>
                </ProtectedRoute>
            </MemoryRouter>,
        );

        expect(mockShowToast).toHaveBeenCalledWith(
            expect.objectContaining({ message: '权限已失效', type: 'warning' }),
        );
    });
});

// ─── 6. showToast 幂等性（hasShownToast ref 保护） ────────────────────────────
describe('ProtectedRoute – showToast 幂等性', () => {
    beforeEach(() => {
        mockShowToast.mockClear();
    });

    it('check=false 的情况下多次 rerender，showToast 不重复调用', () => {
        const { rerender } = renderRoute({ check: () => false, message: '无权访问' });
        // 第一次渲染后已调用一次
        expect(mockShowToast).toHaveBeenCalledTimes(1);

        // 同一组件实例 rerender（check 仍为 false）
        rerender(
            <MemoryRouter>
                <ProtectedRoute check={() => false} fallback="/login" message="无权访问">
                    <span data-testid="protected-content">受保护内容</span>
                </ProtectedRoute>
            </MemoryRouter>,
        );
        // hasShownToast.current 已为 true，不应再次调用
        expect(mockShowToast).toHaveBeenCalledTimes(1);
    });
});

// ─── 7. fallback preload ─────────────────────────────────────────────────────
describe('ProtectedRoute – fallback preload', () => {
    beforeEach(() => {
        mockShowToast.mockClear();
    });

    it('校验通过时不预加载 fallback 页面', () => {
        const preloadFallback = vi.fn();
        renderRoute({ check: () => true, preloadFallback });
        expect(preloadFallback).not.toHaveBeenCalled();
    });

    it('校验失败时预加载 fallback 页面', () => {
        const preloadFallback = vi.fn();
        renderRoute({ check: () => false, preloadFallback });
        expect(preloadFallback).toHaveBeenCalledTimes(1);
    });

    it('check=false 的情况下多次 rerender，fallback preload 不重复调用', () => {
        const preloadFallback = vi.fn();
        const { rerender } = renderRoute({ check: () => false, preloadFallback });
        expect(preloadFallback).toHaveBeenCalledTimes(1);

        rerender(
            <MemoryRouter>
                <ProtectedRoute
                    check={() => false}
                    fallback="/login"
                    preloadFallback={preloadFallback}
                >
                    <span data-testid="protected-content">受保护内容</span>
                </ProtectedRoute>
            </MemoryRouter>,
        );
        expect(preloadFallback).toHaveBeenCalledTimes(1);
    });
});

// ─── 8. 多种 fallback 路径 ────────────────────────────────────────────────────
describe('ProtectedRoute – 多种 fallback 路径', () => {
    beforeEach(() => {
        mockShowToast.mockClear();
    });

    const paths = ['/login', '/register', '/home', '/', '/auth/step1'];

    paths.forEach((path) => {
        it(`fallback="${path}" 时 Navigate to="${path}"`, () => {
            renderRoute({ check: () => false, fallback: path });
            expect(screen.getByTestId('mock-navigate')).toHaveAttribute('data-to', path);
        });
    });
});

// ─── 9. 不同 children 类型 ────────────────────────────────────────────────────
describe('ProtectedRoute – 不同 children 类型', () => {
    beforeEach(() => {
        mockShowToast.mockClear();
    });

    it('children 为字符串时正常渲染', () => {
        renderRoute({ check: () => true, children: '纯文本内容' });
        expect(screen.getByText('纯文本内容')).toBeInTheDocument();
    });

    it('children 为数字时正常渲染', () => {
        renderRoute({ check: () => true, children: 42 as unknown as React.ReactNode });
        expect(screen.getByText('42')).toBeInTheDocument();
    });

    it('children 为 null 时不抛出异常', () => {
        expect(() => {
            renderRoute({ check: () => true, children: null });
        }).not.toThrow();
    });
});

// ─── 10. false → true → false 状态迁移（toast 重置行为） ─────────────────────
describe('ProtectedRoute – false→true→false 状态迁移', () => {
    beforeEach(() => {
        mockShowToast.mockClear();
    });

    /**
     * 关键行为说明：
     *
     * ProtectedRoute 内部用 hasShownToast ref 保护 toast 的重复调用。
     * 当 allowed 变为 true 时，hasPreloadedFallback 会被重置，但 hasShownToast **不会重置**。
     * 所以：false → true → false 的完整迁移后，toast **不会再次触发**。
     *
     * 这是当前实现的既定行为。以下测试确认该行为是明确的、稳定的。
     * 如果产品需求改成"重新拦截时也要提示"，则 ProtectedRoute 实现需同步修改。
     */

    it('false → true 后 Navigate 消失，children 出现', () => {
        let allowed = false;
        const { rerender } = renderRoute({ check: () => allowed });
        expect(screen.getByTestId('mock-navigate')).toBeInTheDocument();
        expect(screen.queryByTestId('protected-content')).toBeNull();

        allowed = true;
        rerender(
            <MemoryRouter>
                <ProtectedRoute check={() => allowed} fallback="/login">
                    <span data-testid="protected-content">受保护内容</span>
                </ProtectedRoute>
            </MemoryRouter>,
        );

        expect(screen.queryByTestId('mock-navigate')).toBeNull();
        expect(screen.getByTestId('protected-content')).toBeInTheDocument();
    });

    it('false → true 后 showToast 不再重复调用', () => {
        let allowed = false;
        const { rerender } = renderRoute({ check: () => allowed, message: '迁移测试' });
        expect(mockShowToast).toHaveBeenCalledTimes(1);

        allowed = true;
        rerender(
            <MemoryRouter>
                <ProtectedRoute check={() => allowed} fallback="/login" message="迁移测试">
                    <span data-testid="protected-content">受保护内容</span>
                </ProtectedRoute>
            </MemoryRouter>,
        );
        // 变为 allowed=true，不应新增 toast 调用
        expect(mockShowToast).toHaveBeenCalledTimes(1);
    });

    it('false → true → false：由于 hasShownToast 不重置，toast 不再触发（当前实现行为）', () => {
        let allowed = false;
        const { rerender } = renderRoute({ check: () => allowed, message: '三段迁移' });
        expect(mockShowToast).toHaveBeenCalledTimes(1);

        // → true
        allowed = true;
        rerender(
            <MemoryRouter>
                <ProtectedRoute check={() => allowed} fallback="/login" message="三段迁移">
                    <span data-testid="protected-content">受保护内容</span>
                </ProtectedRoute>
            </MemoryRouter>,
        );
        expect(mockShowToast).toHaveBeenCalledTimes(1);

        // → false 再次
        allowed = false;
        rerender(
            <MemoryRouter>
                <ProtectedRoute check={() => allowed} fallback="/login" message="三段迁移">
                    <span data-testid="protected-content">受保护内容</span>
                </ProtectedRoute>
            </MemoryRouter>,
        );

        // 当前实现：hasShownToast 未重置，toast 不再调用
        // 如果你的需求是"再次拦截时仍要提示"，请修改 ProtectedRoute 并更新此断言
        expect(mockShowToast).toHaveBeenCalledTimes(1);
        expect(screen.getByTestId('mock-navigate')).toBeInTheDocument();
        expect(screen.queryByTestId('protected-content')).toBeNull();
    });

    it('false → true → false：hasPreloadedFallback 在 true 时被重置，false 时再次预加载', () => {
        const preloadFallback = vi.fn();
        let allowed = false;

        const { rerender } = renderRoute({ check: () => allowed, preloadFallback });
        expect(preloadFallback).toHaveBeenCalledTimes(1);

        // → true（hasPreloadedFallback 重置）
        allowed = true;
        rerender(
            <MemoryRouter>
                <ProtectedRoute
                    check={() => allowed}
                    fallback="/login"
                    preloadFallback={preloadFallback}
                >
                    <span data-testid="protected-content">受保护内容</span>
                </ProtectedRoute>
            </MemoryRouter>,
        );

        // → false（hasPreloadedFallback 已重置，应再次预加载）
        allowed = false;
        rerender(
            <MemoryRouter>
                <ProtectedRoute
                    check={() => allowed}
                    fallback="/login"
                    preloadFallback={preloadFallback}
                >
                    <span data-testid="protected-content">受保护内容</span>
                </ProtectedRoute>
            </MemoryRouter>,
        );

        // hasPreloadedFallback 在 true 时被重置，所以这次 false 应再次触发 preload
        expect(preloadFallback).toHaveBeenCalledTimes(2);
    });
});

// ─── 11. check 函数本身可以有副作用（同步执行，渲染时调用） ──────────────────
describe('ProtectedRoute – check 函数调用时机', () => {
    beforeEach(() => {
        mockShowToast.mockClear();
    });

    it('check 在渲染期间同步调用', () => {
        const check = vi.fn(() => true);
        renderRoute({ check });
        expect(check).toHaveBeenCalled();
    });

    it('rerender 时 check 再次被调用', () => {
        const check = vi.fn(() => true);
        const { rerender } = renderRoute({ check });
        const callsBefore = check.mock.calls.length;

        rerender(
            <MemoryRouter>
                <ProtectedRoute check={check} fallback="/login">
                    <span data-testid="protected-content">受保护内容</span>
                </ProtectedRoute>
            </MemoryRouter>,
        );
        expect(check.mock.calls.length).toBeGreaterThan(callsBefore);
    });

    it('check 抛出异常时，异常向上冒泡（不被静默吞掉）', () => {
        const check = () => { throw new Error('check error'); };
        expect(() => renderRoute({ check })).toThrow('check error');
    });
});
