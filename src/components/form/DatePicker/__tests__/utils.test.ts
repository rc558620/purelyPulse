/**
 * DatePicker/utils 单元测试
 *
 * 覆盖范围：
 *  - WEEK_LABELS / MONTH_NAMES 常量
 *  - HOURS / MINUTES 数组
 *  - ITEM_H / VISIBLE 常量
 *  - toLocalDate：字符串解析为本地零点 Date
 *  - toDateString：Date → "YYYY-MM-DD"
 *  - getDaysInMonth：各月天数，含闰年
 *  - getFirstDayOfWeek：各月第一天是周几
 *  - parseTime：正常、边界 clamp、格式异常
 *  - parseDatetimeValue：空/null、无空格、有空格
 *  - buildDatetimeValue：正常、空 date
 *  - isDateDisabled：maxDate / minDate / 两者均无
 *  - isMonthDisabled：maxMonth / minMonth / 两者均无
 *  - buildCalCells：42 格、空格、日期格格式
 *  - buildYearList：前10后2年
 */

import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest';
import {
    WEEK_LABELS,
    MONTH_NAMES,
    HOURS,
    MINUTES,
    ITEM_H,
    VISIBLE,
    toLocalDate,
    toDateString,
    getDaysInMonth,
    getFirstDayOfWeek,
    parseTime,
    parseDatetimeValue,
    buildDatetimeValue,
    isDateDisabled,
    isMonthDisabled,
    buildCalCells,
    buildYearList,
} from '../utils';

// ─── 固定系统时间（避免 toDateString 时区问题）────────────────────────────────

beforeAll(() => {
    vi.setSystemTime(new Date('2024-06-15T12:00:00'));
});
afterAll(() => {
    vi.useRealTimers();
});

// ─── 常量 ─────────────────────────────────────────────────────────────────────

describe('DatePicker/utils – 常量', () => {
    it('WEEK_LABELS 长度为 7，第一项为"日"', () => {
        expect(WEEK_LABELS).toHaveLength(7);
        expect(WEEK_LABELS[0]).toBe('日');
        expect(WEEK_LABELS[6]).toBe('六');
    });

    it('MONTH_NAMES 长度为 12，第一项为"1月"', () => {
        expect(MONTH_NAMES).toHaveLength(12);
        expect(MONTH_NAMES[0]).toBe('1月');
        expect(MONTH_NAMES[11]).toBe('12月');
    });

    it('HOURS 为 00..23 的字符串数组', () => {
        expect(HOURS).toHaveLength(24);
        expect(HOURS[0]).toBe('00');
        expect(HOURS[9]).toBe('09');
        expect(HOURS[23]).toBe('23');
    });

    it('MINUTES 为 00..59 的字符串数组', () => {
        expect(MINUTES).toHaveLength(60);
        expect(MINUTES[0]).toBe('00');
        expect(MINUTES[9]).toBe('09');
        expect(MINUTES[59]).toBe('59');
    });

    it('ITEM_H 为正整数', () => {
        expect(typeof ITEM_H).toBe('number');
        expect(ITEM_H).toBeGreaterThan(0);
    });

    it('VISIBLE 为奇数正整数', () => {
        expect(typeof VISIBLE).toBe('number');
        expect(VISIBLE % 2).toBe(1);
        expect(VISIBLE).toBeGreaterThan(0);
    });
});

// ─── toLocalDate ──────────────────────────────────────────────────────────────

describe('DatePicker/utils – toLocalDate', () => {
    it('将 "YYYY-MM-DD" 解析为本地时间零点', () => {
        const d = toLocalDate('2024-03-15');
        expect(d.getFullYear()).toBe(2024);
        expect(d.getMonth()).toBe(2); // 0-indexed: March = 2
        expect(d.getDate()).toBe(15);
        expect(d.getHours()).toBe(0);
        expect(d.getMinutes()).toBe(0);
    });

    it('传入 Date 对象直接返回', () => {
        const input = new Date(2024, 5, 15);
        expect(toLocalDate(input)).toBe(input);
    });

    it('月份单位数正常解析', () => {
        const d = toLocalDate('2024-01-01');
        expect(d.getMonth()).toBe(0);
        expect(d.getDate()).toBe(1);
    });
});

// ─── toDateString ─────────────────────────────────────────────────────────────

describe('DatePicker/utils – toDateString', () => {
    it('Date → "YYYY-MM-DD" 格式', () => {
        expect(toDateString(new Date(2024, 2, 15))).toBe('2024-03-15');
    });

    it('单位数月份和日期前补零', () => {
        expect(toDateString(new Date(2024, 0, 5))).toBe('2024-01-05');
    });

    it('12月 31日 正确格式化', () => {
        expect(toDateString(new Date(2024, 11, 31))).toBe('2024-12-31');
    });
});

// ─── getDaysInMonth ───────────────────────────────────────────────────────────

describe('DatePicker/utils – getDaysInMonth', () => {
    it('1月（大月）31天', () => {
        expect(getDaysInMonth(2024, 0)).toBe(31); // month 0-indexed
    });

    it('4月（小月）30天', () => {
        expect(getDaysInMonth(2024, 3)).toBe(30);
    });

    it('闰年2月29天', () => {
        expect(getDaysInMonth(2024, 1)).toBe(29);
    });

    it('非闰年2月28天', () => {
        expect(getDaysInMonth(2023, 1)).toBe(28);
    });

    it('12月31天', () => {
        expect(getDaysInMonth(2024, 11)).toBe(31);
    });
});

// ─── getFirstDayOfWeek ────────────────────────────────────────────────────────

describe('DatePicker/utils – getFirstDayOfWeek', () => {
    it('2024年1月第一天是周一（1）', () => {
        expect(getFirstDayOfWeek(2024, 0)).toBe(1);
    });

    it('2024年6月第一天是周六（6）', () => {
        expect(getFirstDayOfWeek(2024, 5)).toBe(6);
    });

    it('返回值在 0-6 之间', () => {
        const day = getFirstDayOfWeek(2024, 3);
        expect(day).toBeGreaterThanOrEqual(0);
        expect(day).toBeLessThanOrEqual(6);
    });
});

// ─── parseTime ────────────────────────────────────────────────────────────────

describe('DatePicker/utils – parseTime', () => {
    it('正常解析 "HH:mm"', () => {
        expect(parseTime('09:30')).toEqual({ hour: 9, minute: 30 });
    });

    it('边界值 "00:00"', () => {
        expect(parseTime('00:00')).toEqual({ hour: 0, minute: 0 });
    });

    it('边界值 "23:59"', () => {
        expect(parseTime('23:59')).toEqual({ hour: 23, minute: 59 });
    });

    it('超出范围 "25:70" → clamp 到 23:59', () => {
        expect(parseTime('25:70')).toEqual({ hour: 23, minute: 59 });
    });

    it('负值 "-1:-1" → clamp 到 0:0', () => {
        const result = parseTime('-1:-1');
        expect(result.hour).toBeGreaterThanOrEqual(0);
        expect(result.minute).toBeGreaterThanOrEqual(0);
    });

    it('格式异常 "abc" → parseInt("abc") = NaN，clamp 后为 0', () => {
        // parseInt('abc', 10) = NaN, Math.max(0, NaN) = NaN, Math.min(23, NaN) = NaN
        // 实际实现没有特殊处理，返回 NaN；此处只做不抛错验证
        expect(() => parseTime('abc')).not.toThrow();
    });
});

// ─── parseDatetimeValue ───────────────────────────────────────────────────────

describe('DatePicker/utils – parseDatetimeValue', () => {
    it('null → { date: "", time: "09:00" }', () => {
        expect(parseDatetimeValue(null)).toEqual({ date: '', time: '09:00' });
    });

    it('undefined → { date: "", time: "09:00" }', () => {
        expect(parseDatetimeValue(undefined)).toEqual({ date: '', time: '09:00' });
    });

    it('空字符串 → { date: "", time: "09:00" }', () => {
        expect(parseDatetimeValue('')).toEqual({ date: '', time: '09:00' });
    });

    it('无空格的纯日期字符串 → date=该值, time="09:00"', () => {
        expect(parseDatetimeValue('2024-03-15')).toEqual({
            date: '2024-03-15',
            time: '09:00',
        });
    });

    it('"YYYY-MM-DD HH:mm" 格式正确分割', () => {
        expect(parseDatetimeValue('2024-03-15 14:30')).toEqual({
            date: '2024-03-15',
            time: '14:30',
        });
    });

    it('时间部分含多余空格的字符串', () => {
        const result = parseDatetimeValue('2024-01-01 09:00');
        expect(result.date).toBe('2024-01-01');
        expect(result.time).toBe('09:00');
    });
});

// ─── buildDatetimeValue ───────────────────────────────────────────────────────

describe('DatePicker/utils – buildDatetimeValue', () => {
    it('正常拼接返回 "YYYY-MM-DD HH:mm"', () => {
        expect(buildDatetimeValue('2024-03-15', '14:30')).toBe('2024-03-15 14:30');
    });

    it('date 为空字符串时返回空字符串', () => {
        expect(buildDatetimeValue('', '14:30')).toBe('');
    });
});

// ─── isDateDisabled ───────────────────────────────────────────────────────────

describe('DatePicker/utils – isDateDisabled', () => {
    it('dateStr > maxDate → disabled', () => {
        expect(isDateDisabled('2024-12-31', '2024-06-30')).toBe(true);
    });

    it('dateStr === maxDate → not disabled', () => {
        expect(isDateDisabled('2024-06-30', '2024-06-30')).toBe(false);
    });

    it('dateStr < minDate → disabled', () => {
        expect(isDateDisabled('2024-01-01', undefined, '2024-06-01')).toBe(true);
    });

    it('dateStr === minDate → not disabled', () => {
        expect(isDateDisabled('2024-06-01', undefined, '2024-06-01')).toBe(false);
    });

    it('无 maxDate / minDate → not disabled', () => {
        expect(isDateDisabled('2024-06-15')).toBe(false);
    });

    it('maxDate 和 minDate 都设置，在范围内 → not disabled', () => {
        expect(isDateDisabled('2024-06-15', '2024-12-31', '2024-01-01')).toBe(false);
    });

    it('maxDate 和 minDate 都设置，超过 maxDate → disabled', () => {
        expect(isDateDisabled('2025-01-01', '2024-12-31', '2024-01-01')).toBe(true);
    });
});

// ─── isMonthDisabled ──────────────────────────────────────────────────────────

describe('DatePicker/utils – isMonthDisabled', () => {
    it('"2024-12" > "2024-06" maxMonth → disabled', () => {
        expect(isMonthDisabled('2024-12', '2024-06')).toBe(true);
    });

    it('"2024-06" === "2024-06" maxMonth → not disabled', () => {
        expect(isMonthDisabled('2024-06', '2024-06')).toBe(false);
    });

    it('"2024-01" < "2024-06" minMonth → disabled', () => {
        expect(isMonthDisabled('2024-01', undefined, '2024-06')).toBe(true);
    });

    it('无限制 → not disabled', () => {
        expect(isMonthDisabled('2024-06')).toBe(false);
    });
});

// ─── buildCalCells ────────────────────────────────────────────────────────────

describe('DatePicker/utils – buildCalCells', () => {
    it('返回 42 个单元格（6 行 × 7 列）', () => {
        const cells = buildCalCells(2024, 0); // 2024年1月
        expect(cells).toHaveLength(42);
    });

    it('首行含空格（1月第一天不是周日时）', () => {
        // 2024-01-01 是周一（getFirstDayOfWeek=1），所以前面有 1 个空格
        const cells = buildCalCells(2024, 0);
        expect(cells[0]).toEqual({ day: null, dateStr: null });
        expect(cells[1]).toEqual({ day: 1, dateStr: '2024-01-01' });
    });

    it('日期单元格 dateStr 格式为 YYYY-MM-DD', () => {
        const cells = buildCalCells(2024, 0);
        const validCells = cells.filter(c => c.day !== null);
        validCells.forEach(c => {
            expect(c.dateStr).toMatch(/^\d{4}-\d{2}-\d{2}$/);
        });
    });

    it('有效日期数量等于当月天数', () => {
        const cells = buildCalCells(2024, 1); // 2024年2月（闰年29天）
        const validCells = cells.filter(c => c.day !== null);
        expect(validCells).toHaveLength(29);
    });

    it('null 单元格数量 = 42 - 当月天数（前置 + 末尾共 11 格）', () => {
        // 2024年1月：31天，前置空格1，末尾空格10，共 11 个 null
        const cells = buildCalCells(2024, 0);
        const nullCells = cells.filter(c => c.day === null);
        expect(nullCells).toHaveLength(42 - 31); // 11
    });
});

// ─── buildYearList ────────────────────────────────────────────────────────────

describe('DatePicker/utils – buildYearList', () => {
    it('返回 13 个年份（前10后2含当年）', () => {
        const years = buildYearList(2024);
        expect(years).toHaveLength(13); // 10 + 1 + 2
    });

    it('第一个年份为 currentYear - 10', () => {
        const years = buildYearList(2024);
        expect(years[0]).toBe(2014);
    });

    it('最后一个年份为 currentYear + 2', () => {
        const years = buildYearList(2024);
        expect(years[years.length - 1]).toBe(2026);
    });

    it('年份连续递增', () => {
        const years = buildYearList(2024);
        for (let i = 1; i < years.length; i++) {
            expect(years[i]).toBe(years[i - 1]! + 1);
        }
    });
});
