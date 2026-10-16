// 纯利豆流水分页请求用例：请求参数下推、游标与 hasMore 口径、统计取后端字段而非本页条数。
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  httpGet: vi.fn(),
}));

vi.mock('@utils/http', () => ({
  http: { get: mocks.httpGet, post: vi.fn() },
  resolveEnvPath: (value: unknown, fallback: string) =>
    typeof value === 'string' && value.length > 0 ? value : fallback,
  createKeyedInFlightRequest:
    (_resolveKey: unknown, requestFactory: (...args: never[]) => Promise<unknown>) =>
      requestFactory,
}));

const {
  requestPartnerBeanRecords,
  requestPartnerBeanUserPage,
} = await import('../../memberList/memberList.request');

const buildUser = () => ({
  id: '18',
  name: '张三',
  phone: '13619654020',
  availablePoints: 0,
  beanBalance: 120,
  isPartner: true,
  avatarUrl: undefined,
});

/** 一页流水响应：items + hasMore + nextCursor + stats。 */
const buildPagePayload = (
  overrides: Record<string, unknown> = {},
): Record<string, unknown> => ({
  items: [
    {
      id: '11',
      userId: '18',
      userName: '张三',
      userPhone: '13619654020',
      amount: 10,
      type: 'earn',
      source: 'promo_reward',
      description: '推广奖励',
      createdAt: 1_747_123_200_000,
    },
  ],
  hasMore: true,
  nextCursor: '1747123200000_11',
  stats: {
    totalRecords: 128,
    adminAdjustCount: 3,
    withdrawCount: 5,
    promoRewardCount: 90,
  },
  ...overrides,
});

describe('requestPartnerBeanRecords 游标分页', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('Tab 与关键词下推后端，all Tab 不下发 beanTab', async () => {
    mocks.httpGet.mockResolvedValue(buildPagePayload());

    await requestPartnerBeanRecords({
      query: { tab: 'all', keyword: '  ', storeId: null },
      cursor: null,
      users: [buildUser()],
    });

    expect(mocks.httpGet).toHaveBeenCalledWith(
      '/pulse/membership/admin/beans/logs',
      expect.objectContaining({
        params: {
          beanTab: undefined,
          keyword: undefined,
          storeId: undefined,
          cursor: undefined,
          limit: 20,
        },
      }),
    );
  });

  it('单合伙人详情按下发 storeId 过滤', async () => {
    mocks.httpGet.mockResolvedValue(buildPagePayload());

    await requestPartnerBeanRecords({
      query: { tab: 'all', keyword: '', storeId: '18' },
      cursor: null,
      users: [buildUser()],
    });

    expect(mocks.httpGet).toHaveBeenCalledWith(
      '/pulse/membership/admin/beans/logs',
      expect.objectContaining({
        params: expect.objectContaining({ storeId: '18' }),
      }),
    );
  });

  it('按 cursor 翻页，并用后端统计而非本页条数', async () => {
    mocks.httpGet.mockResolvedValue(buildPagePayload());

    const page =     await requestPartnerBeanRecords({
      query: { tab: 'admin', keyword: '张三', storeId: null },
      cursor: '1747123200000_11',
      users: [buildUser()],
    });

    expect(mocks.httpGet).toHaveBeenCalledWith(
      '/pulse/membership/admin/beans/logs',
      expect.objectContaining({
        params: {
          beanTab: 'admin',
          keyword: '张三',
          storeId: undefined,
          cursor: '1747123200000_11',
          limit: 20,
        },
      }),
    );
    expect(page.records).toHaveLength(1);
    expect(page.hasMore).toBe(true);
    expect(page.nextCursor).toBe('1747123200000_11');
    // 本页只有 1 条，统计必须是后端口径的 128
    expect(page.stats.totalRecords).toBe(128);
    expect(page.stats.adminAdjustCount).toBe(3);
  });

  it('没有游标时视为没有下一页，且统计缺失时兜底为空', async () => {
    mocks.httpGet.mockResolvedValue(buildPagePayload({
      items: [],
      hasMore: true,
      nextCursor: null,
      stats: undefined,
    }));

    const page =     await requestPartnerBeanRecords({
      query: { tab: 'all', keyword: '', storeId: null },
      cursor: null,
      users: [],
    });

    expect(page.hasMore).toBe(false);
    expect(page.stats).toEqual({
      totalRecords: 0,
      adminAdjustCount: 0,
      withdrawCount: 0,
      promoRewardCount: 0,
    });
  });

  it('余额一览分页：partner/keyword/page/pageSize 下推，hasMore 按后端 total 判断', async () => {
    mocks.httpGet.mockResolvedValue({
      items: [
        { id: '18', isPartner: true, beanBalance: 0 },
        { id: '19', isPartner: true, beanBalance: 30 },
      ],
      total: 22,
    });

    const page = await requestPartnerBeanUserPage({ keyword: '张三', page: 1 });

    expect(mocks.httpGet).toHaveBeenCalledWith(
      '/pulse/membership/admin/members',
      expect.objectContaining({
        params: {
          partner: true,
          keyword: '张三',
          page: 1,
          pageSize: 20,
        },
      }),
    );
    expect(page.users.map((user) => user.id)).toEqual(['18', '19']);
    expect(page.total).toBe(22);
    expect(page.hasMore).toBe(true);
    expect(page.nextPage).toBe(2);
  });

  it('余额一览最后一页：total 未超已加载条数时停住，total 缺失时整页拉满视为可能还有下一页', async () => {
    mocks.httpGet
      .mockResolvedValueOnce({ items: [{ id: '18', isPartner: true }], total: 1 })
      .mockResolvedValueOnce({ items: Array.from({ length: 20 }, (_, index) => ({ id: String(index) })) });

    const lastPage = await requestPartnerBeanUserPage({ keyword: '', page: 2 });
    expect(lastPage.hasMore).toBe(false);
    expect(lastPage.nextPage).toBeNull();

    const fullPageWithoutTotal = await requestPartnerBeanUserPage({ keyword: '', page: 3 });
    expect(fullPageWithoutTotal.hasMore).toBe(true);
  });
});
