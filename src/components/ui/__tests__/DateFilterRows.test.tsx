/**
 * DateFilterRows 组件单元测试
 * 包含：CustomDateBtnRow + DateRangeRow
 *
 * ─ CustomDateBtnRow
 *    1.  渲染两个 button
 *    2.  第一个按钮默认文字"选择年月日"
 *    3.  自定义 customDateBtnText 生效
 *    4.  第二个按钮文字固定"日期范围"
 *    5.  isCustomDate=true 时第一个按钮含 customModeBtnActive class
 *    6.  isCustomDate=false 时第一个按钮不含 active class
 *    7.  isCustomRange=true 时第二个按钮含 customModeBtnActive class
 *    8.  isCustomRange=false 时第二个按钮不含 active class
 *    9.  第一个按钮 aria-pressed 反映 isCustomDate
 *    10. 第二个按钮 aria-pressed 反映 isCustomRange
 *    11. 第一个按钮 aria-label="选择年月日"
 *    12. 第二个按钮 aria-label="选择日期范围"
 *    13. 点击第一个按钮触发 onToggleCustomDate
 *    14. 点击第二个按钮触发 onToggleCustomRange
 *    15. button type="button"
 *    16. CustomDateBtnRow 是 React.memo 包裹的组件
 *
 * ─ DateRangeRow
 *    17. 渲染"开始日期"标签
 *    18. 渲染"结束日期"标签
 *    19. 渲染分隔符"→"
 *    20. 渲染两个 DayPicker（mock）
 *    21. 开始 DayPicker 收到正确的 year/month/day
 *    22. 结束 DayPicker 收到正确的 year/month/day
 *    23. 开始 DayPicker onChange 触发 onStartChange
 *    24. 结束 DayPicker onChange 触发 onEndChange
 *    25. 开始 DayPicker onClear 触发 onStartClear
 *    26. 结束 DayPicker onClear 触发 onEndClear
 *    27. DateRangeRow 是 React.memo 包裹的组件
 */

import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CustomDateBtnRow, DateRangeRow } from '../filter/DateFilterRows/DateFilterRows';

// ─────────────────────────────────────────────────────────────────────────────
// mock DayPicker：避免弹层和设备判断逻辑
// ─────────────────────────────────────────────────────────────────────────────

interface MockDayPickerProps {
    year: number;
    month: number;
    day: number;
    onChange: (y: number, m: number, d: number) => void;
    onClear?: () => void;
    'data-testid'?: string;
}

vi.mock('@components/form/DayPicker', () => ({
    default: ({ year, month, day, onChange, onClear, ...rest }: MockDayPickerProps) => (
        <div
            data-testid={rest['data-testid'] ?? 'mock-day-picker'}
            data-year={year}
            data-month={month}
            data-day={day}
        >
            <button
                type="button"
                onClick={() => onChange(2024, 3, 15)}
                aria-label="trigger-change"
            />
            {onClear && (
                <button
                    type="button"
                    onClick={onClear}
                    aria-label="trigger-clear"
                />
            )}
        </div>
    ),
}));

// ═══════════════════════════════════════════════════════════════
// CustomDateBtnRow
// ═══════════════════════════════════════════════════════════════

function renderCustomBtnRow(
    overrides: Partial<React.ComponentProps<typeof CustomDateBtnRow>> = {},
) {
    const defaults = {
        isCustomDate: false,
        isCustomRange: false,
        onToggleCustomDate: vi.fn(),
        onToggleCustomRange: vi.fn(),
    };
    return render(<CustomDateBtnRow {...defaults} {...overrides} />);
}

describe('CustomDateBtnRow – 基本渲染', () => {
    it('渲染两个 button', () => {
        renderCustomBtnRow();
        expect(screen.getAllByRole('button')).toHaveLength(2);
    });

    it('第一个按钮默认文字"选择年月日"', () => {
        renderCustomBtnRow();
        expect(screen.getAllByRole('button')[0]).toHaveTextContent('选择年月日');
    });

    it('自定义 customDateBtnText 生效', () => {
        renderCustomBtnRow({ customDateBtnText: '2024年3月' });
        expect(screen.getAllByRole('button')[0]).toHaveTextContent('2024年3月');
    });

    it('第二个按钮文字固定"日期范围"', () => {
        renderCustomBtnRow();
        expect(screen.getAllByRole('button')[1]).toHaveTextContent('日期范围');
    });
});

describe('CustomDateBtnRow – 激活态', () => {
    it('isCustomDate=true 时第一个按钮含 customModeBtnActive class', () => {
        renderCustomBtnRow({ isCustomDate: true });
        expect(screen.getAllByRole('button')[0].className).toMatch(/customModeBtnActive/);
    });

    it('isCustomDate=false 时第一个按钮不含 customModeBtnActive class', () => {
        renderCustomBtnRow({ isCustomDate: false });
        expect(screen.getAllByRole('button')[0].className).not.toMatch(/customModeBtnActive/);
    });

    it('isCustomRange=true 时第二个按钮含 customModeBtnActive class', () => {
        renderCustomBtnRow({ isCustomRange: true });
        expect(screen.getAllByRole('button')[1].className).toMatch(/customModeBtnActive/);
    });

    it('isCustomRange=false 时第二个按钮不含 customModeBtnActive class', () => {
        renderCustomBtnRow({ isCustomRange: false });
        expect(screen.getAllByRole('button')[1].className).not.toMatch(/customModeBtnActive/);
    });
});

describe('CustomDateBtnRow – aria 属性', () => {
    it('第一个按钮 aria-pressed 反映 isCustomDate=true', () => {
        renderCustomBtnRow({ isCustomDate: true });
        expect(screen.getAllByRole('button')[0]).toHaveAttribute('aria-pressed', 'true');
    });

    it('第一个按钮 aria-pressed 反映 isCustomDate=false', () => {
        renderCustomBtnRow({ isCustomDate: false });
        expect(screen.getAllByRole('button')[0]).toHaveAttribute('aria-pressed', 'false');
    });

    it('第二个按钮 aria-pressed 反映 isCustomRange', () => {
        renderCustomBtnRow({ isCustomRange: true });
        expect(screen.getAllByRole('button')[1]).toHaveAttribute('aria-pressed', 'true');
    });

    it('第一个按钮 aria-label="选择年月日"', () => {
        renderCustomBtnRow();
        expect(screen.getAllByRole('button')[0]).toHaveAttribute('aria-label', '选择年月日');
    });

    it('第二个按钮 aria-label="选择日期范围"', () => {
        renderCustomBtnRow();
        expect(screen.getAllByRole('button')[1]).toHaveAttribute('aria-label', '选择日期范围');
    });

    it('两个 button 均为 type="button"', () => {
        renderCustomBtnRow();
        screen.getAllByRole('button').forEach((btn) => {
            expect(btn).toHaveAttribute('type', 'button');
        });
    });
});

describe('CustomDateBtnRow – 点击事件', () => {
    it('点击第一个按钮触发 onToggleCustomDate', async () => {
        const user = userEvent.setup();
        const onToggleCustomDate = vi.fn();
        renderCustomBtnRow({ onToggleCustomDate });
        await user.click(screen.getAllByRole('button')[0]);
        expect(onToggleCustomDate).toHaveBeenCalledTimes(1);
    });

    it('点击第二个按钮触发 onToggleCustomRange', async () => {
        const user = userEvent.setup();
        const onToggleCustomRange = vi.fn();
        renderCustomBtnRow({ onToggleCustomRange });
        await user.click(screen.getAllByRole('button')[1]);
        expect(onToggleCustomRange).toHaveBeenCalledTimes(1);
    });
});

describe('CustomDateBtnRow – React.memo', () => {
    it('CustomDateBtnRow 是 React.memo 包裹的组件', () => {
        expect((CustomDateBtnRow as unknown as { $$typeof?: symbol }).$$typeof?.toString()).toContain('memo');
    });
});

// ═══════════════════════════════════════════════════════════════
// DateRangeRow
// ═══════════════════════════════════════════════════════════════

function renderDateRangeRow(
    overrides: Partial<React.ComponentProps<typeof DateRangeRow>> = {},
) {
    const defaults = {
        startYear: 2024, startMonth: 1, startDay: 1,
        onStartChange: vi.fn(),
        onStartClear: vi.fn(),
        endYear: 2024, endMonth: 12, endDay: 31,
        onEndChange: vi.fn(),
        onEndClear: vi.fn(),
    };
    return render(<DateRangeRow {...defaults} {...overrides} />);
}

describe('DateRangeRow – 基本渲染', () => {
    it('渲染"开始日期"标签', () => {
        renderDateRangeRow();
        expect(screen.getByText('开始日期')).toBeInTheDocument();
    });

    it('渲染"结束日期"标签', () => {
        renderDateRangeRow();
        expect(screen.getByText('结束日期')).toBeInTheDocument();
    });

    it('渲染分隔符"→"', () => {
        renderDateRangeRow();
        expect(screen.getByText('→')).toBeInTheDocument();
    });

    it('渲染两个 DayPicker（mock-day-picker）', () => {
        renderDateRangeRow();
        expect(screen.getAllByTestId('mock-day-picker')).toHaveLength(2);
    });
});

describe('DateRangeRow – DayPicker props 透传', () => {
    it('第一个 DayPicker 收到 startYear/startMonth/startDay', () => {
        renderDateRangeRow({ startYear: 2023, startMonth: 5, startDay: 10 });
        const pickers = screen.getAllByTestId('mock-day-picker');
        expect(pickers[0]).toHaveAttribute('data-year', '2023');
        expect(pickers[0]).toHaveAttribute('data-month', '5');
        expect(pickers[0]).toHaveAttribute('data-day', '10');
    });

    it('第二个 DayPicker 收到 endYear/endMonth/endDay', () => {
        renderDateRangeRow({ endYear: 2024, endMonth: 8, endDay: 20 });
        const pickers = screen.getAllByTestId('mock-day-picker');
        expect(pickers[1]).toHaveAttribute('data-year', '2024');
        expect(pickers[1]).toHaveAttribute('data-month', '8');
        expect(pickers[1]).toHaveAttribute('data-day', '20');
    });
});

describe('DateRangeRow – 回调', () => {
    it('第一个 DayPicker onChange 触发 onStartChange', async () => {
        const user = userEvent.setup();
        const onStartChange = vi.fn();
        renderDateRangeRow({ onStartChange });
        const pickers = screen.getAllByTestId('mock-day-picker');
        // trigger-change 按钮调用 onChange(2024, 3, 15)
        const changeBtn = pickers[0].querySelector('[aria-label="trigger-change"]')!;
        await user.click(changeBtn);
        expect(onStartChange).toHaveBeenCalledWith(2024, 3, 15);
    });

    it('第二个 DayPicker onChange 触发 onEndChange', async () => {
        const user = userEvent.setup();
        const onEndChange = vi.fn();
        renderDateRangeRow({ onEndChange });
        const pickers = screen.getAllByTestId('mock-day-picker');
        const changeBtn = pickers[1].querySelector('[aria-label="trigger-change"]')!;
        await user.click(changeBtn);
        expect(onEndChange).toHaveBeenCalledWith(2024, 3, 15);
    });

    it('第一个 DayPicker onClear 触发 onStartClear', async () => {
        const user = userEvent.setup();
        const onStartClear = vi.fn();
        renderDateRangeRow({ onStartClear });
        const pickers = screen.getAllByTestId('mock-day-picker');
        const clearBtn = pickers[0].querySelector('[aria-label="trigger-clear"]')!;
        await user.click(clearBtn);
        expect(onStartClear).toHaveBeenCalledTimes(1);
    });

    it('第二个 DayPicker onClear 触发 onEndClear', async () => {
        const user = userEvent.setup();
        const onEndClear = vi.fn();
        renderDateRangeRow({ onEndClear });
        const pickers = screen.getAllByTestId('mock-day-picker');
        const clearBtn = pickers[1].querySelector('[aria-label="trigger-clear"]')!;
        await user.click(clearBtn);
        expect(onEndClear).toHaveBeenCalledTimes(1);
    });
});

describe('DateRangeRow – React.memo', () => {
    it('DateRangeRow 是 React.memo 包裹的组件', () => {
        expect((DateRangeRow as unknown as { $$typeof?: symbol }).$$typeof?.toString()).toContain('memo');
    });
});
