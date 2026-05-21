import React, { useEffect, useMemo, useRef } from 'react';
import { Navigate } from 'react-router-dom';
import { showToast } from '@components/ui/feedback/Toast';
import { STORAGE_KEYS } from '@constants/storageKeys';

interface CategoryGuardProps {
  children: React.ReactNode;
  fallback?: string;
  preloadFallback?: () => void;
  message?: string;
}

const CATEGORY_GUARD_FALLBACK = '/category-entry';
const CATEGORY_GUARD_MESSAGE = '请先录入至少一个商品分类';

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

const CategoryGuard: React.FC<CategoryGuardProps> = ({
  children,
  fallback = CATEGORY_GUARD_FALLBACK,
  preloadFallback,
  message = CATEGORY_GUARD_MESSAGE,
}) => {
  const categories = useMemo(() => readStoredCategories(), []);
  const hasShownToast = useRef(false);
  const hasPreloadedFallback = useRef(false);
  const allowed = categories.length > 0;

  useEffect(() => {
    hasShownToast.current = false;
    hasPreloadedFallback.current = false;
  }, [message]);

  useEffect(() => {
    if (allowed) {
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

export default CategoryGuard;
