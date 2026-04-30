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
import React, { useEffect, useRef } from 'react';
import { Navigate } from 'react-router-dom';
import { showToast } from '@components/ui/feedback/Toast';

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
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
    check,
    fallback,
    preloadFallback,
    message = '访问受限，请重新操作',
    children,
}) => {
    const allowed = check();
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
