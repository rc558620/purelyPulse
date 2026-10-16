// 纯利豆页面 hook 用例：余额一览分页、点击 item 进入单合伙人详情后的流水拉取与
// Tab 切换、游标追加、竞态作废旧响应、加载更多失败保留已加载数据、返回列表停止取数。
import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type {
  PartnerBeansPageRecord,
  PartnerBeansPageStats,
  PartnerBeansPageUser,
  PartnerBeansRecordPage,
} from '../partnerBeans.types';

const fetchRecordsMock = vi.hoisted(() => vi.fn());
const fetchUsersMock = vi.hoisted(() => vi.fn());
const showToastMock = vi.hoisted(() => vi.fn());

vi.mock('@components/ui/feedback/Toast', () => ({
  showToast: showToastMock,
}));

vi.mock('../../memberList/memberList.service', () => ({
  fetchPartnerBeanRecords: fetchRecordsMock,
  fetchPartnerBeanUserPage: fetchUsersMock,
  submitMemberBeansAdjustment: vi.fn(),
}));

const { usePartnerBeansPage } = await import('../usePartnerBeansPage');

const buildUser = (id: string): PartnerBeansPageUser => ({
  id,
  name: '张三',
  phone: '13619654020',
  availablePoints: 0,
  beanBalance: 100,
  isPartner: true,
});

const buildRecord = (id: string): PartnerBeansPageRecord => ({
  id,
  userId: '18',
  userName: '张三',
  userPhone: '13619654020',
  beanBalance: 100,
  amount: 10,
  type: 'earn',
  source: 'promo_reward',
  description: '推广奖励',
  createdAt: 1,
});

const buildStats = (overrides: Partial<PartnerBeansPageStats> = {}): PartnerBeansPageStats => ({
  totalRecords: 128,
  adminAdjustCount: 3,
  withdrawCount: 5,
  promoRewardCount: 90,
  ...overrides,
});

const buildPage = (overrides: Partial<PartnerBeansRecordPage> = {}): PartnerBeansRecordPage => ({
  records: [],
  stats: buildStats(),
  hasMore: false,
  nextCursor: null,
  ...overrides,
});

const buildUsersPage = (ids: string[], hasMore = false) => ({
  users: ids.map(buildUser),
  total: ids.length,
  hasMore,
  nextPage: hasMore ? 2 : null,
});

interface Deferred<T> {
  promise: Promise<T>;
  resolve: (value: T) => void;
  reject: (reason?: unknown) => void;
}

const createDeferred = <T,>(): Deferred<T> => {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
};

describe('usePartnerBeansPage 双视图编排', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    fetchUsersMock.mockResolvedValue(buildUsersPage(['18']));
  });

  it('余额一览分页拉取，点击 item 进入详情后才拉该合伙人的流水', async () => {
    fetchRecordsMock.mockResolvedValue(buildPage({
      records: [buildRecord('r1')],
      hasMore: true,
      nextCursor: 'cursor-1',
    }));

    const { result } = renderHook(() => usePartnerBeansPage());

    await waitFor(() => {
      expect(result.current.users.map((user) => user.id)).toEqual(['18']);
    });

    // 余额一览视图不发流水请求
    expect(fetchRecordsMock).not.toHaveBeenCalled();

    act(() => {
      result.current.openPartnerDetail(buildUser('18'));
    });

    await waitFor(() => {
      expect(result.current.isRecordsInitialLoading).toBe(false);
    });

    // 详情流水按下发 storeId 过滤，快照只传当前合伙人
    expect(fetchRecordsMock).toHaveBeenCalledWith(expect.objectContaining({
      cursor: null,
      query: { tab: 'all', keyword: '', storeId: '18' },
      users: [buildUser('18')],
    }));
    expect(fetchRecordsMock.mock.calls[0]?.[0].signal).toBeInstanceOf(AbortSignal);
    expect(result.current.records.map((record) => record.id)).toEqual(['r1']);
    // 本页只有 1 条，统计必须是后端完整结果集的 128 条
    expect(result.current.stats.totalRecords).toBe(128);
    expect(result.current.recordsHasMore).toBe(true);
  });

  it('返回余额一览后流水回到空态且不再发请求', async () => {
    fetchRecordsMock.mockResolvedValue(buildPage({ records: [buildRecord('r1')] }));

    const { result } = renderHook(() => usePartnerBeansPage());

    await waitFor(() => {
      expect(result.current.users).toHaveLength(1);
    });

    act(() => {
      result.current.openPartnerDetail(buildUser('18'));
    });

    await waitFor(() => {
      expect(result.current.records).toHaveLength(1);
    });

    const callsBeforeBack = fetchRecordsMock.mock.calls.length;

    act(() => {
      result.current.backToPartnerList();
    });

    await waitFor(() => {
      expect(result.current.viewMode).toBe('list');
    });

    expect(result.current.records).toHaveLength(0);
    expect(result.current.selectedUser).toBeNull();
    expect(fetchRecordsMock.mock.calls.length).toBe(callsBeforeBack);
  });

  it('详情内切换 Tab：慢返回的旧响应不再覆盖新状态', async () => {
    const staleDeferred = createDeferred<PartnerBeansRecordPage>();
    const freshDeferred = createDeferred<PartnerBeansRecordPage>();

    fetchRecordsMock
      .mockImplementationOnce(() => staleDeferred.promise)
      .mockImplementationOnce(() => freshDeferred.promise);

    const { result } = renderHook(() => usePartnerBeansPage());

    await waitFor(() => {
      expect(result.current.users).toHaveLength(1);
    });

    act(() => {
      result.current.openPartnerDetail(buildUser('18'));
    });

    await waitFor(() => {
      expect(fetchRecordsMock).toHaveBeenCalledTimes(1);
    });

    act(() => {
      result.current.setActiveTab('admin');
    });

    await waitFor(() => {
      expect(fetchRecordsMock).toHaveBeenCalledTimes(2);
    });

    // Tab 与单合伙人都必须下推后端，前端不再本地过滤
    expect(fetchRecordsMock).toHaveBeenLastCalledWith(expect.objectContaining({
      query: { tab: 'admin', keyword: '', storeId: '18' },
    }));

    freshDeferred.resolve(buildPage({
      records: [buildRecord('admin-1')],
      stats: buildStats({ totalRecords: 3 }),
    }));
    await waitFor(() => {
      expect(result.current.records.map((record) => record.id)).toEqual(['admin-1']);
    });

    staleDeferred.resolve(buildPage({
      records: [buildRecord('all-1'), buildRecord('all-2')],
      hasMore: true,
      nextCursor: 'cursor-1',
    }));
    await act(async () => {});

    expect(result.current.records.map((record) => record.id)).toEqual(['admin-1']);
    expect(result.current.stats.totalRecords).toBe(3);
  });

  it('详情流水按游标追加，并同步后端返回的 hasMore', async () => {
    const appendDeferred = createDeferred<PartnerBeansRecordPage>();

    fetchRecordsMock
      .mockResolvedValueOnce(buildPage({
        records: [buildRecord('r1')],
        hasMore: true,
        nextCursor: 'cursor-1',
      }))
      .mockImplementationOnce(() => appendDeferred.promise);

    const { result } = renderHook(() => usePartnerBeansPage());

    await waitFor(() => {
      expect(result.current.users).toHaveLength(1);
    });

    act(() => {
      result.current.openPartnerDetail(buildUser('18'));
    });

    await waitFor(() => {
      expect(result.current.records).toHaveLength(1);
    });

    appendDeferred.resolve(buildPage({
      records: [buildRecord('r2')],
      hasMore: false,
      nextCursor: null,
    }));

    await act(async () => {
      await result.current.loadMoreRecords();
    });

    expect(fetchRecordsMock).toHaveBeenLastCalledWith(expect.objectContaining({
      cursor: 'cursor-1',
    }));
    expect(result.current.records.map((record) => record.id)).toEqual(['r1', 'r2']);
    expect(result.current.recordsHasMore).toBe(false);
  });

  it('余额一览按页码追加，加载更多失败时保留已加载数据', async () => {
    fetchUsersMock
      .mockResolvedValueOnce(buildUsersPage(['18'], true))
      .mockRejectedValueOnce(new Error('网络异常'));

    const { result } = renderHook(() => usePartnerBeansPage());

    await waitFor(() => {
      expect(result.current.users).toHaveLength(1);
    });

    await act(async () => {
      await expect(result.current.loadMoreUsers()).rejects.toThrow('网络异常');
    });

    // 失败不整表报错、不清空列表：交给容器底部「加载失败 + 重试」
    expect(result.current.usersErrorMessage).toBe('');
    expect(result.current.users.map((user) => user.id)).toEqual(['18']);
    expect(result.current.usersHasMore).toBe(true);
  });

  it('详情流水加载更多失败时抛错，已加载内容与分页标记保持不变', async () => {
    fetchRecordsMock
      .mockResolvedValueOnce(buildPage({
        records: [buildRecord('r1')],
        hasMore: true,
        nextCursor: 'cursor-1',
      }))
      .mockRejectedValueOnce(new Error('网络异常'));

    const { result } = renderHook(() => usePartnerBeansPage());

    await waitFor(() => {
      expect(result.current.users).toHaveLength(1);
    });

    act(() => {
      result.current.openPartnerDetail(buildUser('18'));
    });

    await waitFor(() => {
      expect(result.current.records).toHaveLength(1);
    });

    await act(async () => {
      await expect(result.current.loadMoreRecords()).rejects.toThrow('网络异常');
    });

    expect(result.current.recordsErrorMessage).toBe('');
    expect(result.current.records.map((record) => record.id)).toEqual(['r1']);
    expect(result.current.recordsHasMore).toBe(true);
  });
});
