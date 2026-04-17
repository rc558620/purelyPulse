import React from 'react';
import ProtectedRoute from '@components/business/ProtectedRoute';
import { STORAGE_KEYS } from '@constants/storageKeys';

interface CategoryGuardProps {
  children: React.ReactNode;
  fallback?: string;
  message?: string;
}

const CATEGORY_GUARD_FALLBACK = '/category-entry';
const CATEGORY_GUARD_MESSAGE = '请先录入至少一个商品分类';

const readStoredCategories = (): unknown[] => {
  const stored = localStorage.getItem(STORAGE_KEYS.CATEGORIES);
  if (!stored) return [];

  try {
    const parsed: unknown = JSON.parse(stored);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const hasCategoryAccess = (): boolean => readStoredCategories().length > 0;

const CategoryGuard: React.FC<CategoryGuardProps> = ({
  children,
  fallback = CATEGORY_GUARD_FALLBACK,
  message = CATEGORY_GUARD_MESSAGE,
}) => (
  <ProtectedRoute check={hasCategoryAccess} fallback={fallback} message={message}>
    {children}
  </ProtectedRoute>
);

export default CategoryGuard;
