// @vitest-environment jsdom
import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * 短信钱包变动记录分页 hook 用例：竞态与状态重置。
 *
 * 真分页 + Tab 切换最容易出问题的就是「旧响应覆盖新状态」：
 * 运营在「充值」与「消耗」之间快速来回切，先发的请求可能后返回，
 * 一旦被写入就会把列表换成别的 Tab 的数据。这里用受控的 deferred
 * 请求把乱序场景固定下来。
 */

const mocks = vi.hoisted(() => ({
  fetch: vi.fn(),
}));

vi.mock('../smsBroadcast.service', () => ({
  fetchSmsWalletLogs: mocks.fetch,
}));

const { useSmsWalletLogList } = await import('../useSmsWalletLogList');

const buildLog = (id: string) => ({
  id,
  storeId: '12',
  type: 'consume' as const,
  changeFen: -100,
  balanceAfterFen: 9900,
  description: '群发扣费',
  createdAt: 1760000000000,
});

const buildPage = (
  ids: string[],
  overrides: Record<string, unknown> = {},
): Record<string, unknown> => ({
  logs: ids.map(buildLog),
  stats: {
    totalRecords: ids.length,
    adminAdjustCount: 0,
    rechargeCount: 0,
    consumeCount: ids.length,
    refundCount: 0,
  },
  total: ids.length,
  hasMore: false,
  page: 1,
  ...overrides,
});

/**
 * 查询条件必须是稳定引用：hook 的取数 effect 依赖 `query` 的引用相等，
 * 传入每次渲染新建的字面量会重复打首屏请求（页面层已用 useMemo 固定）。
 */
const LIST_QUERY = { storeId: '12', tab: 'all' };
const CONSUME_QUERY = { storeId: '12', tab: 'consume' };

describe('useSmsWalletLogList', () => {
  beforeEach(() => {
    mocks.fetch.mockReset();
  });

  it('门店一览视图（query 为 null）不发请求', async () => {
    const { result } = renderHook(() => useSmsWalletLogList(null));

    await waitFor(() => expect(result.current.isInitialLoading).toBe(true));
    expect(mocks.fetch).not.toHaveBeenCalled();
    expect(result.current.logs).toEqual([]);
  });

  it('进入详情按第 1 页取数并回填统计', async () => {
    mocks.fetch.mockResolvedValue(buildPage(['1', '2']));

    const { result } = renderHook(() =>
      useSmsWalletLogList(LIST_QUERY),
    );

    await waitFor(() => expect(result.current.isInitialLoading).toBe(false));
    expect(mocks.fetch).toHaveBeenCalledWith(
      expect.objectContaining({
        page: 1,
        query: { storeId: '12', tab: 'all' },
      }),
    );
    expect(result.current.logs.map((log) => log.id)).toEqual(['1', '2']);
    expect(result.current.total).toBe(2);
  });

  it('切 Tab 后旧响应晚到也不覆盖新列表', async () => {
    const resolvers: Array<(value: unknown) => void> = [];
    mocks.fetch.mockImplementation(
      () => new Promise((resolve) => resolvers.push(resolve)),
    );

    const { result, rerender } = renderHook(
      ({ query }: { query: { storeId: string; tab: string } | null }) =>
        useSmsWalletLogList(query),
      { initialProps: { query: LIST_QUERY } },
    );

    await waitFor(() => expect(resolvers).toHaveLength(1));

    rerender({ query: CONSUME_QUERY });
    await waitFor(() => expect(resolvers).toHaveLength(2));

    // 新 Tab 的响应先到：列表应先切成 consume 的数据
    await act(async () => {
      resolvers[1](buildPage(['consume-1']));
    });
    await waitFor(() =>
      expect(result.current.logs.map((log) => log.id)).toEqual(['consume-1']),
    );

    // 旧 Tab 的响应后到：必须被丢弃，不能把列表换回 all 的数据
    await act(async () => {
      resolvers[0](buildPage(['all-1', 'all-2']));
    });
    expect(result.current.logs.map((log) => log.id)).toEqual(['consume-1']);
  });

  it('加载更多按下一页追加，不整表替换', async () => {
    mocks.fetch.mockResolvedValue(
      buildPage(['1', '2'], { hasMore: true, total: 4 }),
    );

    const { result } = renderHook(() =>
      useSmsWalletLogList(LIST_QUERY),
    );
    await waitFor(() => expect(result.current.isInitialLoading).toBe(false));
    expect(result.current.hasMore).toBe(true);

    // 首屏稳定后再切换第 2 页的返回值：避免首屏请求次数影响用例断言
    mocks.fetch.mockResolvedValue(buildPage(['3', '4'], { page: 2, total: 4 }));

    await act(async () => {
      await result.current.loadMoreLogs();
    });

    expect(mocks.fetch).toHaveBeenLastCalledWith(
      expect.objectContaining({ page: 2 }),
    );
    expect(result.current.logs.map((log) => log.id)).toEqual([
      '1',
      '2',
      '3',
      '4',
    ]);
  });

  it('下拉刷新只重拉第 1 页并整表替换', async () => {
    mocks.fetch.mockResolvedValue(buildPage(['1', '2'], { hasMore: true }));

    const { result } = renderHook(() =>
      useSmsWalletLogList(LIST_QUERY),
    );
    await waitFor(() => expect(result.current.isInitialLoading).toBe(false));

    // 首屏稳定后再切换刷新返回值：断言只针对「刷新」这一次请求
    mocks.fetch.mockResolvedValue(buildPage(['9'], { page: 1 }));

    await act(async () => {
      await result.current.refreshLogs();
    });

    expect(mocks.fetch).toHaveBeenLastCalledWith(
      expect.objectContaining({ page: 1 }),
    );
    expect(result.current.logs.map((log) => log.id)).toEqual(['9']);
  });

  it('返回门店一览后清空记录，再次进入重新取数', async () => {
    mocks.fetch.mockResolvedValue(buildPage(['1']));

    const { result, rerender } = renderHook(
      ({ query }: { query: { storeId: string; tab: string } | null }) =>
        useSmsWalletLogList(query),
      { initialProps: { query: LIST_QUERY } },
    );
    await waitFor(() => expect(result.current.isInitialLoading).toBe(false));

    rerender({ query: null });
    await waitFor(() => expect(result.current.logs).toEqual([]));
    expect(result.current.isInitialLoading).toBe(true);
  });
});
