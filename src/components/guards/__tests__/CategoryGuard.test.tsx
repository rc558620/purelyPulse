import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import CategoryGuard from '../CategoryGuard';

const mocks = vi.hoisted(() => ({
  showToast: vi.fn(),
  useGoodsCategories: vi.fn(),
}));

vi.mock('@components/ui/feedback/Toast', () => ({
  showToast: mocks.showToast,
}));

vi.mock('@pages/main/goods/hooks/useGoodsCategories', () => ({
  useGoodsCategories: (options?: unknown) => mocks.useGoodsCategories(options),
}));

vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>();
  return {
    ...actual,
    Navigate: ({ to, replace }: { to: string; replace?: boolean }) => (
      <div data-testid="mock-navigate" data-to={to} data-replace={String(replace)} />
    ),
  };
});

const renderCategoryGuard = (props: Partial<React.ComponentProps<typeof CategoryGuard>> = {}) =>
  render(
    <CategoryGuard {...props}>
      <div data-testid="guarded-content">商品录入页</div>
    </CategoryGuard>,
  );

describe('CategoryGuard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.useGoodsCategories.mockReturnValue({
      categories: [],
      categoryOptions: [],
      loading: false,
      errorMessage: null,
      hasRequestError: false,
    });
  });

  it('默认按共享分类字典消费 useGoodsCategories', () => {
    renderCategoryGuard();

    expect(mocks.useGoodsCategories).toHaveBeenCalledWith({
      resolveErrorMessage: expect.any(Function),
      suppressRefreshErrorWhenHasData: true,
    });
  });

  it('有分类时直接放行', async () => {
    mocks.useGoodsCategories.mockReturnValue({
      categories: [{ id: '1', name: '奶茶', createdAt: Date.now() }],
      categoryOptions: [{ label: '奶茶', value: '奶茶' }],
      loading: false,
      errorMessage: null,
      hasRequestError: false,
    });

    renderCategoryGuard();

    await waitFor(() => {
      expect(screen.getByTestId('guarded-content')).toBeInTheDocument();
    });
    expect(screen.queryByTestId('mock-navigate')).toBeNull();
    expect(mocks.showToast).not.toHaveBeenCalled();
  });

  it('无分类时重定向并提示', async () => {
    renderCategoryGuard();

    await waitFor(() => {
      expect(screen.getByTestId('mock-navigate')).toHaveAttribute('data-to', '/category-entry');
    });
    expect(screen.getByTestId('mock-navigate')).toHaveAttribute('data-replace', 'true');
    expect(mocks.showToast).toHaveBeenCalledWith({
      message: '请先录入至少一个商品分类',
      type: 'warning',
    });
  });

  it('支持透传自定义 fallback、message 和 preloadFallback', async () => {
    const preloadFallback = vi.fn();

    renderCategoryGuard({
      fallback: '/custom-category-entry',
      message: '请先创建分类后再录入商品',
      preloadFallback,
    });

    await waitFor(() => {
      expect(screen.getByTestId('mock-navigate')).toHaveAttribute('data-to', '/custom-category-entry');
    });
    expect(mocks.showToast).toHaveBeenCalledWith({
      message: '请先创建分类后再录入商品',
      type: 'warning',
    });
    expect(preloadFallback).toHaveBeenCalledTimes(1);
  });

  it('请求失败时展示错误而不重定向', async () => {
    mocks.useGoodsCategories.mockReturnValue({
      categories: [],
      categoryOptions: [],
      loading: false,
      errorMessage: '获取分类失败',
      hasRequestError: true,
    });

    renderCategoryGuard();

    await waitFor(() => {
      expect(screen.getByText('获取分类失败')).toBeInTheDocument();
    });
    expect(screen.queryByTestId('mock-navigate')).toBeNull();
    expect(mocks.showToast).not.toHaveBeenCalled();
  });

  it('加载中不渲染内容也不提前跳转', () => {
    mocks.useGoodsCategories.mockReturnValue({
      categories: [],
      categoryOptions: [],
      loading: true,
      errorMessage: null,
      hasRequestError: false,
    });

    renderCategoryGuard();

    expect(screen.queryByTestId('guarded-content')).toBeNull();
    expect(screen.queryByTestId('mock-navigate')).toBeNull();
  });
});
