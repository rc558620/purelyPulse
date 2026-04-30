import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { STORAGE_KEYS } from '@constants/storageKeys';
import CategoryGuard from '../CategoryGuard';

interface MockProtectedRouteProps {
  check: () => boolean;
  fallback: string;
  preloadFallback?: () => void;
  message?: string;
  children: React.ReactNode;
}

const protectedRouteSpy = vi.fn((props: MockProtectedRouteProps) => (
  <div data-testid="protected-route-mock">{props.children}</div>
));

vi.mock('@components/business/ProtectedRoute', () => ({
  default: (props: MockProtectedRouteProps) => protectedRouteSpy(props),
}));

const renderCategoryGuard = (props: Partial<React.ComponentProps<typeof CategoryGuard>> = {}) =>
  render(
    <CategoryGuard {...props}>
      <div data-testid="guarded-content">商品录入页</div>
    </CategoryGuard>,
  );

const getLastProtectedRouteProps = (): MockProtectedRouteProps => {
  const lastCall = protectedRouteSpy.mock.lastCall?.[0];
  if (!lastCall) {
    throw new Error('ProtectedRoute mock was not called');
  }
  return lastCall as MockProtectedRouteProps;
};

describe('CategoryGuard', () => {
  beforeEach(() => {
    protectedRouteSpy.mockClear();
    localStorage.clear();
  });

  it('渲染时包裹到 ProtectedRoute，并透传 children', () => {
    renderCategoryGuard();

    expect(screen.getByTestId('protected-route-mock')).toBeInTheDocument();
    expect(screen.getByTestId('guarded-content')).toBeInTheDocument();
  });

  it('未传 props 时使用默认 fallback 和默认提示文案', () => {
    renderCategoryGuard();

    expect(getLastProtectedRouteProps()).toEqual(
      expect.objectContaining({
        fallback: '/category-entry',
        message: '请先录入至少一个商品分类',
      }),
    );
  });

  it('支持透传自定义 fallback、message 和 preloadFallback', () => {
    const preloadFallback = vi.fn();

    renderCategoryGuard({
      fallback: '/custom-category-entry',
      message: '请先创建分类后再录入商品',
      preloadFallback,
    });

    expect(getLastProtectedRouteProps()).toEqual(
      expect.objectContaining({
        fallback: '/custom-category-entry',
        message: '请先创建分类后再录入商品',
        preloadFallback,
      }),
    );
  });

  it('本地存在至少一个分类时允许访问', () => {
    localStorage.setItem(
      STORAGE_KEYS.CATEGORIES,
      JSON.stringify([{ id: 'cate-1', name: '奶茶' }]),
    );

    renderCategoryGuard();

    expect(getLastProtectedRouteProps().check()).toBe(true);
  });

  it('本地没有分类存储时拒绝访问', () => {
    renderCategoryGuard();

    expect(getLastProtectedRouteProps().check()).toBe(false);
  });

  it('本地分类为空数组时拒绝访问', () => {
    localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify([]));

    renderCategoryGuard();

    expect(getLastProtectedRouteProps().check()).toBe(false);
  });

  it('本地分类 JSON 非法时拒绝访问', () => {
    localStorage.setItem(STORAGE_KEYS.CATEGORIES, '{invalid json');

    renderCategoryGuard();

    expect(getLastProtectedRouteProps().check()).toBe(false);
  });

  it.each([
    ['object', { id: 'cate-1' }],
    ['string', '奶茶'],
    ['number', 1],
    ['boolean', true],
    ['null', null],
  ])('本地分类解析为 %s 时拒绝访问', (_label, value) => {
    localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(value));

    renderCategoryGuard();

    expect(getLastProtectedRouteProps().check()).toBe(false);
  });

  it('check 会在重新渲染后读取最新的 localStorage 分类数据', () => {
    const { rerender } = render(
      <CategoryGuard>
        <div data-testid="guarded-content">商品录入页</div>
      </CategoryGuard>,
    );

    expect(getLastProtectedRouteProps().check()).toBe(false);

    localStorage.setItem(
      STORAGE_KEYS.CATEGORIES,
      JSON.stringify([{ id: 'cate-2', name: '甜品' }]),
    );

    rerender(
      <CategoryGuard>
        <div data-testid="guarded-content">商品录入页</div>
      </CategoryGuard>,
    );

    expect(getLastProtectedRouteProps().check()).toBe(true);
  });

  it('check 读取的是分类存储 key，而不是其他无关存储', () => {
    localStorage.setItem('other-key', JSON.stringify([{ id: 'cate-1' }]));

    renderCategoryGuard();

    expect(getLastProtectedRouteProps().check()).toBe(false);
  });
});
