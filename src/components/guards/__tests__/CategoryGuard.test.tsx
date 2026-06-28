import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import CategoryGuard from '../CategoryGuard';

const mocks = vi.hoisted(() => ({
  showToast: vi.fn(),
  httpGet: vi.fn(),
  localStorageGetItem: vi.fn(),
  localStorageSetItem: vi.fn(),
  localStorageRemoveItem: vi.fn(),
}));

vi.mock('@components/ui/feedback/Toast', () => ({
  showToast: mocks.showToast,
}));

vi.mock('@utils/http', () => ({
  http: {
    get: (...args: unknown[]) => mocks.httpGet(...args),
  },
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
  let localStorageData: Record<string, string>;

  beforeEach(() => {
    vi.clearAllMocks();
    localStorageData = {};

    mocks.localStorageGetItem.mockImplementation(
      (key: string) => localStorageData[key] ?? null,
    );
    mocks.localStorageSetItem.mockImplementation(
      (key: string, value: string) => { localStorageData[key] = value; },
    );
    mocks.localStorageRemoveItem.mockImplementation(
      (key: string) => { delete localStorageData[key]; },
    );

    // 直接覆盖 window.localStorage 方法
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: mocks.localStorageGetItem,
        setItem: mocks.localStorageSetItem,
        removeItem: mocks.localStorageRemoveItem,
        clear: vi.fn(),
        length: 0,
        key: vi.fn(),
      },
      writable: true,
      configurable: true,
    });
  });

  const seedCategories = (categories: unknown[]): void => {
    localStorageData['purely_profit_categories'] = JSON.stringify(categories);
  };

  it('有分类时直接放行', async () => {
    seedCategories([{ id: '1', name: '奶茶' }]);
    mocks.httpGet.mockResolvedValue({ total: 1 });

    renderCategoryGuard();

    await waitFor(() => {
      expect(screen.getByTestId('guarded-content')).toBeInTheDocument();
    }, { timeout: 5000 });
    expect(screen.queryByTestId('mock-navigate')).toBeNull();
    expect(mocks.showToast).not.toHaveBeenCalled();
  });

  it('无分类时重定向并提示', async () => {
    mocks.httpGet.mockResolvedValue({ total: 0 });

    renderCategoryGuard();

    await waitFor(() => {
      expect(screen.getByTestId('mock-navigate')).toHaveAttribute('data-to', '/category-entry');
    });
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

  it('后端校验失败时降级信任前端判断', async () => {
    seedCategories([{ id: '1', name: '奶茶' }]);
    mocks.httpGet.mockRejectedValue(new Error('Network error'));

    renderCategoryGuard();

    await waitFor(() => {
      expect(screen.getByTestId('guarded-content')).toBeInTheDocument();
    }, { timeout: 5000 });
    expect(screen.queryByTestId('mock-navigate')).toBeNull();
  });

  it('后端确认无分类时重新拦截', async () => {
    seedCategories([{ id: '1', name: '奶茶' }]);
    mocks.httpGet.mockResolvedValue({ total: 0 });

    renderCategoryGuard();

    await waitFor(() => {
      expect(screen.getByTestId('mock-navigate')).toHaveAttribute('data-to', '/category-entry');
    });
    expect(mocks.showToast).toHaveBeenCalledWith({
      message: '请先录入至少一个商品分类',
      type: 'warning',
    });
  });
});
