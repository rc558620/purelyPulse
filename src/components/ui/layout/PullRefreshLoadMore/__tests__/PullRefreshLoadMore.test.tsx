import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import PullRefreshLoadMore from '../PullRefreshLoadMore';

const setScrollMetrics = (
  element: HTMLElement,
  metrics: {
    scrollTop?: number;
    scrollHeight?: number;
    clientHeight?: number;
  },
) => {
  if (metrics.scrollTop !== undefined) {
    Object.defineProperty(element, 'scrollTop', {
      configurable: true,
      writable: true,
      value: metrics.scrollTop,
    });
  }

  if (metrics.scrollHeight !== undefined) {
    Object.defineProperty(element, 'scrollHeight', {
      configurable: true,
      value: metrics.scrollHeight,
    });
  }

  if (metrics.clientHeight !== undefined) {
    Object.defineProperty(element, 'clientHeight', {
      configurable: true,
      value: metrics.clientHeight,
    });
  }
};

describe('PullRefreshLoadMore', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('渲染 children 与加载更多按钮', () => {
    render(
      <PullRefreshLoadMore onLoadMore={vi.fn()} hasMore>
        <div>内容区域</div>
      </PullRefreshLoadMore>,
    );

    expect(screen.getByText('内容区域')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /加载更多/i })).toBeInTheDocument();
  });

  it('点击加载更多按钮会触发 onLoadMore', async () => {
    const onLoadMore = vi.fn().mockResolvedValue(undefined);
    render(
      <PullRefreshLoadMore onLoadMore={onLoadMore} hasMore>
        <div>内容</div>
      </PullRefreshLoadMore>,
    );

    fireEvent.click(screen.getByRole('button', { name: /加载更多/i }));

    await waitFor(() => {
      expect(onLoadMore).toHaveBeenCalledTimes(1);
    });
  });

  it('滚动接近底部时自动触发上拉加载', async () => {
    const onLoadMore = vi.fn().mockResolvedValue(undefined);
    render(
      <PullRefreshLoadMore onLoadMore={onLoadMore} hasMore loadMoreThreshold={40}>
        <div>内容</div>
      </PullRefreshLoadMore>,
    );

    const scrollArea = screen.getByTestId('pull-refresh-scroll');
    setScrollMetrics(scrollArea, {
      scrollTop: 770,
      scrollHeight: 1200,
      clientHeight: 400,
    });

    fireEvent.scroll(scrollArea);

    await waitFor(() => {
      expect(onLoadMore).toHaveBeenCalledTimes(1);
    });
  });

  it('鼠标拖拽下拉到阈值后会触发刷新并在完成后回弹', async () => {
    const onRefresh = vi.fn().mockResolvedValue(undefined);
    render(
      <PullRefreshLoadMore onRefresh={onRefresh} refreshThreshold={60} successDuration={20}>
        <div>内容</div>
      </PullRefreshLoadMore>,
    );

    const scrollArea = screen.getByTestId('pull-refresh-scroll');
    const content = scrollArea.firstElementChild as HTMLElement;
    setScrollMetrics(scrollArea, {
      scrollTop: 0,
      scrollHeight: 600,
      clientHeight: 400,
    });

    fireEvent.pointerDown(scrollArea, {
      pointerId: 1,
      pointerType: 'mouse',
      button: 0,
      clientY: 0,
    });
    fireEvent.pointerMove(scrollArea, {
      pointerId: 1,
      pointerType: 'mouse',
      clientY: 120,
    });
    fireEvent.pointerUp(scrollArea, {
      pointerId: 1,
      pointerType: 'mouse',
      clientY: 120,
    });

    await waitFor(() => {
      expect(onRefresh).toHaveBeenCalledTimes(1);
    });

    expect(screen.getByText('刷新完成')).toBeInTheDocument();
    expect(content.style.getPropertyValue('--pull-refresh-offset')).not.toBe('0px');

    await waitFor(() => {
      expect(screen.queryByText('刷新完成')).not.toBeInTheDocument();
      expect(content.style.getPropertyValue('--pull-refresh-offset')).toBe('0px');
      expect(content.style.getPropertyValue('--pull-refresh-transition-duration')).toBe('220ms');
    });
  });

  it('鼠标从按钮卡片开始拖拽时也能触发刷新', async () => {
    const onRefresh = vi.fn().mockResolvedValue(undefined);
    render(
      <PullRefreshLoadMore onRefresh={onRefresh} refreshThreshold={60} successDuration={20}>
        <button type="button">会员卡片</button>
      </PullRefreshLoadMore>,
    );

    const scrollArea = screen.getByTestId('pull-refresh-scroll');
    const cardButton = screen.getByRole('button', { name: '会员卡片' });
    setScrollMetrics(scrollArea, {
      scrollTop: 0,
      scrollHeight: 600,
      clientHeight: 400,
    });

    fireEvent.pointerDown(cardButton, {
      pointerId: 11,
      pointerType: 'mouse',
      button: 0,
      clientY: 0,
    });
    fireEvent.pointerMove(scrollArea, {
      pointerId: 11,
      pointerType: 'mouse',
      clientY: 120,
    });
    fireEvent.pointerUp(scrollArea, {
      pointerId: 11,
      pointerType: 'mouse',
      clientY: 120,
    });

    await waitFor(() => {
      expect(onRefresh).toHaveBeenCalledTimes(1);
    });
  });

  it('鼠标单击按钮卡片但不拖拽时不会切换滚动容器样式', () => {
    render(
      <PullRefreshLoadMore onRefresh={vi.fn()} refreshThreshold={60}>
        <button type="button">充值记录卡片</button>
      </PullRefreshLoadMore>,
    );

    const scrollArea = screen.getByTestId('pull-refresh-scroll');
    const cardButton = screen.getByRole('button', { name: '充值记录卡片' });
    setScrollMetrics(scrollArea, {
      scrollTop: 0,
      scrollHeight: 600,
      clientHeight: 400,
    });

    fireEvent.pointerDown(cardButton, {
      pointerId: 21,
      pointerType: 'mouse',
      button: 0,
      clientY: 12,
    });

    expect(scrollArea.style.overflowY).toBe('');
    expect(scrollArea.style.overscrollBehaviorY).toBe('');

    fireEvent.pointerUp(scrollArea, {
      pointerId: 21,
      pointerType: 'mouse',
      clientY: 12,
    });

    expect(scrollArea.style.overflowY).toBe('');
    expect(scrollArea.style.overscrollBehaviorY).toBe('');
  });

  it('鼠标单击按钮卡片但不拖拽时仍会触发 click', () => {
    const onClick = vi.fn();
    render(
      <PullRefreshLoadMore onRefresh={vi.fn()} refreshThreshold={60}>
        <button type="button" onClick={onClick}>会员详情卡片</button>
      </PullRefreshLoadMore>,
    );

    const scrollArea = screen.getByTestId('pull-refresh-scroll');
    const cardButton = screen.getByRole('button', { name: '会员详情卡片' });
    setScrollMetrics(scrollArea, {
      scrollTop: 0,
      scrollHeight: 600,
      clientHeight: 400,
    });

    fireEvent.pointerDown(cardButton, {
      pointerId: 22,
      pointerType: 'mouse',
      button: 0,
      clientY: 18,
    });
    fireEvent.pointerUp(cardButton, {
      pointerId: 22,
      pointerType: 'mouse',
      button: 0,
      clientY: 18,
    });
    fireEvent.click(cardButton);

    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('刷新失败时显示重试按钮并支持再次触发', async () => {
    const onRefresh = vi.fn()
      .mockRejectedValueOnce(new Error('boom'))
      .mockResolvedValueOnce(undefined);

    render(
      <PullRefreshLoadMore onRefresh={onRefresh} refreshThreshold={60} errorDuration={500}>
        <div>内容</div>
      </PullRefreshLoadMore>,
    );

    const scrollArea = screen.getByTestId('pull-refresh-scroll');
    setScrollMetrics(scrollArea, {
      scrollTop: 0,
      scrollHeight: 600,
      clientHeight: 400,
    });

    fireEvent.pointerDown(scrollArea, {
      pointerId: 2,
      pointerType: 'mouse',
      button: 0,
      clientY: 10,
    });
    fireEvent.pointerMove(scrollArea, {
      pointerId: 2,
      pointerType: 'mouse',
      clientY: 130,
    });
    fireEvent.pointerUp(scrollArea, {
      pointerId: 2,
      pointerType: 'mouse',
      clientY: 130,
    });

    await waitFor(() => {
      expect(onRefresh).toHaveBeenCalledTimes(1);
    });

    const retryBtn = await screen.findByRole('button', { name: '立即重试刷新' });
    fireEvent.click(retryBtn);

    await waitFor(() => {
      expect(onRefresh).toHaveBeenCalledTimes(2);
    });
  });

  it('滚动超过阈值时显示回到顶部按钮', async () => {
    render(
      <PullRefreshLoadMore onLoadMore={vi.fn()} hasMore backToTopThreshold={120}>
        <div>长内容</div>
      </PullRefreshLoadMore>,
    );

    const scrollArea = screen.getByTestId('pull-refresh-scroll');
    const scrollToMock = vi.fn();
    Object.defineProperty(scrollArea, 'scrollTo', {
      configurable: true,
      value: scrollToMock,
    });
    setScrollMetrics(scrollArea, {
      scrollTop: 180,
      scrollHeight: 1200,
      clientHeight: 400,
    });

    fireEvent.scroll(scrollArea);

    const topBtn = await screen.findByRole('button', { name: '回到顶部' });
    fireEvent.click(topBtn);

    expect(scrollToMock).toHaveBeenCalledWith({ top: 0, behavior: 'smooth' });
  });
});
