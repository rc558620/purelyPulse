import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { MemberDetail, MemberListItem } from '../memberList.types';

/**
 * 会员「在线」状态的映射用例。
 *
 * 在线由**后端权威判定**（最近 10 分钟内有经过鉴权的请求），前端只透传，
 * 不做本地时间推算 —— 避免客户端时钟/时区误差把离线账号标成在线。
 */

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

const { fetchMemberDetail, fetchMemberList } = await import('../memberList.service');

/** 满足 isServerMemberDetailLike 校验的详情响应体 */
const buildDetailPayload = (
  overrides: Record<string, unknown> = {},
): Record<string, unknown> => ({
  id: '42',
  name: 'Jeffrey',
  phone: '13619654022',
  avatarChar: 'J',
  avatarColorIdx: 0,
  status: 'active',
  level: 'lifetime',
  availablePoints: 1500,
  beanBalance: 0,
  isPartner: false,
  totalRecharged: 40700,
  totalRechargedDisplay: '407',
  registeredAt: 1,
  lastActiveAt: 1,
  totalPointsEarned: 1500,
  rechargeHistory: [],
  ...overrides,
});

const fetchDetail = async (
  overrides: Record<string, unknown> = {},
): Promise<MemberDetail> => {
  mocks.httpGet.mockResolvedValueOnce(buildDetailPayload(overrides));

  const detail = await fetchMemberDetail('42');

  if (!detail) {
    throw new Error('详情映射失败');
  }

  return detail;
};

/** 满足 isServerMemberListItemLike 校验的列表项响应体 */
const buildListItemPayload = (
  overrides: Record<string, unknown> = {},
): Record<string, unknown> => ({
  id: '42',
  name: 'Jeffrey',
  phone: '13619654022',
  avatarChar: 'J',
  avatarColorIdx: 0,
  status: 'active',
  level: 'lifetime',
  availablePoints: 1500,
  beanBalance: 0,
  isPartner: false,
  totalRecharged: 40700,
  totalRechargedDisplay: '407',
  registeredAt: 1,
  lastActiveAt: 1,
  ...overrides,
});

const fetchList = async (
  overrides: Record<string, unknown> = {},
): Promise<MemberListItem[]> => {
  mocks.httpGet.mockResolvedValueOnce({
    items: [buildListItemPayload(overrides)],
    total: 1,
  });

  const { members } = await fetchMemberList({
    keyword: '',
    status: 'all',
    level: 'all',
    expiry: 'all',
  });

  return members;
};

describe('会员在线状态映射', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('后端下发 isOnline=true 时透传为在线', async () => {
    const detail = await fetchDetail({ isOnline: true });

    expect(detail.isOnline).toBe(true);
  });

  it('后端下发 isOnline=false 时不在线（即使最近活跃时间是今天）', async () => {
    const detail = await fetchDetail({ isOnline: false, lastActiveAt: Date.now() });

    expect(detail.isOnline).toBe(false);
    expect(detail.lastActiveAt).toBeGreaterThan(0);
  });

  it('旧后端未下发 isOnline 时按离线处理，不做本地推算', async () => {
    const detail = await fetchDetail();

    expect(detail.isOnline).toBe(false);
  });

  it('列表项透传后端 isOnline=true（卡片绿点依据）', async () => {
    const members = await fetchList({ isOnline: true });

    expect(members[0].isOnline).toBe(true);
  });

  it('列表项 isOnline=false 时不在线（即使最近活跃时间是今天）', async () => {
    const members = await fetchList({ isOnline: false, lastActiveAt: Date.now() });

    expect(members[0].isOnline).toBe(false);
  });

  it('列表项缺少 isOnline（旧后端）时按离线处理，不做本地推算', async () => {
    const members = await fetchList();

    expect(members[0].isOnline).toBe(false);
  });
});
