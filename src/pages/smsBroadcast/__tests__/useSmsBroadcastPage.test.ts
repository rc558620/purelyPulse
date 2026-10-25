// @vitest-environment jsdom
import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * 群发短信页面 hook 用例：双视图取数与「赠送后刷新」链路。
 *
 * 重点验证两件容易出错的事：
 * - 门店一览视图**不应该**打变动记录请求（否则每进一次页面都白查一次流水）；
 * - `logQuery` 必须是稳定引用：页面里靠 useMemo 固定，若引用漂移，
 *   每次重渲染都会重打首屏，表现为「列表反复闪 loading」。
 */

const mocks = vi.hoisted(() => ({
  fetchLogs: vi.fn(),
  fetchAccounts: vi.fn(),
  grant: vi.fn(),
  showToast: vi.fn(),
}));

vi.mock('@components/ui/feedback/Toast', () => ({
  showToast: mocks.showToast,
}));

vi.mock('../smsBroadcast.service', () => ({
  fetchSmsWalletLogs: mocks.fetchLogs,
  fetchSmsBroadcastAccounts: mocks.fetchAccounts,
  submitSmsBalanceGrant: mocks.grant,
}));

const { useSmsBroadcastPage } = await import('../useSmsBroadcastPage');

const buildAccount = () => ({
  id: '12',
  storeName: '纯利宝南山店',
  ownerName: '张三',
  ownerPhone: '13800138000',
  ownerAvatarUrl: '',
  balanceFen: 6000,
  totalRechargedFen: 5000,
  totalConsumedFen: 3800,
  sentSmsCount: 760,
  warningThresholdFen: 500,
  updatedAt: 1760000000000,
});

const buildAccountsPage = () => ({
  stores: [buildAccount()],
  stats: {
    storeCount: 1,
    totalBalanceFen: 6000,
    warningCount: 0,
    exhaustedCount: 0,
  },
  total: 1,
  hasMore: false,
});

const buildLogsPage = (total = 0) => ({
  logs: [],
  stats: {
    totalRecords: total,
    adminAdjustCount: 0,
    rechargeCount: 0,
    consumeCount: 0,
    refundCount: 0,
  },
  total,
  hasMore: false,
  page: 1,
});

describe('useSmsBroadcastPage', () => {
  beforeEach(() => {
    mocks.fetchLogs.mockReset();
    mocks.fetchAccounts.mockReset();
    mocks.grant.mockReset();
    mocks.showToast.mockReset();
    mocks.fetchAccounts.mockResolvedValue(buildAccountsPage());
    mocks.fetchLogs.mockResolvedValue(buildLogsPage());
    mocks.grant.mockResolvedValue({ ...buildAccount(), balanceFen: 16000 });
  });

  it('门店一览视图不请求变动记录', async () => {
    const { result } = renderHook(() => useSmsBroadcastPage());

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(mocks.fetchAccounts).toHaveBeenCalled();
    expect(mocks.fetchLogs).not.toHaveBeenCalled();
  });

  it('进入详情按门店 + 默认 Tab 取第 1 页流水', async () => {
    const { result } = renderHook(() => useSmsBroadcastPage());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    act(() => {
      result.current.openStoreDetail(buildAccount());
    });

    await waitFor(() => expect(mocks.fetchLogs).toHaveBeenCalled());
    expect(mocks.fetchLogs).toHaveBeenCalledWith(
      expect.objectContaining({
        page: 1,
        query: { storeId: '12', tab: 'all' },
      }),
    );
    expect(result.current.viewMode).toBe('detail');
  });

  it('切 Tab 只补一次请求：查询条件是稳定引用，不会反复重打首屏', async () => {
    const { result } = renderHook(() => useSmsBroadcastPage());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    act(() => {
      result.current.openStoreDetail(buildAccount());
    });
    await waitFor(() => expect(mocks.fetchLogs).toHaveBeenCalledTimes(1));

    act(() => {
      result.current.setLogTab('consume');
    });
    await waitFor(() => expect(mocks.fetchLogs).toHaveBeenCalledTimes(2));
    expect(mocks.fetchLogs).toHaveBeenLastCalledWith(
      expect.objectContaining({ query: { storeId: '12', tab: 'consume' } }),
    );

    // 等待若干轮渲染后仍不得再发起请求
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 50));
    });
    expect(mocks.fetchLogs).toHaveBeenCalledTimes(2);
  });

  it('详情视图赠送成功后同时刷新列表与变动记录，并回写头部余额', async () => {
    const { result } = renderHook(() => useSmsBroadcastPage());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    act(() => {
      result.current.openStoreDetail(buildAccount());
    });
    await waitFor(() => expect(mocks.fetchLogs).toHaveBeenCalledTimes(1));

    await act(async () => {
      await result.current.handleConfirmAdjust('12', 10000, '客服补偿');
    });

    expect(mocks.grant).toHaveBeenCalledWith('12', 10000, '客服补偿');
    // 赠送成功后：列表第 1 页 + 变动记录第 1 页都要重拉
    expect(mocks.fetchAccounts).toHaveBeenCalledTimes(2);
    expect(mocks.fetchLogs).toHaveBeenCalledTimes(2);
    expect(result.current.selectedStore?.balanceFen).toBe(16000);
    expect(mocks.showToast).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'success' }),
    );
  });

  it('门店一览视图赠送成功后不触碰变动记录', async () => {
    const { result } = renderHook(() => useSmsBroadcastPage());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      await result.current.handleConfirmAdjust('12', 10000, '客服补偿');
    });

    expect(mocks.fetchAccounts).toHaveBeenCalledTimes(2);
    expect(mocks.fetchLogs).not.toHaveBeenCalled();
  });
});
