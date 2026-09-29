import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { MemberDetail } from '../memberList.types';

/**
 * 会员详情「调整续费记录」与「子账号设置记录」映射用例。
 *
 * 两组都是后端新增的审计字段，前端必须：
 * - 调整续费记录：保留 null 语义（oldPriceDisplay=null 是「此前未议定」，
 *   newPriceDisplay=null 是「清除覆盖、恢复默认价」），不能被拍成空串或 0；
 * - 子账号设置记录：额度是数字且 0 有业务语义（关闭功能），
 *   `normalizeOptionalCount` 会把 0 当成无值，因此只能用 safeNum 兜底；
 * - 两组都要对脏数据容错（空串归一成 null、未下发字段按空数组处理）。
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

const { fetchMemberDetail } = await import('../memberList.service');

/** 满足 isServerMemberDetailLike 校验的详情响应体 */
const buildDetailPayload = (
  overrides: Record<string, unknown> = {},
): Record<string, unknown> => ({
  id: '18',
  name: '张三',
  phone: '13619654020',
  avatarChar: '张',
  avatarColorIdx: 0,
  status: 'active',
  level: 'annual',
  availablePoints: 0,
  beanBalance: 0,
  isPartner: false,
  totalRecharged: 0,
  totalRechargedDisplay: '0',
  registeredAt: 1,
  lastActiveAt: 1,
  totalPointsEarned: 0,
  rechargeHistory: [],
  ...overrides,
});

const fetchDetail = async (
  overrides: Record<string, unknown> = {},
): Promise<MemberDetail> => {
  mocks.httpGet.mockResolvedValueOnce(buildDetailPayload(overrides));

  const detail = await fetchMemberDetail('18');

  if (!detail) {
    throw new Error('详情映射失败');
  }

  return detail;
};

describe('会员详情调整续费记录映射', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('保留改价前后价的 null 语义（未议定 / 清除覆盖）', async () => {
    const detail = await fetchDetail({
      renewalPriceAdjustCount: 2,
      renewalPriceAdjustHistory: [
        {
          id: '7',
          planId: 'yearly',
          planName: '年度会员',
          oldPriceDisplay: null,
          newPriceDisplay: '498',
          operatorName: '李四',
          createdAt: 1773500000000,
        },
        {
          // 清除覆盖：改价后回到配置价，不能渲染成 ¥0
          id: '6',
          planId: 'yearly',
          planName: '年度会员',
          oldPriceDisplay: '498',
          newPriceDisplay: null,
          operatorName: null,
          createdAt: 1773400000000,
        },
      ],
    });

    expect(detail.renewalPriceAdjustCount).toBe(2);
    expect(detail.renewalPriceAdjustHistory).toEqual([
      {
        id: '7',
        planId: 'yearly',
        planName: '年度会员',
        oldPriceDisplay: null,
        newPriceDisplay: '498',
        operatorName: '李四',
        createdAt: 1773500000000,
      },
      {
        id: '6',
        planId: 'yearly',
        planName: '年度会员',
        oldPriceDisplay: '498',
        newPriceDisplay: null,
        operatorName: null,
        createdAt: 1773400000000,
      },
    ]);
  });

  it('空串金额归一成 null，缺档位名回落成「续费价」而不是渲染空白标题', async () => {
    const detail = await fetchDetail({
      renewalPriceAdjustHistory: [
        {
          id: 9,
          planId: '   ',
          planName: '   ',
          oldPriceDisplay: '   ',
          newPriceDisplay: '   ',
          createdAt: 1773500000000,
        },
      ],
    });

    expect(detail.renewalPriceAdjustHistory?.[0]).toMatchObject({
      id: '9',
      planId: '',
      planName: '续费价',
      oldPriceDisplay: null,
      newPriceDisplay: null,
    });
  });

  it('后端未下发该字段（旧版本）时为空数组，且次数不做本地推算', async () => {
    const detail = await fetchDetail();

    expect(detail.renewalPriceAdjustHistory).toEqual([]);
    expect(detail.renewalPriceAdjustCount).toBe(0);
  });
});

describe('会员详情子账号设置记录映射', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('保留额度数值与 0 的业务语义（关闭子账号）', async () => {
    const detail = await fetchDetail({
      subAccountQuotaRecordCount: 2,
      subAccountQuotaRecordHistory: [
        {
          id: '11',
          oldQuota: 2,
          newQuota: 5,
          operatorName: '王五',
          reason: '门店扩张，新增收银员',
          createdAt: 1773500000000,
        },
        {
          // 额度调到 0 = 关闭子账号功能，不能被当成「缺失」抹掉
          id: '10',
          oldQuota: 3,
          newQuota: 0,
          operatorName: null,
          reason: null,
          createdAt: 1773400000000,
        },
      ],
    });

    expect(detail.subAccountQuotaRecordCount).toBe(2);
    expect(detail.subAccountQuotaRecordHistory).toEqual([
      {
        id: '11',
        oldQuota: 2,
        newQuota: 5,
        operatorName: '王五',
        reason: '门店扩张，新增收银员',
        createdAt: 1773500000000,
      },
      {
        id: '10',
        oldQuota: 3,
        newQuota: 0,
        operatorName: null,
        reason: null,
        createdAt: 1773400000000,
      },
    ]);
  });

  it('空串操作人 / 原因归一成 null，缺额度按 0 兜底', async () => {
    const detail = await fetchDetail({
      subAccountQuotaRecordHistory: [
        {
          id: 12,
          operatorName: '   ',
          reason: '   ',
        },
      ],
    });

    expect(detail.subAccountQuotaRecordHistory?.[0]).toMatchObject({
      id: '12',
      oldQuota: 0,
      newQuota: 0,
      operatorName: null,
      reason: null,
    });
  });

  it('后端未下发该字段（旧版本）时为空数组', async () => {
    const detail = await fetchDetail();

    expect(detail.subAccountQuotaRecordHistory).toEqual([]);
    expect(detail.subAccountQuotaRecordCount).toBe(0);
  });
});
