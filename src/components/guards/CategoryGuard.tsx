import React, { useEffect, useRef } from 'react';
import { Navigate } from 'react-router-dom';
import { showToast } from '@components/ui/feedback/Toast';
import { useGoodsCategories } from '@pages/main/goods/hooks/useGoodsCategories';

interface CategoryGuardProps {
  children: React.ReactNode;
  fallback?: string;
  preloadFallback?: () => void;
  message?: string;
}

const CATEGORY_GUARD_FALLBACK = '/category-entry';
const CATEGORY_GUARD_MESSAGE = '请先录入至少一个商品分类';
const CATEGORY_GUARD_ERROR_MESSAGE = '获取商品分类失败，请稍后重试';

const resolveErrorMessage = (error: unknown): string => {
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }
  return CATEGORY_GUARD_ERROR_MESSAGE;
};

const CategoryGuard: React.FC<CategoryGuardProps> = ({
  children,
  fallback = CATEGORY_GUARD_FALLBACK,
  preloadFallback,
  message = CATEGORY_GUARD_MESSAGE,
}) => {
  const { categories, loading, errorMessage, hasRequestError } = useGoodsCategories({
    resolveErrorMessage,
    suppressRefreshErrorWhenHasData: true,
  });
  const hasShownToast = useRef(false);
  const hasPreloadedFallback = useRef(false);
  const allowed = categories.length > 0;

  useEffect(() => {
    hasShownToast.current = false;
    hasPreloadedFallback.current = false;
  }, [message]);

  useEffect(() => {
    if (loading || hasRequestError || allowed) {
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
  }, [allowed, hasRequestError, loading, message, preloadFallback]);

  if (hasRequestError) {
    return <div>{errorMessage}</div>;
  }

  if (loading) {
    return null;
  }

  if (!allowed) {
    return <Navigate to={fallback} replace />;
  }

  return <>{children}</>;
};

export default CategoryGuard;
