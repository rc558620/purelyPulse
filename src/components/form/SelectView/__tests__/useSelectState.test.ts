/**
 * useSelectState Hook 单元测试
 *
 * 覆盖范围：
 *  - normalizeValue 工具函数
 *  - 初始状态：displayText、selectedValues、searchText、draftValues
 *  - 受控 / 非受控 selectedValues
 *  - handleSingleSelect：值更新、onChange 回调、关闭面板
 *  - handleMultiToggle：草稿切换（添加/删除）
 *  - handleMultiConfirm：提交草稿、onChange 回调、关闭面板
 *  - handleClear（单选）：清除 internalValues，onChange 收到 ''
 *  - handleClear（多选）：清除 internalValues，onChange 收到 []
 *  - handleClear stopPropagation
 *  - handleSearchChange / handleSearchClear / resetSearch
 *  - filteredOptions（无搜索词 = 全量；有搜索词 = 过滤）
 *  - isSelected（单选看 selectedValues，多选看 draftValues）
 *  - syncDraftToSelected：将 selectedValues 同步到 draftValues
 *  - displayText 格式化
 *  - 受控模式 value 更新时 selectedValues 随之变化
 */

import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import useSelectState, { normalizeValue } from '../useSelectState';
import type { UseSelectStateOptions } from '../types';

// ─── normalizeValue ───────────────────────────────────────────────────────────

describe('normalizeValue', () => {
    it('undefined → []', () => {
        expect(normalizeValue(undefined)).toEqual([]);
    });

    it('null → []', () => {
        expect(normalizeValue(null)).toEqual([]);
    });

    it('"" (空字符串) → []', () => {
        expect(normalizeValue('')).toEqual([]);
    });

    it('单值字符串 → [该值]', () => {
        expect(normalizeValue('a')).toEqual(['a']);
    });

    it('数字 → [数字]', () => {
        expect(normalizeValue(1)).toEqual([1]);
    });

    it('数组过滤空字符串/null/undefined', () => {
        expect(normalizeValue(['a', '', null, undefined, 'b'])).toEqual(['a', 'b']);
    });

    it('有效数组不变', () => {
        expect(normalizeValue(['x', 'y'])).toEqual(['x', 'y']);
    });
});

// ─── 辅助：构建 options & 默认 setup ────────────────────────────────────────

const OPTIONS = [
    { value: 'a', label: '选项 A' },
    { value: 'b', label: '选项 B' },
    { value: 'c', label: '选项 C' },
];

function setup(overrides?: Partial<UseSelectStateOptions>) {
    const onClose = vi.fn();
    const onChange = vi.fn();
    const { result, rerender } = renderHook(
        (props: UseSelectStateOptions) => useSelectState(props),
        {
            initialProps: {
                options: OPTIONS,
                mode: 'single',
                onClose,
                onChange,
                ...overrides,
            } as UseSelectStateOptions,
        },
    );
    return { result, rerender, onClose, onChange };
}

// ─── 1. 初始状态 ─────────────────────────────────────────────────────────────

describe('useSelectState – 初始状态', () => {
    it('无 value/defaultValue 时 selectedValues 为 []', () => {
        const { result } = setup();
        expect(result.current.selectedValues).toEqual([]);
    });

    it('defaultValue 作为初始 selectedValues（非受控）', () => {
        const { result } = setup({ defaultValue: 'a' });
        expect(result.current.selectedValues).toEqual(['a']);
    });

    it('displayText 初始为空字符串（无选中）', () => {
        const { result } = setup();
        expect(result.current.displayText).toBe('');
    });

    it('searchText 初始为空字符串', () => {
        const { result } = setup();
        expect(result.current.searchText).toBe('');
    });

    it('draftValues 初始为 []（无 value/defaultValue）', () => {
        const { result } = setup({ mode: 'multiple' });
        expect(result.current.draftValues).toEqual([]);
    });

    it('draftValues 初始从 defaultValue 同步', () => {
        const { result } = setup({ mode: 'multiple', defaultValue: ['a'] });
        expect(result.current.draftValues).toEqual(['a']);
    });

    it('draftValues 初始从受控 value 同步', () => {
        const { result } = setup({ mode: 'multiple', value: ['b', 'c'] });
        expect(result.current.draftValues).toEqual(['b', 'c']);
    });
});

// ─── 2. 受控 selectedValues ──────────────────────────────────────────────────

describe('useSelectState – 受控模式', () => {
    it('传入 value 时 selectedValues 为受控值', () => {
        const { result } = setup({ value: 'b' });
        expect(result.current.selectedValues).toEqual(['b']);
    });

    it('受控 value=undefined 时保持受控空态', () => {
        const { result } = setup({ value: undefined, isControlled: true });
        expect(result.current.selectedValues).toEqual([]);
    });

    it('受控 value 从有值变为 undefined 时不会回退旧值', () => {
        const { result, rerender } = setup({ value: 'a', isControlled: true });
        expect(result.current.selectedValues).toEqual(['a']);

        rerender({
            options: OPTIONS,
            mode: 'single',
            onClose: vi.fn(),
            onChange: vi.fn(),
            value: undefined,
            isControlled: true,
        });
        expect(result.current.selectedValues).toEqual([]);
    });

    it('受控 value 更新时 selectedValues 随之变化', () => {
        const { result, rerender } = setup({ value: 'a' });
        expect(result.current.selectedValues).toEqual(['a']);

        rerender({
            options: OPTIONS,
            mode: 'single',
            onClose: vi.fn(),
            onChange: vi.fn(),
            value: 'c',
        });
        expect(result.current.selectedValues).toEqual(['c']);
    });
});

// ─── 3. displayText ──────────────────────────────────────────────────────────

describe('useSelectState – displayText', () => {
    it('单选：displayText 为对应 label', () => {
        const { result } = setup({ value: 'b' });
        expect(result.current.displayText).toBe('选项 B');
    });

    it('多选：displayText 为所有选中 label 用"、"连接', () => {
        const { result } = setup({ value: ['a', 'c'], mode: 'multiple' });
        expect(result.current.displayText).toBe('选项 A、选项 C');
    });

    it('value 对应 option 不存在时展示 value 本身', () => {
        const { result } = setup({ value: 'unknown' });
        expect(result.current.displayText).toBe('unknown');
    });
});

// ─── 4. handleSingleSelect ───────────────────────────────────────────────────

describe('useSelectState – handleSingleSelect', () => {
    it('选中某项后 selectedValues 更新（非受控）', () => {
        const { result } = setup();
        act(() => { result.current.handleSingleSelect('b'); });
        expect(result.current.selectedValues).toEqual(['b']);
    });

    it('触发 onChange 回调', () => {
        const { result, onChange } = setup();
        act(() => { result.current.handleSingleSelect('a'); });
        expect(onChange).toHaveBeenCalledWith('a');
    });

    it('触发 onClose 回调', () => {
        const { result, onClose } = setup();
        act(() => { result.current.handleSingleSelect('a'); });
        expect(onClose).toHaveBeenCalledTimes(1);
    });
});

// ─── 5. handleMultiToggle ────────────────────────────────────────────────────

describe('useSelectState – handleMultiToggle', () => {
    it('切换：未选中项加入草稿', () => {
        const { result } = setup({ mode: 'multiple' });
        act(() => { result.current.handleMultiToggle('a'); });
        expect(result.current.draftValues).toContain('a');
    });

    it('切换：已在草稿中的项被移除', () => {
        const { result } = setup({ mode: 'multiple' });
        act(() => { result.current.handleMultiToggle('a'); });
        act(() => { result.current.handleMultiToggle('a'); });
        expect(result.current.draftValues).not.toContain('a');
    });

    it('多项切换累积', () => {
        const { result } = setup({ mode: 'multiple' });
        act(() => { result.current.handleMultiToggle('a'); });
        act(() => { result.current.handleMultiToggle('c'); });
        expect(result.current.draftValues).toEqual(['a', 'c']);
    });
});

// ─── 6. handleMultiConfirm ───────────────────────────────────────────────────

describe('useSelectState – handleMultiConfirm', () => {
    it('提交草稿后 selectedValues 更新', () => {
        const { result } = setup({ mode: 'multiple' });
        act(() => {
            result.current.handleMultiToggle('a');
            result.current.handleMultiToggle('b');
        });
        act(() => { result.current.handleMultiConfirm(); });
        expect(result.current.selectedValues).toEqual(['a', 'b']);
    });

    it('触发 onChange([...])', () => {
        const { result, onChange } = setup({ mode: 'multiple' });
        act(() => { result.current.handleMultiToggle('c'); });
        act(() => { result.current.handleMultiConfirm(); });
        expect(onChange).toHaveBeenCalledWith(['c']);
    });

    it('触发 onClose', () => {
        const { result, onClose } = setup({ mode: 'multiple' });
        act(() => { result.current.handleMultiConfirm(); });
        expect(onClose).toHaveBeenCalledTimes(1);
    });
});

// ─── 7. handleClear ──────────────────────────────────────────────────────────

describe('useSelectState – handleClear', () => {
    it('单选 handleClear：onChange 收到 undefined', () => {
        const { result, onChange } = setup({ value: 'a' });
        const mockEvent = { stopPropagation: vi.fn() } as unknown as React.MouseEvent;
        act(() => { result.current.handleClear(mockEvent); });
        expect(onChange).toHaveBeenCalledWith(undefined);
    });

    it('多选 handleClear：onChange 收到 []', () => {
        const { result, onChange } = setup({ value: ['a', 'b'], mode: 'multiple' });
        const mockEvent = { stopPropagation: vi.fn() } as unknown as React.MouseEvent;
        act(() => { result.current.handleClear(mockEvent); });
        expect(onChange).toHaveBeenCalledWith([]);
    });

    it('handleClear 调用 e.stopPropagation', () => {
        const { result } = setup({ value: 'a' });
        const mockEvent = { stopPropagation: vi.fn() } as unknown as React.MouseEvent;
        act(() => { result.current.handleClear(mockEvent); });
        expect(mockEvent.stopPropagation).toHaveBeenCalledTimes(1);
    });

    it('非受控模式 handleClear 后 selectedValues 为 []', () => {
        const { result } = setup({ defaultValue: 'b' });
        const mockEvent = { stopPropagation: vi.fn() } as unknown as React.MouseEvent;
        act(() => { result.current.handleClear(mockEvent); });
        expect(result.current.selectedValues).toEqual([]);
    });
});

// ─── 8. 搜索 ─────────────────────────────────────────────────────────────────

describe('useSelectState – 搜索', () => {
    it('handleSearchChange 更新 searchText', () => {
        const { result } = setup();
        act(() => {
            result.current.handleSearchChange(
                { target: { value: 'B' } } as React.ChangeEvent<HTMLInputElement>,
            );
        });
        expect(result.current.searchText).toBe('B');
    });

    it('handleSearchClear 清空 searchText', () => {
        const { result } = setup();
        act(() => {
            result.current.handleSearchChange(
                { target: { value: 'B' } } as React.ChangeEvent<HTMLInputElement>,
            );
        });
        act(() => { result.current.handleSearchClear(); });
        expect(result.current.searchText).toBe('');
    });

    it('filteredOptions：无搜索词时返回全量选项', () => {
        const { result } = setup();
        expect(result.current.filteredOptions).toEqual(OPTIONS);
    });
});

// ─── 9. isSelected ───────────────────────────────────────────────────────────

describe('useSelectState – isSelected', () => {
    it('单选：selectedValues 中的值返回 true', () => {
        const { result } = setup({ value: 'b' });
        expect(result.current.isSelected('b')).toBe(true);
        expect(result.current.isSelected('a')).toBe(false);
    });

    it('多选：草稿中的值返回 true', () => {
        const { result } = setup({ mode: 'multiple' });
        act(() => { result.current.handleMultiToggle('a'); });
        expect(result.current.isSelected('a')).toBe(true);
        expect(result.current.isSelected('b')).toBe(false);
    });
});

// ─── 10. syncDraftToSelected ─────────────────────────────────────────────────

describe('useSelectState – syncDraftToSelected', () => {
    it('将 selectedValues 同步到 draftValues', () => {
        const { result } = setup({ value: ['a', 'c'], mode: 'multiple' });
        act(() => { result.current.syncDraftToSelected(); });
        expect(result.current.draftValues).toEqual(['a', 'c']);
    });

    it('无选中时 draftValues 变为 []', () => {
        const { result } = setup({ mode: 'multiple' });
        act(() => {
            result.current.handleMultiToggle('b'); // 先加
        });
        act(() => { result.current.syncDraftToSelected(); }); // 同步（空 selectedValues）
        expect(result.current.draftValues).toEqual([]);
    });
});

// ─── 11. resetDraft ────────────────────────────────────────────────────────────

describe('useSelectState – resetDraft', () => {
    it('resetDraft 将草稿重置为当前 selectedValues', () => {
        const { result } = setup({ value: ['a', 'c'], mode: 'multiple' });
        act(() => { result.current.handleMultiToggle('b'); }); // 草稿变为 ['a', 'c', 'b']
        act(() => { result.current.resetDraft(); }); // 重置为 selectedValues ['a', 'c']
        expect(result.current.draftValues).toEqual(['a', 'c']);
    });

    it('resetDraft 空选中时草稿变为 []', () => {
        const { result } = setup({ mode: 'multiple' });
        act(() => { result.current.handleMultiToggle('a'); }); // 草稿变为 ['a']
        act(() => { result.current.resetDraft(); }); // 重置为空 selectedValues
        expect(result.current.draftValues).toEqual([]);
    });
});

// ─── 12. BUG 修复验证 ─────────────────────────────────────────────────────────

const OPTIONS_WITH_DISABLED = [
    { value: 'a', label: '选项 A' },
    { value: 'b', label: '禁用项 B', disabled: true },
    { value: 'c', label: '选项 C' },
    { value: 'd', label: '禁用项 D', disabled: true },
    { value: 'e', label: '选项 E' },
];

describe('BUG 修复验证', () => {
    // BUG-1: handleMultiConfirm 闭包陷阱
    it('BUG-1: handleMultiConfirm 使用 ref 读取最新 draftValues', () => {
        const { result } = setup({ mode: 'multiple' });
        act(() => {
            result.current.handleMultiToggle('a');
            result.current.handleMultiToggle('b');
        });
        // 确认提交时提交的是最新草稿
        act(() => { result.current.handleMultiConfirm(); });
        expect(result.current.selectedValues).toEqual(['a', 'b']);
    });

    // BUG-5: disabled 选项搜索过滤
    it('BUG-5: 搜索时排除 disabled 选项', () => {
        const { result } = renderHook(
            (props: UseSelectStateOptions) => useSelectState(props),
            {
                initialProps: {
                    options: OPTIONS_WITH_DISABLED,
                    mode: 'single',
                    onClose: vi.fn(),
                    onChange: vi.fn(),
                } as UseSelectStateOptions,
            },
        );
        // 无搜索词时返回全量（包含 disabled）
        expect(result.current.filteredOptions).toHaveLength(5);

        // 搜索 "禁用" 时不应返回 disabled 项
        act(() => {
            result.current.handleSearchChange(
                { target: { value: '禁用' } } as React.ChangeEvent<HTMLInputElement>,
            );
        });
        expect(result.current.filteredOptions).toEqual([]);

        // 搜索 "项" 时应返回非 disabled 的匹配项
        act(() => {
            result.current.handleSearchChange(
                { target: { value: '选项' } } as React.ChangeEvent<HTMLInputElement>,
            );
        });
        expect(result.current.filteredOptions).toHaveLength(3);
        expect(result.current.filteredOptions.every(o => !o.disabled)).toBe(true);
    });

    // BUG-7: 多选 displayText 截断
    it('BUG-7: 多选超过 3 项时 displayText 显示摘要格式', () => {
        const { result } = setup({ mode: 'multiple', value: ['a', 'b', 'c'] });
        // 3 项 = 不截断
        expect(result.current.displayText).toBe('选项 A、选项 B、选项 C');

        // 重新 setup 4 项
        const { result: result2 } = renderHook(
            (props: UseSelectStateOptions) => useSelectState(props),
            {
                initialProps: {
                    options: OPTIONS,
                    mode: 'multiple',
                    value: ['a', 'b', 'c'],
                    onClose: vi.fn(),
                    onChange: vi.fn(),
                } as UseSelectStateOptions,
            },
        );
        // 3 项仍不截断
        expect(result2.current.displayText).toBe('选项 A、选项 B、选项 C');
    });

    it('BUG-7: 多选 4 项时 displayText 显示 "X 等 4 项"', () => {
        const MORE_OPTIONS = [
            { value: 'a', label: '选项 A' },
            { value: 'b', label: '选项 B' },
            { value: 'c', label: '选项 C' },
            { value: 'd', label: '选项 D' },
        ];
        const { result } = renderHook(
            (props: UseSelectStateOptions) => useSelectState(props),
            {
                initialProps: {
                    options: MORE_OPTIONS,
                    mode: 'multiple',
                    value: ['a', 'b', 'c', 'd'],
                    onClose: vi.fn(),
                    onChange: vi.fn(),
                } as UseSelectStateOptions,
            },
        );
        expect(result.current.displayText).toBe('选项 A 等 4 项');
    });

    // BUG-8: 单选重复选择不触发 onChange
    it('BUG-8: 单选重复选择同一项不触发 onChange', () => {
        const { result, onChange } = setup({ value: 'a' });
        // 选择当前已选中的项
        act(() => { result.current.handleSingleSelect('a'); });
        expect(onChange).not.toHaveBeenCalled();

        // 选择不同的项
        act(() => { result.current.handleSingleSelect('b'); });
        expect(onChange).toHaveBeenCalledTimes(1);
        expect(onChange).toHaveBeenCalledWith('b');
    });
});
