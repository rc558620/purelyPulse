// 门店额度变动记录 hook 用例：真分页取数、切 Tab 重拉第 1 页、加载更多追加、
// 失败保留已加载数据、门店一览模式（query 为 null）停止取数。
import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type {
  NewCustomerQuotaLog,
  NewCustomerQuotaLogPageResult,
  NewCustomerQuotaLogQuery,
} from '../newCustomerQuota.types';

const fetchLogsMock = vi.hoisted(() => vi.fn());

vi.mock('../newCustomerQuota.service', () => ({
  fetchNewCustomerQuotaLogs: fetchLogsMock,
}));

const { useQuotaLogList } = await import('../useQuotaLogList');

const ALL_QUERY: NewCustomerQuotaLogQuery = { storeId: '12', tab: 'all' };
const RECHARGE_QUERY: NewCustomerQuotaLogQuery = { storeId: '12', tab: 'recharge' };

const buildLog = (id: string): NewCustomerQuotaLog => ({
  id,
  storeId: '12',
  type: 'admin_adjust',
  changeAmount: 100,
  balanceAfter: 320,
  description: '平台运营发放活动额度',
  createdAt: 1_760_000_000_000,
});

const buildPage = (
  logs: NewCustomerQuotaLog[],
  overrides: Partial<NewCustomerQuotaLogPageResult> = {},
): NewCustomerQuotaLogPageResult => ({
  logs,
  stats: { totalRecords: 2, adminAdjustCount: 2, rechargeCount: 0, consumeCount: 0 },
  total: 2,
  hasMore: false,
  page: 1,
  ...overrides,
});

describe('useQuotaLogList', () => {
  beforeEach(() => {
    fetchLogsMock.mockReset();
  });

  it('首屏按第 1 页取数，并回填记录与统计', async () => {
    fetchLogsMock.mockResolvedValue(buildPage([buildLog('1')]));

    const { result } = renderHook(() => useQuotaLogList(ALL_QUERY));

    await waitFor(() => {
      expect(result.current.logs).toHaveLength(1);
    });

    expect(fetchLogsMock).toHaveBeenCalledTimes(1);
    expect(fetchLogsMock.mock.calls[0][0]).toMatchObject({ page: 1, query: ALL_QUERY });
    expect(result.current.stats.totalRecords).toBe(2);
  });

  it('切换 Tab 会重拉第 1 页，而不是在上一次分页结果上追加', async () => {
    fetchLogsMock.mockResolvedValue(buildPage([buildLog('1')]));

    const { result, rerender } = renderHook(
      ({ query }: { query: NewCustomerQuotaLogQuery | null }) => useQuotaLogList(query),
      { initialProps: { query: ALL_QUERY } },
    );

    await waitFor(() => {
      expect(result.current.logs).toHaveLength(1);
    });

    fetchLogsMock.mockResolvedValue(buildPage([buildLog('2')], { page: 1 }));
    rerender({ query: RECHARGE_QUERY });

    await waitFor(() => {
      expect(result.current.logs).toHaveLength(1);
      expect(result.current.logs[0]?.id).toBe('2');
    });

    const lastCall = fetchLogsMock.mock.calls[fetchLogsMock.mock.calls.length - 1][0];
    expect(lastCall).toMatchObject({ page: 1, query: RECHARGE_QUERY });
  });

  it('加载更多按 page + 1 追加，不覆盖已加载记录', async () => {
    fetchLogsMock.mockResolvedValue(buildPage([buildLog('1')], { hasMore: true, total: 2 }));

    const { result } = renderHook(() => useQuotaLogList(ALL_QUERY));

    await waitFor(() => {
      expect(result.current.logs).toHaveLength(1);
    });

    fetchLogsMock.mockResolvedValue(buildPage([buildLog('2')], { page: 2, hasMore: false }));
    await act(async () => {
      await result.current.loadMoreLogs();
    });

    expect(fetchLogsMock.mock.calls[1][0]).toMatchObject({ page: 2 });
    expect(result.current.logs.map((log) => log.id)).toEqual(['1', '2']);
  });

  it('切 Tab 失败时保留已加载记录并给出错误文案', async () => {
    fetchLogsMock.mockResolvedValue(buildPage([buildLog('1')]));

    const { result, rerender } = renderHook(
      ({ query }: { query: NewCustomerQuotaLogQuery | null }) => useQuotaLogList(query),
      { initialProps: { query: ALL_QUERY } },
    );

    await waitFor(() => {
      expect(result.current.logs).toHaveLength(1);
    });

    fetchLogsMock.mockRejectedValue(new Error('获取额度变动记录失败，请稍后重试'));
    rerender({ query: RECHARGE_QUERY });

    await waitFor(() => {
      expect(result.current.errorMessage).toBe('获取额度变动记录失败，请稍后重试');
    });
    expect(result.current.logs).toHaveLength(1);
  });

  it('query 为 null（门店一览视图）时不发请求并回到空态', async () => {
    const { result } = renderHook(() => useQuotaLogList(null));

    await waitFor(() => {
      expect(result.current.isInitialLoading).toBe(true);
    });

    expect(fetchLogsMock).not.toHaveBeenCalled();
    expect(result.current.logs).toHaveLength(0);
  });
});
