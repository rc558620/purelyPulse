import { beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * 短信钱包变动记录 service 用例：请求参数、路径展开与 DTO 脏数据兜底。
 *
 * 关注的正是联调最容易出问题的三类场景：
 * - 后端字段缺失 / 类型漂移（items 不是数组、total 缺失、createdAt 类型不定）；
 * - 未知枚举（后端新增流水类型时不能被当成已知类型渲染）；
 * - 关联单号「空串 vs 没有」必须区分（空串要归一成 undefined）。
 */

const mocks = vi.hoisted(() => ({
  httpGet: vi.fn(),
}));

vi.mock('@utils/http', () => ({
  http: { get: mocks.httpGet, post: vi.fn() },
  resolveEnvPath: (value: unknown, fallback: string) =>
    typeof value === 'string' && value.length > 0 ? value : fallback,
  // 直接返回 requestFactory，绕开并发去重缓存对用例的干扰
  createKeyedInFlightRequest:
    (_resolveKey: unknown, requestFactory: (...args: never[]) => Promise<unknown>) =>
      requestFactory,
}));

const { fetchSmsWalletLogs } = await import('../smsBroadcast.service');

const buildPayload = (
  items: Record<string, unknown>[],
  overrides: Record<string, unknown> = {},
): Record<string, unknown> => ({
  items,
  total: items.length,
  page: 1,
  pageSize: 20,
  hasMore: false,
  stats: {
    totalRecords: items.length,
    adminAdjustCount: 0,
    rechargeCount: 0,
    consumeCount: 0,
    refundCount: 0,
  },
  ...overrides,
});

const buildLogItem = (
  overrides: Record<string, unknown> = {},
): Record<string, unknown> => ({
  id: 7,
  storeId: 12,
  type: 'grant',
  changeFen: 10000,
  balanceAfterFen: 16000,
  description: '客服补偿短信额度',
  orderNo: null,
  broadcastId: null,
  createdAt: 1760000000000,
  ...overrides,
});

describe('fetchSmsWalletLogs', () => {
  beforeEach(() => {
    mocks.httpGet.mockReset();
  });

  it('按门店展开路径，并下发 tab / page / pageSize', async () => {
    mocks.httpGet.mockResolvedValue(buildPayload([]));

    await fetchSmsWalletLogs({
      query: { storeId: '12', tab: 'consume' },
      page: 2,
    });

    const [url, config] = mocks.httpGet.mock.calls[0];
    expect(url).toBe('/pulse/marketing/admin/sms/accounts/12/wallet-logs');
    expect(config.params).toEqual({ tab: 'consume', page: 2, pageSize: 20 });
  });

  it('毫秒时间戳与 ISO 字符串都能归一成毫秒', async () => {
    mocks.httpGet.mockResolvedValue(
      buildPayload([
        buildLogItem({ id: 1, createdAt: 1760000000000 }),
        buildLogItem({ id: 2, createdAt: '2026-09-29T08:56:00.000Z' }),
        buildLogItem({ id: 3, createdAt: null }),
      ]),
    );

    const result = await fetchSmsWalletLogs({
      query: { storeId: '12', tab: 'all' },
      page: 1,
    });

    expect(result.logs.map((log) => log.createdAt)).toEqual([
      1760000000000,
      Date.parse('2026-09-29T08:56:00.000Z'),
      0,
    ]);
  });

  it('未知流水类型归一为 unknown，不回落成已知类型', async () => {
    mocks.httpGet.mockResolvedValue(
      buildPayload([buildLogItem({ type: 'some_new_type' })]),
    );

    const result = await fetchSmsWalletLogs({
      query: { storeId: '12', tab: 'all' },
      page: 1,
    });

    expect(result.logs[0].type).toBe('unknown');
  });

  it('items 缺失或不是数组时按空列表处理，total 缺失回退已加载条数', async () => {
    mocks.httpGet.mockResolvedValue({ items: null });

    const result = await fetchSmsWalletLogs({
      query: { storeId: '12', tab: 'all' },
      page: 1,
    });

    expect(result.logs).toEqual([]);
    expect(result.total).toBe(0);
    expect(result.hasMore).toBe(false);
  });

  it('关联单号空串归一为 undefined，有值原样保留', async () => {
    mocks.httpGet.mockResolvedValue(
      buildPayload([
        buildLogItem({ id: 1, orderNo: '', broadcastId: '' }),
        buildLogItem({ id: 2, orderNo: 'SMS20260520', broadcastId: 'bc_1' }),
      ]),
    );

    const result = await fetchSmsWalletLogs({
      query: { storeId: '12', tab: 'all' },
      page: 1,
    });

    expect(result.logs[0].orderNo).toBeUndefined();
    expect(result.logs[0].broadcastId).toBeUndefined();
    expect(result.logs[1].orderNo).toBe('SMS20260520');
    expect(result.logs[1].broadcastId).toBe('bc_1');
  });

  it('门店 ID 缺失时流式 ID 兜底，不会把 undefined 当 key', async () => {
    mocks.httpGet.mockResolvedValue(
      buildPayload([buildLogItem({ id: null })]),
    );

    const result = await fetchSmsWalletLogs({
      query: { storeId: '12', tab: 'all' },
      page: 1,
    });

    expect(result.logs[0].id).toBe('sms-wallet-log-0');
  });
});
