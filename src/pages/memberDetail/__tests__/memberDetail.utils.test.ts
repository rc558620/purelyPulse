import { describe, expect, it } from 'vitest';
import {
  resolveSubAccountAddOnPriceDisplay,
  resolveSubAccountBackfillState,
} from '../memberDetail.utils';
import type { MemberLockedPrice } from '@pages/memberList/memberList.pricing.types';

/**
 * 子账号加价补录状态用例。
 *
 * 判据必须与后端「待补录子账号加价」清单、成交价快照卡里的告警一致：
 * 有子账号权益（年 / 永久）**且**年 / 永久档位缺子账号加价。
 * 月 / 季档位不参与——门店端开不了子账号，算进来会让年度会员全部误报待补录。
 */

const buildLockedPrice = (
  overrides: Partial<MemberLockedPrice> = {},
): MemberLockedPrice => ({
  planId: 'yearly',
  planName: '年度会员',
  priceDisplay: '588',
  subAccountAmountDisplay: null,
  subAccountCount: null,
  renewalPriceDisplay: null,
  source: 'purchase',
  sourceLabel: '商家续费成交',
  lockedAt: 1773500000000,
  ...overrides,
});

describe('resolveSubAccountBackfillState', () => {
  it('免费 / 月 / 季会员不展示徽章（开不了子账号，缺加价也不算待补录）', () => {
    for (const level of ['free', 'monthly', 'quarterly'] as const) {
      expect(
        resolveSubAccountBackfillState(level, [buildLockedPrice()]),
      ).toBe('notEligible');
    }
  });

  it('年 / 永久会员且年 / 永久档位缺加价时是待补录', () => {
    for (const level of ['annual', 'lifetime'] as const) {
      expect(
        resolveSubAccountBackfillState(level, [buildLockedPrice()]),
      ).toBe('pending');
      expect(
        resolveSubAccountBackfillState(level, [
          buildLockedPrice({ planId: 'lifetime', planName: '永久会员' }),
        ]),
      ).toBe('pending');
    }
  });

  it('月 / 季档位缺加价不影响判定（它们本来就不需要补录）', () => {
    expect(
      resolveSubAccountBackfillState('annual', [
        buildLockedPrice({ planId: 'yearly', subAccountAmountDisplay: '150' }),
        buildLockedPrice({ planId: 'monthly', planName: '月度会员' }),
      ]),
    ).toBe('backfilled');
  });

  it('补录后有金额即视为已补录（含 0 元这种合法值）', () => {
    expect(
      resolveSubAccountBackfillState('annual', [
        buildLockedPrice({ subAccountAmountDisplay: '0' }),
      ]),
    ).toBe('backfilled');
  });

  it('没有成交价快照（未锁价）时不误报待补录', () => {
    expect(resolveSubAccountBackfillState('annual', [])).toBe('backfilled');
    expect(resolveSubAccountBackfillState('annual', undefined)).toBe(
      'backfilled',
    );
  });
});

describe('resolveSubAccountAddOnPriceDisplay', () => {
  it('取与当前会员等级同档位已补录的加价（年度 → 年卡）', () => {
    expect(
      resolveSubAccountAddOnPriceDisplay('annual', [
        buildLockedPrice({ planId: 'lifetime', planName: '永久会员', subAccountAmountDisplay: '1200' }),
        buildLockedPrice({ planId: 'yearly', subAccountAmountDisplay: '1000' }),
      ]),
    ).toBe('1000');

    expect(
      resolveSubAccountAddOnPriceDisplay('lifetime', [
        buildLockedPrice({ planId: 'yearly', subAccountAmountDisplay: '1000' }),
        buildLockedPrice({ planId: 'lifetime', planName: '永久会员', subAccountAmountDisplay: '1200' }),
      ]),
    ).toBe('1200');
  });

  it('同档位没补录时回落其它已补录的年 / 永久档位，而不是直接不展示', () => {
    expect(
      resolveSubAccountAddOnPriceDisplay('annual', [
        buildLockedPrice({ planId: 'lifetime', planName: '永久会员', subAccountAmountDisplay: '1200' }),
      ]),
    ).toBe('1200');
  });

  it('月 / 季档位的加价不算数（门店端开不了子账号）', () => {
    expect(
      resolveSubAccountAddOnPriceDisplay('annual', [
        buildLockedPrice({ planId: 'monthly', planName: '月度会员', subAccountAmountDisplay: '300' }),
      ]),
    ).toBeNull();
  });

  it('全部未补录或没有快照时返回 null（行内退回只展示额度）', () => {
    expect(
      resolveSubAccountAddOnPriceDisplay('annual', [buildLockedPrice()]),
    ).toBeNull();
    expect(resolveSubAccountAddOnPriceDisplay('annual', [])).toBeNull();
    expect(resolveSubAccountAddOnPriceDisplay('annual', undefined)).toBeNull();
  });

  it('0 元是合法的加价值，不能当成缺失（否则「已补录」会显示不出金额）', () => {
    expect(
      resolveSubAccountAddOnPriceDisplay('annual', [
        buildLockedPrice({ subAccountAmountDisplay: '0' }),
      ]),
    ).toBe('0');
  });
});
