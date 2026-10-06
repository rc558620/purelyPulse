// 纯利豆分页 Hook 用例：筛选下推后端、游标追加、竞态作废旧响应、加载更多失败保留已加载数据。
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
  fetchPartnerBeanUsers: fetchUsersMock,
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

describe('usePartnerBeansPage 游标分页', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    fetchUsersMock.mockResolvedValue([buildUser('18')]);
  });

  it('首屏先拉合伙人快照再拉第一页，统计取后端口径而非本页条数', async () => {
    fetchRecordsMock.mockResolvedValue(buildPage({
      records: [buildRecord('r1')],
      hasMore: true,
      nextCursor: 'cursor-1',
    }));

    const { result } = renderHook(() => usePartnerBeansPage());

    await waitFor(() => {
      expect(result.current.isInitialLoading).toBe(false);
    });

    expect(fetchRecordsMock).toHaveBeenCalledWith(expect.objectContaining({
      cursor: null,
      query: { tab: 'all', keyword: '' },
      users: [buildUser('18')],
    }));
    // 每个请求都要带上取消信号：换条件 / 卸载时能作废在途请求
    expect(fetchRecordsMock.mock.calls[0]?.[0].signal).toBeInstanceOf(AbortSignal);
    expect(result.current.records.map((record) => record.id)).toEqual(['r1']);
    // 本页只有 1 条，统计必须是后端完整结果集的 128 条
    expect(result.current.stats.totalRecords).toBe(128);
    expect(result.current.hasMore).toBe(true);
  });

  it('切换 Tab 后，慢返回的旧响应不再覆盖新状态', async () => {
    const staleDeferred = createDeferred<PartnerBeansRecordPage>();
    const freshDeferred = createDeferred<PartnerBeansRecordPage>();

    fetchRecordsMock
      .mockImplementationOnce(() => staleDeferred.promise)
      .mockImplementationOnce(() => freshDeferred.promise);

    const { result } = renderHook(() => usePartnerBeansPage());

    await waitFor(() => {
      expect(fetchRecordsMock).toHaveBeenCalledTimes(1);
    });

    act(() => {
      result.current.setActiveTab('admin');
    });

    await waitFor(() => {
      expect(fetchRecordsMock).toHaveBeenCalledTimes(2);
    });

    // Tab 与关键词必须下推后端，前端不再本地过滤
    expect(fetchRecordsMock).toHaveBeenLastCalledWith(expect.objectContaining({
      query: { tab: 'admin', keyword: '' },
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

  it('加载更多按游标追加，并同步后端返回的 hasMore', async () => {
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
    expect(result.current.hasMore).toBe(false);
  });

  it('合伙人快照失败时流水仍可翻页，但余额标记为不可用并提示一次', async () => {
    fetchUsersMock.mockRejectedValue(new Error('网络异常'));
    fetchRecordsMock.mockResolvedValue(buildPage({
      records: [buildRecord('r1')],
      hasMore: true,
      nextCursor: 'cursor-1',
    }));

    const { result } = renderHook(() => usePartnerBeansPage());

    await waitFor(() => {
      expect(result.current.isInitialLoading).toBe(false);
    });

    // 快照失败不能让余额显示成 0：页面据此隐藏余额节点
    expect(result.current.isUsersLoaded).toBe(false);
    expect(result.current.records).toHaveLength(1);
    expect(showToastMock).toHaveBeenCalledWith(expect.objectContaining({ type: 'error' }));
  });

  it('加载更多失败时抛错，已加载内容与分页标记保持不变', async () => {
    fetchRecordsMock
      .mockResolvedValueOnce(buildPage({
        records: [buildRecord('r1')],
        hasMore: true,
        nextCursor: 'cursor-1',
      }))
      .mockRejectedValueOnce(new Error('网络异常'));

    const { result } = renderHook(() => usePartnerBeansPage());

    await waitFor(() => {
      expect(result.current.records).toHaveLength(1);
    });

    await act(async () => {
      await expect(result.current.loadMoreRecords()).rejects.toThrow('网络异常');
    });

    // 失败不整表报错、不清空列表：交给容器底部「加载失败 + 重试」
    expect(result.current.errorMessage).toBe('');
    expect(result.current.records.map((record) => record.id)).toEqual(['r1']);
    expect(result.current.hasMore).toBe(true);
  });
});
