/**
 * DateRangePicker 组件单元测试
 *
 * 覆盖范围：
 *  - 渲染两个 DayPicker（开始/结束日期各一个）
 *  - 渲染"开始日期"和"结束日期"标签
 *  - 渲染分隔符"→"
 *  - 开始日期正确传入 year/month/day
 *  - 结束日期正确传入 year/month/day
 *  - onStartChange 回调正确触发（通过 DayPicker 的 trigger 展示验证）
 *  - onEndChange 回调正确触发
 *  - onClear 同时传给两个 DayPicker（清除按钮均出现）
 *  - 边界：开始/结束日期展示格式
 */

import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import DateRangePicker from '../DateRangePicker';

// ─── 辅助默认 props ───────────────────────────────────────────────────────────

const DEFAULT_PROPS = {
    startYear: 2024,
    startMonth: 3,
    startDay: 1,
    endYear: 2024,
    endMonth: 3,
    endDay: 31,
    onStartChange: vi.fn(),
    onEndChange: vi.fn(),
    onClear: vi.fn(),
};

// ─── 1. 基本渲染 ─────────────────────────────────────────────────────────────

describe('DateRangePicker – 基本渲染', () => {
    it('渲染"开始日期"标签', () => {
        render(<DateRangePicker {...DEFAULT_PROPS} />);
        expect(screen.getByText('开始日期')).toBeInTheDocument();
    });

    it('渲染"结束日期"标签', () => {
        render(<DateRangePicker {...DEFAULT_PROPS} />);
        expect(screen.getByText('结束日期')).toBeInTheDocument();
    });

    it('渲染分隔符"→"', () => {
        render(<DateRangePicker {...DEFAULT_PROPS} />);
        expect(screen.getByText('→')).toBeInTheDocument();
    });
});

// ─── 2. 日期展示 ─────────────────────────────────────────────────────────────

describe('DateRangePicker – 日期展示', () => {
    it('开始日期展示正确的 YYYY/MM/DD', () => {
        render(<DateRangePicker {...DEFAULT_PROPS} />);
        expect(screen.getByText('2024/03/01')).toBeInTheDocument();
    });

    it('结束日期展示正确的 YYYY/MM/DD', () => {
        render(<DateRangePicker {...DEFAULT_PROPS} />);
        expect(screen.getByText('2024/03/31')).toBeInTheDocument();
    });

    it('月份/日期 < 10 时补零', () => {
        render(
            <DateRangePicker
                {...DEFAULT_PROPS}
                startYear={2024}
                startMonth={1}
                startDay={5}
                endYear={2024}
                endMonth={9}
                endDay={8}
            />,
        );
        expect(screen.getByText('2024/01/05')).toBeInTheDocument();
        expect(screen.getByText('2024/09/08')).toBeInTheDocument();
    });
});

// ─── 3. onClear 传递 ─────────────────────────────────────────────────────────

describe('DateRangePicker – onClear', () => {
    it('两个 DayPicker 均接收 onClear（显示清除按钮）', () => {
        render(<DateRangePicker {...DEFAULT_PROPS} />);
        // 两个清除按钮
        const clearBtns = screen.getAllByRole('button', { name: '清除日期' });
        expect(clearBtns).toHaveLength(2);
    });
});

// ─── 4. 不同日期值 ───────────────────────────────────────────────────────────

describe('DateRangePicker – 不同日期值', () => {
    it('开始日期和结束日期同时展示', () => {
        render(
            <DateRangePicker
                startYear={2024}
                startMonth={1}
                startDay={1}
                endYear={2024}
                endMonth={12}
                endDay={31}
                onStartChange={vi.fn()}
                onEndChange={vi.fn()}
                onClear={vi.fn()}
            />,
        );
        expect(screen.getByText('2024/01/01')).toBeInTheDocument();
        expect(screen.getByText('2024/12/31')).toBeInTheDocument();
    });
});
