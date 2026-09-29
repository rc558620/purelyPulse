import { describe, expect, it } from 'vitest';
import type { MemberLevel } from '@pages/memberList/memberList.types';
import type { MemberRenewalPrice } from '@pages/memberList/memberList.pricing.types';
import {
  isPositiveDisplayAmount,
  isPriceInputValid,
  isRowChanged,
  isSubAccountPlan,
  resolveRenewalBadgeState,
  resolveRenewalHint,
  resolveRenewalInputValue,
  resolveRenewalPreviewDisplay,
  toRenewalPlanId,
} from '../renewalPriceModal.utils';

/**
 * 「调整续费价格」弹窗的定价 / 状态判定用例。
 *
 * 这里锁的是两条**已经踩过**的口径：
 * 1. 定价基数 = `max(配置价, 议定价)` + 子账号加价（年 / 永久），
 *    因此配置价涨过议定价后，库里那条议定价不再生效，但**记录仍在**；
 * 2. 展示字符串的尾零必须与后端 `formatYuan` 逐字符一致，
 *    否则「预览 === 现续费价」这类字符串比较会误判。
 *
 * 金额全部用后端口径的展示字符串（`'458.50'` 而非 `458.5`），前端不做换算。
 */

const buildItem = (
  overrides: Partial<MemberRenewalPrice> = {},
): MemberRenewalPrice => ({
  planId: 'lifetime',
  planName: 'AGES会员',
  configPriceDisplay: '598',
  overridePriceDisplay: null,
  subAccountAmountDisplay: '0',
  renewalPriceDisplay: '598',
  editable: true,
  editableReason: null,
  ...overrides,
});

/** 后端口径：`Money.fromDbCents(fen).toFixedOutputYuan().replace(/\.00$/, '')`。 */
const backendFormatYuan = (fen: number): string =>
  (fen / 100).toFixed(2).replace(/\.00$/, '');

describe('isSubAccountPlan', () => {
  it('只有年 / 永久档位叠加子账号加价', () => {
    expect(isSubAccountPlan('yearly')).toBe(true);
    expect(isSubAccountPlan('lifetime')).toBe(true);
    expect(isSubAccountPlan('monthly')).toBe(false);
    expect(isSubAccountPlan('quarterly')).toBe(false);
  });
});

describe('toRenewalPlanId', () => {
  it('会员等级映射成档位标识，年度是 yearly 而不是 annual', () => {
    expect(toRenewalPlanId('monthly')).toBe('monthly');
    expect(toRenewalPlanId('quarterly')).toBe('quarterly');
    expect(toRenewalPlanId('annual')).toBe('yearly');
    expect(toRenewalPlanId('lifetime')).toBe('lifetime');
  });

  it('免费与未知等级没有续费概念，返回 null', () => {
    expect(toRenewalPlanId('free')).toBeNull();
    expect(toRenewalPlanId('vip' as MemberLevel)).toBeNull();
  });
});

describe('isPriceInputValid', () => {
  it('空串合法：代表清除覆盖、回落到配置价', () => {
    expect(isPriceInputValid('')).toBe(true);
    expect(isPriceInputValid('   ')).toBe(true);
  });

  it('非负数字、最多两位小数合法', () => {
    expect(isPriceInputValid('0')).toBe(true);
    expect(isPriceInputValid('350')).toBe(true);
    expect(isPriceInputValid('350.5')).toBe(true);
    expect(isPriceInputValid('350.05')).toBe(true);
  });

  it('负数、非数字、超两位小数非法', () => {
    expect(isPriceInputValid('-1')).toBe(false);
    expect(isPriceInputValid('abc')).toBe(false);
    expect(isPriceInputValid('350.005')).toBe(false);
    expect(isPriceInputValid('.5')).toBe(false);
    expect(isPriceInputValid('350.')).toBe(false);
  });
});

describe('resolveRenewalPreviewDisplay', () => {
  it('未填写时按配置价', () => {
    expect(
      resolveRenewalPreviewDisplay('lifetime', '598', '', '0'),
    ).toBe('598');
  });

  it('议定价高于配置价时取议定价', () => {
    expect(
      resolveRenewalPreviewDisplay('lifetime', '398', '458', '0'),
    ).toBe('458');
  });

  it('议定价低于配置价时取配置价：低价不能压住平台涨价', () => {
    expect(
      resolveRenewalPreviewDisplay('lifetime', '598', '499', '0'),
    ).toBe('598');
  });

  it('年 / 永久档位叠加子账号加价', () => {
    expect(
      resolveRenewalPreviewDisplay('lifetime', '398', '458', '150'),
    ).toBe('608');
    expect(
      resolveRenewalPreviewDisplay('yearly', '398', '458', '150'),
    ).toBe('608');
  });

  it('月 / 季不参与子账号加价', () => {
    expect(
      resolveRenewalPreviewDisplay('monthly', '42', '50', '150'),
    ).toBe('50');
    expect(
      resolveRenewalPreviewDisplay('quarterly', '108', '', '150'),
    ).toBe('108');
  });

  it('年 / 永久档位缺子账号加价展示值时按 0 处理', () => {
    expect(
      resolveRenewalPreviewDisplay('lifetime', '398', '458', ''),
    ).toBe('458');
  });

  it('输入位数溢出（超出安全数值）时返回空串，不把 Infinity 渲染出来', () => {
    expect(resolveRenewalPreviewDisplay('lifetime', '598', '9'.repeat(400), '0')).toBe('');
  });

  it('输入或配置价非法时返回空串，由调用方隐藏预览', () => {
    expect(
      resolveRenewalPreviewDisplay('lifetime', '598', 'abc', '0'),
    ).toBe('');
    expect(resolveRenewalPreviewDisplay('lifetime', '', '458', '0')).toBe('');
  });

  it('★ 尾零口径与后端 formatYuan 逐字符一致', () => {
    // 前端曾多裁一级尾零（458.50 → 458.5），导致未改动的行被误判成已改动
    for (const cents of [59800, 45850, 45855, 59950, 60800]) {
      const configDisplay = backendFormatYuan(cents);

      expect(resolveRenewalPreviewDisplay('lifetime', configDisplay, '', '0')).toBe(
        configDisplay,
      );
    }

    // 取高者与加价之后同样要保持口径
    expect(
      resolveRenewalPreviewDisplay('lifetime', '398', '458.50', '150'),
    ).toBe('608.50');
  });
});

describe('resolveRenewalInputValue', () => {
  it('未议定时留空，由占位符提示按配置价续费', () => {
    expect(resolveRenewalInputValue(buildItem())).toBe('');
  });

  it('议定价生效时回显议定价', () => {
    expect(
      resolveRenewalInputValue(
        buildItem({ overridePriceDisplay: '700', renewalPriceDisplay: '700' }),
      ),
    ).toBe('700');
  });

  it('★ 议定价低于配置价时回显配置价，不回显已失效的议定价', () => {
    // 输入框若回显 499，运营会看到「已议价 ¥499 / 现续费价 ¥598」这种自相矛盾的现状
    expect(
      resolveRenewalInputValue(
        buildItem({ configPriceDisplay: '598', overridePriceDisplay: '499' }),
      ),
    ).toBe('598');
  });

  it('议定价等于配置价时回显配置价', () => {
    expect(
      resolveRenewalInputValue(
        buildItem({ configPriceDisplay: '598', overridePriceDisplay: '598' }),
      ),
    ).toBe('598');
  });

  it('后端下发值非法时兜底回显议定价原值，不清空输入框', () => {
    expect(
      resolveRenewalInputValue(
        buildItem({ configPriceDisplay: 'abc', overridePriceDisplay: '499' }),
      ),
    ).toBe('499');
  });
});

describe('isRowChanged', () => {
  it('未议定且输入为空：没有改动', () => {
    expect(isRowChanged(buildItem(), '')).toBe(false);
  });

  it('填了新价：算改动', () => {
    expect(isRowChanged(buildItem(), '350')).toBe(true);
  });

  it('等价写法不算改动，避免产生无意义的写入与审计', () => {
    const item = buildItem({
      configPriceDisplay: '398',
      overridePriceDisplay: '458',
      renewalPriceDisplay: '458',
    });

    expect(isRowChanged(item, '458')).toBe(false);
    expect(isRowChanged(item, '458.00')).toBe(false);
    expect(isRowChanged(item, ' 458 ')).toBe(false);
  });

  it('★ 陈旧议定价的行不动就不算改动，不会把配置价写成新的议定价', () => {
    // 输入框初值已被修正成配置价 598，若拿库里的 499 当基准，
    // 打开弹窗什么都没做也会产生一次写入
    const item = buildItem({
      configPriceDisplay: '598',
      overridePriceDisplay: '499',
    });

    expect(resolveRenewalInputValue(item)).toBe('598');
    expect(isRowChanged(item, '598')).toBe(false);
  });

  it('清空已有覆盖：算改动（提交后清除覆盖价）', () => {
    const item = buildItem({
      configPriceDisplay: '598',
      overridePriceDisplay: '499',
    });

    expect(isRowChanged(item, '')).toBe(true);
  });

  it('输入非法算改动：提交按钮本就禁用，这里只避免它被当成「没改」而静默丢弃', () => {
    expect(isRowChanged(buildItem(), 'abc')).toBe(true);
  });
});

describe('resolveRenewalBadgeState', () => {
  it('未议价：按配置价', () => {
    expect(resolveRenewalBadgeState(buildItem(), '')).toBe('default');
  });

  it('议定价高于配置价：生效中', () => {
    expect(
      resolveRenewalBadgeState(
        buildItem({ configPriceDisplay: '398', overridePriceDisplay: '458' }),
        '458',
      ),
    ).toBe('effective');
  });

  it('议定价等于配置价：生效中', () => {
    expect(
      resolveRenewalBadgeState(
        buildItem({ configPriceDisplay: '598', overridePriceDisplay: '598' }),
        '598',
      ),
    ).toBe('effective');
  });

  it('★ 陈旧议定价低于配置价：未生效', () => {
    // 输入框被修正成 598，只看输入会永远显示「生效中」，
    // 必须看库里那份议定价才能发现这条记录已经失效
    const item = buildItem({
      configPriceDisplay: '598',
      overridePriceDisplay: '499',
    });

    expect(resolveRenewalBadgeState(item, '598')).toBe('inactive');
    expect(resolveRenewalBadgeState(item, '598.00')).toBe('inactive');
  });

  it('改动后按输入值实时反馈：抬高即生效、压低即失效', () => {
    const item = buildItem({
      configPriceDisplay: '598',
      overridePriceDisplay: '499',
    });

    expect(resolveRenewalBadgeState(item, '700')).toBe('effective');
    expect(resolveRenewalBadgeState(item, '450')).toBe('inactive');
  });

  it('清空覆盖：回到按配置价', () => {
    expect(
      resolveRenewalBadgeState(
        buildItem({ configPriceDisplay: '598', overridePriceDisplay: '499' }),
        '',
      ),
    ).toBe('default');
  });

  it('展示值异常时按生效中兜底，不制造无谓的告警', () => {
    expect(
      resolveRenewalBadgeState(
        buildItem({ configPriceDisplay: 'abc', overridePriceDisplay: '499' }),
        '499',
      ),
    ).toBe('effective');
    expect(resolveRenewalBadgeState(buildItem(), 'abc')).toBe('effective');
  });
});

describe('resolveRenewalHint', () => {
  it('未议价且未改动：提示按配置价续费', () => {
    expect(resolveRenewalHint(buildItem(), '')).toEqual({
      kind: 'config',
      amountDisplay: '598',
      previewDisplay: '598',
    });
  });

  it('改价高于配置价：展示调整后的续费价', () => {
    expect(
      resolveRenewalHint(buildItem({ configPriceDisplay: '398' }), '458'),
    ).toEqual({
      kind: 'adjusted',
      amountDisplay: '458',
      previewDisplay: '458',
    });
  });

  it('★ 改价低于配置价：点破这次改动不生效', () => {
    // 最终价仍是配置价，若按「预览有没有变」判断会落到
    // 「留空即按配置价续费」，与运营刚填的 450 自相矛盾
    const hint = resolveRenewalHint(buildItem(), '450');

    expect(hint.kind).toBe('ineffective');
    expect(hint.amountDisplay).toBe('450');
    expect(hint.previewDisplay).toBe('598');
  });

  it('议定价生效中且未改动：说明取高者口径', () => {
    const hint = resolveRenewalHint(
      buildItem({
        configPriceDisplay: '398',
        overridePriceDisplay: '458',
        renewalPriceDisplay: '458',
      }),
      '458',
    );

    expect(hint.kind).toBe('effective');
    expect(hint.amountDisplay).toBe('458');
  });

  it('★ 陈旧议定价且未改动：说清议定价是多少、当下实际收多少', () => {
    const hint = resolveRenewalHint(
      buildItem({ configPriceDisplay: '598', overridePriceDisplay: '499' }),
      '598',
    );

    expect(hint.kind).toBe('stale');
    expect(hint.amountDisplay).toBe('499');
    expect(hint.previewDisplay).toBe('598');
  });

  it('把失效的议定价抬高：转为展示调整后的续费价', () => {
    const hint = resolveRenewalHint(
      buildItem({ configPriceDisplay: '598', overridePriceDisplay: '499' }),
      '700',
    );

    expect(hint.kind).toBe('adjusted');
    expect(hint.previewDisplay).toBe('700');
  });

  it('清空覆盖：调整后回到配置价（含子账号加价）', () => {
    const hint = resolveRenewalHint(
      buildItem({
        configPriceDisplay: '398',
        overridePriceDisplay: '458',
        subAccountAmountDisplay: '150',
        renewalPriceDisplay: '608',
      }),
      '',
    );

    expect(hint.kind).toBe('adjusted');
    expect(hint.previewDisplay).toBe('548');
  });
});

describe('isPositiveDisplayAmount', () => {
  it('大于 0 的展示金额才算有加价', () => {
    expect(isPositiveDisplayAmount('150')).toBe(true);
    expect(isPositiveDisplayAmount('0')).toBe(false);
    expect(isPositiveDisplayAmount('')).toBe(false);
    expect(isPositiveDisplayAmount('abc')).toBe(false);
  });
});
