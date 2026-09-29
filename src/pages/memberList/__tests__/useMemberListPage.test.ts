// 会员列表分页 Hook 竞态用例：筛选切换作废旧响应、加载更多与刷新并发、加载更多失败保留已加载数据。
import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { MemberListItem, MemberListPageResult, MemberListQuery } from '../memberList.types';

const fetchMemberListMock = vi.hoisted(() => vi.fn());

vi.mock('../memberList.service', () => ({
  fetchMemberList: fetchMemberListMock,
}));

const { useMemberListPage } = await import('../useMemberListPage');

const buildMember = (id: string): MemberListItem => ({
  id,
  name: `会员${id}`,
  phone: '13619654020',
  avatarChar: '会',
  avatarColorIdx: 0,
  status: 'active',
  level: 'free',
  availablePoints: 0,
  beanBalance: 0,
  isPartner: false,
  totalRechargedDisplay: '0',
  registeredAt: 1,
  lastActiveAt: 1,
});

const buildPageResult = (overrides: Partial<MemberListPageResult> = {}): MemberListPageResult => ({
  members: [],
  stats: { totalCount: 0, activeCount: 0, inactiveCount: 0, partnerCount: 0, bannedCount: 0 },
  total: 0,
  hasMore: false,
  ...overrides,
});

const buildQuery = (overrides: Partial<MemberListQuery> = {}): MemberListQuery => ({
  keyword: '',
  status: 'all',
  level: 'all',
  expiry: 'all',
  pendingSubAccountBackfill: false,
  renewalPriceAdjusted: false,
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

describe('useMemberListPage 分页竞态', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('筛选切换后，慢返回的旧响应不再覆盖新状态', async () => {
    const staleDeferred = createDeferred<MemberListPageResult>();
    const freshDeferred = createDeferred<MemberListPageResult>();

    // 第 1 次请求（初始 all）慢返回；第 2 次请求（切换为 banned）快速返回
    fetchMemberListMock
      .mockImplementationOnce(() => staleDeferred.promise)
      .mockImplementationOnce(() => freshDeferred.promise);

    const { result } = renderHook(() => useMemberListPage());

    // 初始请求已发出（requestId 已递增）
    await waitFor(() => {
      expect(fetchMemberListMock).toHaveBeenCalledTimes(1);
    });

    act(() => {
      result.current.setStatusFilter('banned');
    });

    await waitFor(() => {
      expect(fetchMemberListMock).toHaveBeenCalledTimes(2);
    });

    // 新请求先返回：状态切到新数据
    freshDeferred.resolve(buildPageResult({
      members: [buildMember('b1')],
      stats: { totalCount: 1, activeCount: 0, inactiveCount: 0, partnerCount: 0, bannedCount: 1 },
      total: 1,
      hasMore: false,
    }));
    await waitFor(() => {
      expect(result.current.members.map((member) => member.id)).toEqual(['b1']);
    });

    // 旧响应晚到：必须被丢弃，不回滚到旧数据
    staleDeferred.resolve(buildPageResult({
      members: [buildMember('a1'), buildMember('a2')],
      stats: { totalCount: 2, activeCount: 2, inactiveCount: 0, partnerCount: 0, bannedCount: 0 },
      total: 2,
      hasMore: true,
    }));
    await act(async () => {});

    expect(result.current.members.map((member) => member.id)).toEqual(['b1']);
    expect(result.current.stats.totalCount).toBe(1);
    expect(result.current.hasMore).toBe(false);
  });

  it('加载更多在途时发起刷新，晚到的追加结果被作废', async () => {
    const initialDeferred = createDeferred<MemberListPageResult>();
    const appendDeferred = createDeferred<MemberListPageResult>();
    const refreshDeferred = createDeferred<MemberListPageResult>();

    fetchMemberListMock
      .mockImplementationOnce(() => initialDeferred.promise)
      .mockImplementationOnce(() => appendDeferred.promise)
      .mockImplementationOnce(() => refreshDeferred.promise);

    const { result } = renderHook(() => useMemberListPage());

    // 首屏完成：1 条数据，还有下一页
    initialDeferred.resolve(buildPageResult({
      members: [buildMember('a1')],
      stats: { totalCount: 3, activeCount: 3, inactiveCount: 0, partnerCount: 0, bannedCount: 0 },
      total: 3,
      hasMore: true,
    }));
    await waitFor(() => {
      expect(result.current.members).toHaveLength(1);
      expect(result.current.isLoading).toBe(false);
    });

    // 上拉加载第 2 页（在途）
    let loadMorePromise: Promise<void> | undefined;
    act(() => {
      loadMorePromise = result.current.loadMoreMembers();
    });
    await waitFor(() => {
      expect(fetchMemberListMock).toHaveBeenCalledTimes(2);
    });

    // 刷新打断：重拉第 1 页
    let refreshPromise: Promise<void> | undefined;
    act(() => {
      refreshPromise = result.current.refreshMembers();
    });
    await waitFor(() => {
      expect(fetchMemberListMock).toHaveBeenCalledTimes(3);
    });

    // 加载更多晚到：请求页码是第 2 页，但结果必须被丢弃（不追加）
    appendDeferred.resolve(buildPageResult({
      members: [buildMember('a2')],
      total: 3,
      hasMore: true,
    }));
    // 刷新返回第 1 页新数据
    refreshDeferred.resolve(buildPageResult({
      members: [buildMember('r1')],
      stats: { totalCount: 3, activeCount: 3, inactiveCount: 0, partnerCount: 0, bannedCount: 0 },
      total: 3,
      hasMore: true,
    }));

    await Promise.allSettled([loadMorePromise, refreshPromise]);
    await act(async () => {});

    // 追加结果被作废：列表只有刷新返回的那 1 条，没有混入 a2
    expect(result.current.members.map((member) => member.id)).toEqual(['r1']);
    // 刷新成功后加载中标记复位
    expect(result.current.isRefreshing).toBe(false);
    expect(result.current.isLoading).toBe(false);
  });

  it('加载更多失败时抛错，已加载内容与 hasMore 保持不变', async () => {
    const initialDeferred = createDeferred<MemberListPageResult>();
    fetchMemberListMock
      .mockImplementationOnce(() => initialDeferred.promise)
      .mockRejectedValueOnce(new Error('网络异常'));

    const { result } = renderHook(() => useMemberListPage());

    initialDeferred.resolve(buildPageResult({
      members: [buildMember('a1')],
      stats: { totalCount: 3, activeCount: 3, inactiveCount: 0, partnerCount: 0, bannedCount: 0 },
      total: 3,
      hasMore: true,
    }));
    await waitFor(() => {
      expect(result.current.members).toHaveLength(1);
    });

    await act(async () => {
      // 原始错误语义透传（交给加载更多失败态展示）
      await expect(result.current.loadMoreMembers()).rejects.toThrow('网络异常');
    });

    // 失败不整表报错、不清空列表：整表错误为空，数据与分页标记原样保留
    expect(result.current.errorMessage).toBe('');
    expect(result.current.members.map((member) => member.id)).toEqual(['a1']);
    expect(result.current.hasMore).toBe(true);
  });

  it('加载更多按最新页码递增请求并追加结果', async () => {
    const initialDeferred = createDeferred<MemberListPageResult>();
    const appendDeferred = createDeferred<MemberListPageResult>();
    fetchMemberListMock
      .mockImplementationOnce(() => initialDeferred.promise)
      .mockImplementationOnce(() => appendDeferred.promise);

    const { result } = renderHook(() => useMemberListPage());

    initialDeferred.resolve(buildPageResult({
      members: [buildMember('a1')],
      stats: { totalCount: 2, activeCount: 2, inactiveCount: 0, partnerCount: 0, bannedCount: 0 },
      total: 2,
      hasMore: true,
    }));
    await waitFor(() => {
      expect(result.current.members).toHaveLength(1);
    });

    appendDeferred.resolve(buildPageResult({
      members: [buildMember('a2')],
      stats: { totalCount: 2, activeCount: 2, inactiveCount: 0, partnerCount: 0, bannedCount: 0 },
      total: 2,
      hasMore: false,
    }));

    await act(async () => {
      await result.current.loadMoreMembers();
    });

    // 请求页码在第 1 页基础上 +1
    expect(fetchMemberListMock).toHaveBeenNthCalledWith(
      2,
      buildQuery(),
      2,
    );
    expect(result.current.members.map((member) => member.id)).toEqual(['a1', 'a2']);
    expect(result.current.hasMore).toBe(false);
  });
});
