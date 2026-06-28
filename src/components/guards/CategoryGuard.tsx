import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { showToast } from '@components/ui/feedback/Toast';
import { STORAGE_KEYS } from '@constants/storageKeys';
import { http } from '@utils/http';

interface CategoryGuardProps {
  children: React.ReactNode;
  fallback?: string;
  preloadFallback?: () => void;
  message?: string;
}

const CATEGORY_GUARD_FALLBACK = '/category-entry';
const CATEGORY_GUARD_MESSAGE = '请先录入至少一个商品分类';

/**
 * 从 localStorage 读取分类数据（前端快速判断）。
 *
 * 注意：前端 localStorage 数据可被篡改，此仅为 UX 层快速拦截。
 * 真正的业务权限校验由后端 API 保证。
 */
const readStoredCategories = (): unknown[] => {
  try {
    const storedValue = localStorage.getItem(STORAGE_KEYS.CATEGORIES);
    if (!storedValue) {
      return [];
    }

    const parsedValue = JSON.parse(storedValue);
    return Array.isArray(parsedValue) ? parsedValue : [];
  } catch {
    return [];
  }
};

type VerificationStatus = 'pending' | 'verified' | 'rejected' | 'error';

/**
 * 验证后端是否确实存在商品分类。
 *
 * 双重校验策略：
 * 1. 前端 localStorage 快速判断（UX 层，避免每次都请求后端）
 * 2. 后端 API 验证（安全层，防止前端数据被篡改绕过）
 *
 * 当前端判断通过时，异步向后端发起验证：
 * - 验证中：不渲染内容也不重定向（等待结果）
 * - 验证通过：放行
 * - 验证拒绝（后端确认无分类）：拦截并重定向
 * - 验证失败（网络错误）：降级信任前端判断
 */
const CategoryGuard: React.FC<CategoryGuardProps> = ({
  children,
  fallback = CATEGORY_GUARD_FALLBACK,
  preloadFallback,
  message = CATEGORY_GUARD_MESSAGE,
}) => {
  const localCategories = useMemo(() => readStoredCategories(), []);
  const [verificationStatus, setVerificationStatus] = useState<VerificationStatus>(
    localCategories.length === 0 ? 'rejected' : 'pending',
  );
  const hasShownToast = useRef(false);
  const hasPreloadedFallback = useRef(false);
  const verificationStarted = useRef(false);

  // 前端快速判断：localStorage 无分类，直接拦截
  const locallyAllowed = localCategories.length > 0;

  // 异步后端校验：localStorage 有分类时，向后端确认
  useEffect(() => {
    if (!locallyAllowed || verificationStarted.current) {
      return;
    }

    verificationStarted.current = true;

    http.get<{ total?: number } | unknown[]>('/pulse/categories/count', {
      skipGlobalErrorHandler: true,
      errorMessage: '获取分类信息失败',
    }).then((response) => {
      const total = Array.isArray(response)
        ? response.length
        : (response as Record<string, unknown>).total ?? 0;
      setVerificationStatus(total > 0 ? 'verified' : 'rejected');
    }).catch(() => {
      // 后端校验失败时，仍信任前端判断（降级策略）
      setVerificationStatus('error');
    });
  }, [locallyAllowed]);

  // 最终判断
  // - locallyAllowed=false → 直接拦截
  // - locallyAllowed=true + verified → 放行
  // - locallyAllowed=true + error → 降级放行
  // - locallyAllowed=true + pending → 等待（不渲染也不重定向）
  // - locallyAllowed=true + rejected → 拦截
  const allowed = !locallyAllowed
    ? false
    : verificationStatus === 'verified' || verificationStatus === 'error';

  const isVerifying = locallyAllowed && verificationStatus === 'pending';

  useEffect(() => {
    hasShownToast.current = false;
    hasPreloadedFallback.current = false;
  }, [message]);

  useEffect(() => {
    if (allowed || isVerifying) {
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
  }, [allowed, isVerifying, message, preloadFallback]);

  // 验证中：不渲染内容也不重定向
  if (isVerifying) {
    return null;
  }

  if (!allowed) {
    return <Navigate to={fallback} replace />;
  }

  return <>{children}</>;
};

export default CategoryGuard;
