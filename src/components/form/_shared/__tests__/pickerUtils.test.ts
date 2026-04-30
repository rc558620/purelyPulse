/**
 * pickerUtils 单元测试
 *
 * 覆盖范围：
 *  - buildYears：默认参数、自定义 pastYears/futureYears、数量正确、首尾正确
 *  - MONTHS：长度 12，值 1-12
 *  - HOURS：长度 24，值 0-23
 *  - MINUTES：长度 60，值 0-59
 *  - pad2：个位数补零、双位数不变、零处理
 */

import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest';
import { buildYears, MONTHS, HOURS, MINUTES, pad2 } from '../pickerUtils';

// ─── 固定"当前年"避免跨年 flaky ─────────────────────────────────────────────

const FIXED_YEAR = 2024;

beforeAll(() => {
    vi.setSystemTime(new Date(`${FIXED_YEAR}-06-15T00:00:00`));
});

afterAll(() => {
    vi.useRealTimers();
});

// ─── buildYears ───────────────────────────────────────────────────────────────

describe('pickerUtils – buildYears', () => {
    it('默认参数生成 6 个年份（pastYears=4, futureYears=1）', () => {
        const years = buildYears();
        expect(years).toHaveLength(4 + 1 + 1); // 含当年
    });

    it('默认第一个年份为 当前年 - 4', () => {
        const years = buildYears();
        expect(years[0]).toBe(FIXED_YEAR - 4);
    });

    it('默认最后一个年份为 当前年 + 1', () => {
        const years = buildYears();
        expect(years[years.length - 1]).toBe(FIXED_YEAR + 1);
    });

    it('自定义 pastYears=0, futureYears=0 只返回当前年', () => {
        const years = buildYears(0, 0);
        expect(years).toEqual([FIXED_YEAR]);
    });

    it('自定义 pastYears=2, futureYears=3', () => {
        const years = buildYears(2, 3);
        expect(years[0]).toBe(FIXED_YEAR - 2);
        expect(years[years.length - 1]).toBe(FIXED_YEAR + 3);
        expect(years).toHaveLength(6); // 2 + 1 + 3
    });

    it('年份数组是连续递增的', () => {
        const years = buildYears(3, 2);
        for (let i = 1; i < years.length; i++) {
            expect(years[i]).toBe(years[i - 1]! + 1);
        }
    });
});

// ─── MONTHS ───────────────────────────────────────────────────────────────────

describe('pickerUtils – MONTHS', () => {
    it('长度为 12', () => {
        expect(MONTHS).toHaveLength(12);
    });

    it('第一项为 1', () => {
        expect(MONTHS[0]).toBe(1);
    });

    it('最后一项为 12', () => {
        expect(MONTHS[MONTHS.length - 1]).toBe(12);
    });

    it('月份是连续递增的', () => {
        for (let i = 1; i < MONTHS.length; i++) {
            expect(MONTHS[i]).toBe(MONTHS[i - 1]! + 1);
        }
    });
});

// ─── HOURS ────────────────────────────────────────────────────────────────────

describe('pickerUtils – HOURS', () => {
    it('长度为 24', () => {
        expect(HOURS).toHaveLength(24);
    });

    it('第一项为 0', () => {
        expect(HOURS[0]).toBe(0);
    });

    it('最后一项为 23', () => {
        expect(HOURS[HOURS.length - 1]).toBe(23);
    });
});

// ─── MINUTES ──────────────────────────────────────────────────────────────────

describe('pickerUtils – MINUTES', () => {
    it('长度为 60', () => {
        expect(MINUTES).toHaveLength(60);
    });

    it('第一项为 0', () => {
        expect(MINUTES[0]).toBe(0);
    });

    it('最后一项为 59', () => {
        expect(MINUTES[MINUTES.length - 1]).toBe(59);
    });
});

// ─── pad2 ─────────────────────────────────────────────────────────────────────

describe('pickerUtils – pad2', () => {
    it('个位数前补零', () => {
        expect(pad2(1)).toBe('01');
        expect(pad2(9)).toBe('09');
    });

    it('双位数不变', () => {
        expect(pad2(10)).toBe('10');
        expect(pad2(59)).toBe('59');
    });

    it('0 补为 "00"', () => {
        expect(pad2(0)).toBe('00');
    });

    it('三位数原样返回（不截断）', () => {
        expect(pad2(100)).toBe('100');
    });
});
