/**
 * ProtectedRoute —— 通用路由守卫组件。
 *
 * 渲染前执行 `check` 函数，若返回 false，则：
 *  1. 展示 Toast 提示
 *  2. 重定向到 `fallback` 路径
 *
 * 用法：
 * ```tsx
 * <Route
 *   path="/add-store"
 *   element={
 *     <ProtectedRoute
 *       check={() => sessionStorage.getItem('registerStep1Done') === 'true'}
 *       fallback="/register"
 *       message="请先完成账号信息填写"
 *     >
 *       <AddStore />
 *     </ProtectedRoute>
 *   }
 * />
 * ```
 */
import React, { useEffect, useMemo, useRef, useSyncExternalStore } from 'react';
import { Navigate } from 'react-router-dom';
import { showToast } from '@components/ui/feedback/Toast';

/** 外部可变数据源的订阅接口 */
export interface ProtectedRouteRecheckSource {
    subscribe: (onStoreChange: () => void) => () => void;
    getSnapshot: () => unknown;
}

interface ProtectedRouteProps {
    /** 校验函数，返回 true 表示允许进入，false 表示拦截。 */
    check: () => boolean;
    /** 校验不通过时跳转的目标路径。 */
    fallback: string;
    /** 校验不通过时提前预加载 fallback 页面 chunk。 */
    preloadFallback?: () => void;
    /** 校验不通过时展示的 Toast 提示文案。 */
    message?: string;
    /** 被守卫的子页面。 */
    children: React.ReactNode;
    /**
     * 可选：`check` 所依赖的外部可变数据源。
     *
     * 传入后，该数据源发生变化会触发本组件重新渲染，从而重新执行 `check`。
     *
     * 为什么必须由本组件自己订阅，而不是让调用方在外层订阅后重传 props：
     * 本项目启用了 React Compiler（vite.config.ts 的 babel-plugin-react-compiler），
     * 外层「仅依赖 props」的 JSX 会被缓存复用，子组件根本不会重新渲染——外层订阅
     * 因此形同失效（这个坑在真实测试中复现过）。订阅放在本组件内部，触发的是
     * 组件自身的 state 更新，与父组件的 JSX 缓存无关，行为稳定。
     */
    recheckSource?: ProtectedRouteRecheckSource;
}

/** 未传订阅源时的兜底实现：恒定快照 + 空订阅，不产生额外开销 */
const NOOP_SUBSCRIBE = (): (() => void) => () => {};
const NOOP_GET_SNAPSHOT = (): number => 0;

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
    check,
    fallback,
    preloadFallback,
    message = '访问受限，请重新操作',
    children,
    recheckSource,
}) => {
    // 始终调用（hooks 不能条件调用）：未传订阅源时退化为空实现。
    // 数据源变化 → 自身 state 更新 → 本组件重新渲染。
    const recheckToken = useSyncExternalStore(
        recheckSource?.subscribe ?? NOOP_SUBSCRIBE,
        recheckSource?.getSnapshot ?? NOOP_GET_SNAPSHOT,
        recheckSource?.getSnapshot ?? NOOP_GET_SNAPSHOT,
    );

    /**
     * 必须用 useMemo 把 recheckToken 纳入依赖，不能直接写 `const allowed = check()`。
     *
     * 原因：本项目启用了 React Compiler，它会把 `check()` 的调用结果记忆化——
     * 推断出的依赖只有 `check` 引用。于是数据源变化、组件重新渲染时，`check()`
     * 并不会被重新调用，仍然返回旧的裁决结果（此问题在真实测试中复现：
     * 组件重渲染了，但 check 始终只被调用一次）。
     *
     * 把 recheckToken 显式写进依赖后，编译器会尊重该依赖声明，token 变化即重新求值。
     */
    // check 由外部传入且不透明，lint 无法推断它依赖 recheckToken；
    // 但该依赖必须保留，否则 React Compiler 会记忆化 check() 的调用结果。
    const allowed = useMemo(
        () => check(),
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [check, recheckToken],
    );
    const hasShownToast = useRef(false);
    const hasPreloadedFallback = useRef(false);

    useEffect(() => {
        if (allowed) {
            hasPreloadedFallback.current = false;
            return;
        }

        if (!hasShownToast.current) {
            hasShownToast.current = true;
            showToast({ message, type: 'warning' });
        }

        if (!hasPreloadedFallback.current) {
            hasPreloadedFallback.current = true;
            preloadFallback?.();
        }
    }, [allowed, message, preloadFallback]);

    if (!allowed) {
        return <Navigate to={fallback} replace />;
    }

    return <>{children}</>;
};

export default ProtectedRoute;
