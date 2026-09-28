import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { MemberDetail } from '../memberList.types';

/**
 * 会员详情「首购锁定价快照」映射用例。
 *
 * 后端 `PulseMemberDetailDto.lockedPrices` 是新增字段，前端必须：
 * - 把 Prisma 档位（yearly / lifetime）映射成运营看得懂的档位名（永久统一为 AGES会员）
 * - 把来源映射成展示名（商家续费成交 / 平台设置等级）
 * - 对缺失字段的脏数据容错（缺档位或金额的条目直接丢弃，不渲染空行）
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

describe('会员详情首购锁定价映射', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('把档位与来源映射成运营可读文案，并区分子账号加价是否已补录', async () => {
    const detail = await fetchDetail({
      lockedPrices: [
        {
          planId: 'yearly',
          price: 58800,
          priceDisplay: '588',
          subAccountAmountDisplay: '150',
          subAccountCount: 3,
          renewalPriceDisplay: '738',
          source: 'purchase',
          lockedAt: 1773500000000,
        },
        {
          planId: 'lifetime',
          price: 59800,
          priceDisplay: '598',
          // 存量门店尚未补录：后端下发 null，前端需提示运营
          subAccountAmountDisplay: null,
          subAccountCount: null,
          renewalPriceDisplay: null,
          source: 'admin',
          lockedAt: 1773400000000,
        },
      ],
    });

    expect(detail.lockedPrices).toEqual([
      {
        planId: 'yearly',
        planName: '年度会员',
        priceDisplay: '588',
        subAccountAmountDisplay: '150',
        subAccountCount: 3,
        // 配置价 + 子账号加价 = 续费价，供快照展示「加价 ¥150 = ¥738」
        renewalPriceDisplay: '738',
        source: 'purchase',
        sourceLabel: '商家续费成交',
        lockedAt: 1773500000000,
      },
      {
        // 永久档位与商家端文案保持一致
        planId: 'lifetime',
        planName: 'AGES会员',
        priceDisplay: '598',
        subAccountAmountDisplay: null,
        subAccountCount: null,
        renewalPriceDisplay: null,
        source: 'admin',
        sourceLabel: '平台设置等级',
        lockedAt: 1773400000000,
      },
    ]);
  });

  it('补录金额为空串时按未补录处理（避免渲染成 ¥ 空值）', async () => {
    const detail = await fetchDetail({
      lockedPrices: [
        {
          planId: 'yearly',
          priceDisplay: '588',
          subAccountAmountDisplay: '   ',
          subAccountCount: 3,
          source: 'purchase',
        },
      ],
    });

    expect(detail.lockedPrices?.[0]).toMatchObject({
      subAccountAmountDisplay: null,
      // 加价缺失时数量一并归一为 null，避免出现「含 3 个子账号 · 加价 ¥」
      subAccountCount: null,
    });
  });

  it('未知来源按 purchase 兜底，未知档位回退原始 planId', async () => {
    const detail = await fetchDetail({
      lockedPrices: [
        { planId: 'biennial', priceDisplay: '999', source: 'legacy' },
      ],
    });

    expect(detail.lockedPrices).toEqual([
      {
        planId: 'biennial',
        planName: 'biennial',
        priceDisplay: '999',
        subAccountAmountDisplay: null,
        subAccountCount: null,
        renewalPriceDisplay: null,
        source: 'purchase',
        sourceLabel: '商家续费成交',
        lockedAt: 0,
      },
    ]);
  });

  it('缺少档位或金额的脏数据被丢弃，不渲染空行', async () => {
    const detail = await fetchDetail({
      lockedPrices: [
        { priceDisplay: '588' },
        { planId: 'yearly' },
        { planId: '', priceDisplay: '' },
        { planId: 'yearly', priceDisplay: '369' },
      ],
    });

    expect(detail.lockedPrices).toHaveLength(1);
    expect(detail.lockedPrices?.[0]).toMatchObject({
      planId: 'yearly',
      priceDisplay: '369',
    });
  });

  it('后端未下发 lockedPrices 时返回空数组（而不是 undefined）', async () => {
    const detail = await fetchDetail();

    expect(detail.lockedPrices).toEqual([]);
  });
});
