// 商品分类 hook：为 CategoryGuard 提供分类数据加载与错误状态。
import { useCallback, useEffect, useMemo, useReducer } from 'react';
import { http, resolveEnvPath } from '@utils/http';

const CATEGORIES_API_PATH = resolveEnvPath(import.meta.env.VITE_GOODS_CATEGORIES_API_PATH, '/goods/categories');

const DEFAULT_ERROR_MESSAGE = '商品分类加载失败，请稍后重试';

const defaultResolveErrorMessage = (error: unknown): string => {
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }
  return DEFAULT_ERROR_MESSAGE;
};

export interface UseGoodsCategoriesOptions {
  resolveErrorMessage?: (error: unknown) => string;
  suppressRefreshErrorWhenHasData?: boolean;
}

export interface UseGoodsCategoriesReturn {
  categories: Array<{ id: string; name: string }>;
  loading: boolean;
  errorMessage: string;
  hasRequestError: boolean;
}

type FetchState = {
  categories: Array<{ id: string; name: string }>;
  error: unknown;
  hasFetched: boolean;
  isLoading: boolean;
};

type FetchAction =
  | { type: 'loading' }
  | { type: 'success'; categories: Array<{ id: string; name: string }> }
  | { type: 'error'; error: unknown };

const fetchReducer = (state: FetchState, action: FetchAction): FetchState => {
  switch (action.type) {
    case 'loading':
      return { ...state, isLoading: true };
    case 'success':
      return { categories: action.categories, error: null, hasFetched: true, isLoading: false };
    case 'error':
      return { ...state, error: action.error, hasFetched: true, isLoading: false };
    default:
      return state;
  }
};

const INITIAL_STATE: FetchState = {
  categories: [],
  error: null,
  hasFetched: false,
  isLoading: true,
};

export const useGoodsCategories = (
  options: UseGoodsCategoriesOptions = {},
): UseGoodsCategoriesReturn => {
  const {
    resolveErrorMessage = defaultResolveErrorMessage,
    suppressRefreshErrorWhenHasData = false,
  } = options;

  const [state, dispatch] = useReducer(fetchReducer, INITIAL_STATE);

  const fetchCategories = useCallback(async () => {
    dispatch({ type: 'loading' });
    try {
      const response = await http.get<unknown>(CATEGORIES_API_PATH, {
        skipGlobalErrorHandler: true,
        errorMessage: '获取商品分类失败',
      });

      const rawList = Array.isArray(response)
        ? response
        : (response as Record<string, unknown>)?.categories;

      const parsedCategories = Array.isArray(rawList)
        ? rawList
            .filter((item): item is Record<string, unknown> => typeof item === 'object' && item !== null)
            .map((item, index) => ({
              id: String(item.id ?? item.categoryId ?? index),
              name: String(item.name ?? item.categoryName ?? `分类${index + 1}`),
            }))
        : [];

      dispatch({ type: 'success', categories: parsedCategories });
    } catch (fetchError) {
      dispatch({ type: 'error', error: fetchError });
    }
  }, []);

  useEffect(() => {
    void fetchCategories();
  }, [fetchCategories]);

  const hasData = state.categories.length > 0;
  const hasRequestError = state.error !== null && !hasData;

  const errorMessage = useMemo(() => {
    if (state.error === null) return '';
    if (hasData && suppressRefreshErrorWhenHasData) return '';
    return resolveErrorMessage(state.error);
  }, [state.error, hasData, resolveErrorMessage, suppressRefreshErrorWhenHasData]);

  return {
    categories: state.categories,
    loading: state.isLoading && !state.hasFetched,
    errorMessage,
    hasRequestError,
  };
};
