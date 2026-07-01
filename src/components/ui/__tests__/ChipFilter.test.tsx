/**
 * ChipFilter 组件单元测试
 *
 * 覆盖范围：
 *  ─ 基本渲染
 *    1.  渲染"全部"chip（默认 allLabel）
 *    2.  自定义 allLabel 生效
 *    3.  string[] options 渲染对应 chip
 *    4.  ChipFilterOption[] options 渲染 label 文本
 *    5.  options 为空数组时仅渲染"全部"
 *  ─ 选中态
 *    6.  value="" 时"全部"chip 含 chipActive class
 *    7.  value="" 时其他 chip 不含 chipActive
 *    8.  value 匹配某项时对应 chip 含 chipActive
 *    9.  value 匹配时"全部"不含 chipActive
 *  ─ 切换逻辑
 *    10. 点击"全部"调用 onChange("")
 *    11. 点击某 chip 调用 onChange(optValue)
 *    12. 再次点击已选中的 chip 调用 onChange("")（取消选中）
 *    13. "全部"已选中时点击"全部"不触发 onChange
 *    14. 选中其他项时点击"全部"触发 onChange("")
 *  ─ options 归一化
 *    14. string[] 转为 { label, value } 后 label 正确显示
 *    15. ChipFilterOption[] 直接使用 label/value
 *  ─ className 透传
 *    16. className 附加到容器 div
 *  ─ React.memo
 *    17. ChipFilter 是 React.memo 包裹的组件
 */

import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ChipFilter from '../filter/ChipFilter/ChipFilter';
import type { ChipFilterOption } from '../filter/ChipFilter/ChipFilter';

// ─────────────────────────────────────────────────────────────────────────────
// 辅助函数
// ─────────────────────────────────────────────────────────────────────────────
const STRING_OPTIONS = ['全谷物', '乳制品', '蔬菜'];
const OBJECT_OPTIONS: ChipFilterOption[] = [
    { label: '商品A', value: 'a' },
    { label: '商品B', value: 'b' },
    { label: '商品C', value: 'c' },
];

function renderChip(overrides: Partial<React.ComponentProps<typeof ChipFilter>> = {}) {
    const defaults = {
        options: STRING_OPTIONS,
        value: '',
        onChange: vi.fn(),
    };
    return render(<ChipFilter {...defaults} {...overrides} />);
}

// ─── 1. 基本渲染 ──────────────────────────────────────────────────────────────
describe('ChipFilter – 基本渲染', () => {
    it('渲染"全部"chip（默认 allLabel）', () => {
        renderChip();
        expect(screen.getByRole('button', { name: '全部' })).toBeInTheDocument();
    });

    it('自定义 allLabel 生效', () => {
        renderChip({ allLabel: 'All' });
        expect(screen.getByRole('button', { name: 'All' })).toBeInTheDocument();
    });

    it('string[] options 渲染对应 chip', () => {
        renderChip({ options: STRING_OPTIONS });
        STRING_OPTIONS.forEach((opt) => {
            expect(screen.getByRole('button', { name: opt })).toBeInTheDocument();
        });
    });

    it('ChipFilterOption[] options 渲染 label 文本', () => {
        renderChip({ options: OBJECT_OPTIONS });
        OBJECT_OPTIONS.forEach((opt) => {
            expect(screen.getByRole('button', { name: opt.label })).toBeInTheDocument();
        });
    });

    it('options 为空数组时仅渲染"全部"chip', () => {
        renderChip({ options: [] });
        expect(screen.getAllByRole('button')).toHaveLength(1);
        expect(screen.getByRole('button', { name: '全部' })).toBeInTheDocument();
    });
});

// ─── 2. 选中态 ────────────────────────────────────────────────────────────────
describe('ChipFilter – 选中态', () => {
    it('value="" 时"全部"chip 含 chipActive class', () => {
        renderChip({ value: '' });
        const allBtn = screen.getByRole('button', { name: '全部' });
        expect(allBtn.className).toMatch(/chipActive/);
    });

    it('value="" 时其他 chip 不含 chipActive', () => {
        renderChip({ options: STRING_OPTIONS, value: '' });
        STRING_OPTIONS.forEach((opt) => {
            expect(screen.getByRole('button', { name: opt }).className).not.toMatch(/chipActive/);
        });
    });

    it('value 匹配某项时该 chip 含 chipActive', () => {
        renderChip({ options: STRING_OPTIONS, value: '乳制品' });
        expect(screen.getByRole('button', { name: '乳制品' }).className).toMatch(/chipActive/);
    });

    it('value 匹配时"全部"chip 不含 chipActive', () => {
        renderChip({ options: STRING_OPTIONS, value: '乳制品' });
        expect(screen.getByRole('button', { name: '全部' }).className).not.toMatch(/chipActive/);
    });

    it('value 匹配时其余 chip 不含 chipActive', () => {
        renderChip({ options: STRING_OPTIONS, value: '乳制品' });
        ['全谷物', '蔬菜'].forEach((opt) => {
            expect(screen.getByRole('button', { name: opt }).className).not.toMatch(/chipActive/);
        });
    });
});

// ─── 3. 切换逻辑 ──────────────────────────────────────────────────────────────
describe('ChipFilter – 切换逻辑', () => {
    it('点击"全部"调用 onChange("")', async () => {
        const user = userEvent.setup();
        const onChange = vi.fn();
        renderChip({ onChange, value: '乳制品' });
        await user.click(screen.getByRole('button', { name: '全部' }));
        expect(onChange).toHaveBeenCalledWith('');
    });

    it('点击某 chip 调用 onChange(optValue)', async () => {
        const user = userEvent.setup();
        const onChange = vi.fn();
        renderChip({ options: STRING_OPTIONS, onChange, value: '' });
        await user.click(screen.getByRole('button', { name: '全谷物' }));
        expect(onChange).toHaveBeenCalledWith('全谷物');
    });

    it('再次点击已选中的 chip 调用 onChange("")（取消选中）', async () => {
        const user = userEvent.setup();
        const onChange = vi.fn();
        // value 已是 "乳制品"，再次点击同一 chip
        renderChip({ options: STRING_OPTIONS, onChange, value: '乳制品' });
        await user.click(screen.getByRole('button', { name: '乳制品' }));
        expect(onChange).toHaveBeenCalledWith('');
    });

    it('"全部"已选中时点击"全部"不触发 onChange', async () => {
        const user = userEvent.setup();
        const onChange = vi.fn();
        renderChip({ onChange, value: '' });
        await user.click(screen.getByRole('button', { name: '全部' }));
        expect(onChange).not.toHaveBeenCalled();
    });

    it('选中其他项时点击"全部"触发 onChange("")', async () => {
        const user = userEvent.setup();
        const onChange = vi.fn();
        renderChip({ onChange, value: '乳制品' });
        await user.click(screen.getByRole('button', { name: '全部' }));
        expect(onChange).toHaveBeenCalledTimes(1);
        expect(onChange).toHaveBeenCalledWith('');
    });

    it('ChipFilterOption[] 点击某项 onChange 传 value 字段', async () => {
        const user = userEvent.setup();
        const onChange = vi.fn();
        renderChip({ options: OBJECT_OPTIONS, onChange, value: '' });
        await user.click(screen.getByRole('button', { name: '商品B' }));
        expect(onChange).toHaveBeenCalledWith('b');
    });
});

// ─── 4. className 透传 ────────────────────────────────────────────────────────
describe('ChipFilter – className 透传', () => {
    it('className 附加到容器 div', () => {
        const { container } = renderChip({ className: 'my-chip-filter' });
        expect((container.firstChild as HTMLElement).className).toContain('my-chip-filter');
    });
});

// ─── 5. React.memo ────────────────────────────────────────────────────────────
describe('ChipFilter – React.memo', () => {
    it('ChipFilter 是 React.memo 包裹的组件', () => {
        expect((ChipFilter as unknown as { $$typeof?: symbol }).$$typeof?.toString()).toContain('memo');
    });
});
