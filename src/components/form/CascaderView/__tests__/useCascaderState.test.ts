/**
 * useCascaderState Hook 单元测试
 *
 * 覆盖范围：
 *  - resolveLabels 纯函数
 *  - resolveAllLevels 纯函数
 *  - 初始状态：selectedValue、internalValue、displayText、currentLevel
 *  - defaultValue 初始化
 *  - 受控模式 value 同步
 *  - displayText 格式（label / 分隔符）
 *  - handleMobileSelect（有子节点 → 深入，无子节点 → 提交+关闭）
 *  - handleMobileBack（level > 0 → 退级，level = 0 → 关闭）
 *  - handlePcSelect（有子节点 → 更新 internalValue，无子节点 → 提交+关闭）
 *  - handleClear
 *  - resetLevel
 *  - allLevels（PC 端多列数据）
 *  - currentLevelOptions（移动端当前层选项）
 */

import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import {
    resolveLabels,
    resolveAllLevels,
    useCascaderState,
} from '../useCascaderState';
import type { CascadeOption, CascadeValue } from '../types';

// ─── 测试数据 ─────────────────────────────────────────────────────────────────

const OPTIONS: CascadeOption[] = [
    {
        value: '广东',
        label: '广东省',
        children: [
            {
                value: '广州',
                label: '广州市',
                children: [
                    { value: '天河', label: '天河区' },
                    { value: '越秀', label: '越秀区' },
                ],
            },
            {
                value: '深圳',
                label: '深圳市',
                children: [
                    { value: '南山', label: '南山区' },
                ],
            },
        ],
    },
    {
        value: '北京',
        label: '北京市',
        children: [
            { value: '朝阳', label: '朝阳区' },
        ],
    },
];

// ─── resolveLabels ────────────────────────────────────────────────────────────

describe('resolveLabels', () => {
    it('正常路径收集 labels', () => {
        expect(resolveLabels(OPTIONS, ['广东', '广州', '天河'])).toEqual([
            '广东省',
            '广州市',
            '天河区',
        ]);
    });

    it('路径中有不存在的 value 时提前终止', () => {
        expect(resolveLabels(OPTIONS, ['广东', 'xxx'])).toEqual(['广东省']);
    });

    it('空 values → []', () => {
        expect(resolveLabels(OPTIONS, [])).toEqual([]);
    });

    it('叶节点后不再深入', () => {
        const result = resolveLabels(OPTIONS, ['广东', '广州', '天河', 'extra']);
        expect(result).toEqual(['广东省', '广州市', '天河区']);
    });
});

// ─── resolveAllLevels ─────────────────────────────────────────────────────────

describe('resolveAllLevels', () => {
    it('空 values → [options]（只有根级）', () => {
        const levels = resolveAllLevels(OPTIONS, []);
        expect(levels).toHaveLength(1);
        expect(levels[0]).toBe(OPTIONS);
    });

    it('选中省份 → [根级, 省的城市列表]', () => {
        const levels = resolveAllLevels(OPTIONS, ['广东']);
        expect(levels).toHaveLength(2);
        expect(levels[1]).toHaveLength(2);
    });

    it('选中省份+城市 → [根级, 城市列表, 区列表]', () => {
        const levels = resolveAllLevels(OPTIONS, ['广东', '广州']);
        expect(levels).toHaveLength(3);
        expect(levels[2]).toHaveLength(2);
    });

    it('到叶节点后不再展开', () => {
        const levels = resolveAllLevels(OPTIONS, ['广东', '广州', '天河']);
        expect(levels).toHaveLength(3);
    });
});

// ─── 辅助 setup ──────────────────────────────────────────────────────────────

function setup(overrides?: Partial<Parameters<typeof useCascaderState>[0]>) {
    const onClose = vi.fn();
    const onChange = vi.fn();
    return renderHook(
        () =>
            useCascaderState({
                options: OPTIONS,
                isMobile: false,
                onClose,
                onChange,
                ...overrides,
            }),
    );
}

// ─── 1. 初始状态 ─────────────────────────────────────────────────────────────

describe('useCascaderState – 初始状态', () => {
    it('selectedValue 初始为 []', () => {
        const { result } = setup();
        expect(result.current.selectedValue).toEqual([]);
    });

    it('displayText 初始为空字符串', () => {
        const { result } = setup();
        expect(result.current.displayText).toBe('');
    });

    it('currentLevel 初始为 0', () => {
        const { result } = setup();
        expect(result.current.currentLevel).toBe(0);
    });

    it('defaultValue 初始化', () => {
        const { result } = setup({ defaultValue: ['广东', '广州'] });
        expect(result.current.selectedValue).toEqual(['广东', '广州']);
    });
});

// ─── 2. displayText ──────────────────────────────────────────────────────────

describe('useCascaderState – displayText', () => {
    it('完整路径的 displayText 用" / "分隔', () => {
        const { result } = setup({ defaultValue: ['广东', '广州', '天河'] });
        expect(result.current.displayText).toBe('广东省 / 广州市 / 天河区');
    });

    it('部分路径的 displayText', () => {
        const { result } = setup({ defaultValue: ['广东'] });
        expect(result.current.displayText).toBe('广东省');
    });

    it('受控 value 的 displayText', () => {
        const { result } = setup({ value: ['北京', '朝阳'] });
        expect(result.current.displayText).toBe('北京市 / 朝阳区');
    });
});

// ─── 3. 受控模式 ─────────────────────────────────────────────────────────────

describe('useCascaderState – 受控模式', () => {
    it('value 更新时 selectedValue 随之变化', () => {
        const onClose = vi.fn();
        const onChange = vi.fn();
        const { result, rerender } = renderHook(
            (props: { value: CascadeValue[] }) =>
                useCascaderState({
                    options: OPTIONS,
                    value: props.value,
                    isMobile: false,
                    onClose,
                    onChange,
                }),
            { initialProps: { value: ['北京', '朝阳'] as CascadeValue[] } },
        );
        expect(result.current.selectedValue).toEqual(['北京', '朝阳']);
        rerender({ value: ['广东', '广州', '天河'] as CascadeValue[] });
        expect(result.current.selectedValue).toEqual(['广东', '广州', '天河']);
    });
});

// ─── 4. handleMobileSelect ───────────────────────────────────────────────────

describe('useCascaderState – handleMobileSelect（移动端）', () => {
    it('选中有子节点的选项 → currentLevel +1，不提交', () => {
        const onClose = vi.fn();
        const onChange = vi.fn();
        const { result } = renderHook(() =>
            useCascaderState({ options: OPTIONS, isMobile: true, onClose, onChange }),
        );
        act(() => { result.current.handleMobileSelect('广东'); });
        expect(result.current.currentLevel).toBe(1);
        expect(onChange).not.toHaveBeenCalled();
        expect(onClose).not.toHaveBeenCalled();
    });

    it('选中叶节点 → 提交并关闭', () => {
        const onClose = vi.fn();
        const onChange = vi.fn();
        const { result } = renderHook(() =>
            useCascaderState({
                options: OPTIONS,
                isMobile: true,
                onClose,
                onChange,
            }),
        );
        act(() => { result.current.handleMobileSelect('广东'); });
        act(() => { result.current.handleMobileSelect('广州'); });
        act(() => { result.current.handleMobileSelect('天河'); });
        expect(onChange).toHaveBeenCalledWith(['广东', '广州', '天河']);
        expect(onClose).toHaveBeenCalled();
    });
});

// ─── 5. handleMobileBack ─────────────────────────────────────────────────────

describe('useCascaderState – handleMobileBack', () => {
    it('level > 0 时后退 → currentLevel -1', () => {
        const onClose = vi.fn();
        const { result } = renderHook(() =>
            useCascaderState({ options: OPTIONS, isMobile: true, onClose }),
        );
        act(() => { result.current.handleMobileSelect('广东'); });
        expect(result.current.currentLevel).toBe(1);
        act(() => { result.current.handleMobileBack(); });
        expect(result.current.currentLevel).toBe(0);
    });

    it('level = 0 时后退 → 调用 onClose', () => {
        const onClose = vi.fn();
        const { result } = renderHook(() =>
            useCascaderState({ options: OPTIONS, isMobile: true, onClose }),
        );
        act(() => { result.current.handleMobileBack(); });
        expect(onClose).toHaveBeenCalled();
    });
});

// ─── 6. handlePcSelect ───────────────────────────────────────────────────────

describe('useCascaderState – handlePcSelect（PC 端）', () => {
    it('选中有子节点的选项 → 展开下一级，不提交', () => {
        const onClose = vi.fn();
        const onChange = vi.fn();
        const { result } = renderHook(() =>
            useCascaderState({ options: OPTIONS, isMobile: false, onClose, onChange }),
        );
        act(() => { result.current.handlePcSelect('广东', 0); });
        expect(result.current.allLevels).toHaveLength(2);
        expect(onChange).not.toHaveBeenCalled();
    });

    it('选中叶节点 → 提交并关闭', () => {
        const onClose = vi.fn();
        const onChange = vi.fn();
        const { result } = renderHook(() =>
            useCascaderState({ options: OPTIONS, isMobile: false, onClose, onChange }),
        );
        act(() => { result.current.handlePcSelect('广东', 0); });
        act(() => { result.current.handlePcSelect('广州', 1); });
        act(() => { result.current.handlePcSelect('天河', 2); });
        expect(onChange).toHaveBeenCalledWith(['广东', '广州', '天河']);
        expect(onClose).toHaveBeenCalled();
    });

    it('在已选路径中改变某级 → 截断后续路径', () => {
        const onClose = vi.fn();
        const onChange = vi.fn();
        const { result } = renderHook(() =>
            useCascaderState({
                options: OPTIONS,
                defaultValue: ['广东', '广州'],
                isMobile: false,
                onClose,
                onChange,
            }),
        );
        act(() => { result.current.handlePcSelect('深圳', 1); });
        // 深圳有子节点，不提交；internalValue 应为 ['广东', '深圳']
        expect(result.current.allLevels).toHaveLength(3);
    });
});

// ─── 7. handleClear ──────────────────────────────────────────────────────────

describe('useCascaderState – handleClear', () => {
    it('非受控模式 handleClear → selectedValue = []', () => {
        const { result } = setup({ defaultValue: ['广东'] });
        const mockE = { stopPropagation: vi.fn() } as unknown as React.MouseEvent;
        act(() => { result.current.handleClear(mockE); });
        expect(result.current.selectedValue).toEqual([]);
    });

    it('调用 e.stopPropagation', () => {
        const { result } = setup();
        const mockE = { stopPropagation: vi.fn() } as unknown as React.MouseEvent;
        act(() => { result.current.handleClear(mockE); });
        expect(mockE.stopPropagation).toHaveBeenCalled();
    });

    it('触发 onChange([])', () => {
        const onClose = vi.fn();
        const onChange = vi.fn();
        const { result } = renderHook(() =>
            useCascaderState({ options: OPTIONS, isMobile: false, onClose, onChange }),
        );
        const mockE = { stopPropagation: vi.fn() } as unknown as React.MouseEvent;
        act(() => { result.current.handleClear(mockE); });
        expect(onChange).toHaveBeenCalledWith([]);
    });
});

// ─── 8. resetLevel ───────────────────────────────────────────────────────────

describe('useCascaderState – resetLevel', () => {
    it('深入后 resetLevel → currentLevel = 0', () => {
        const onClose = vi.fn();
        const { result } = renderHook(() =>
            useCascaderState({ options: OPTIONS, isMobile: true, onClose }),
        );
        act(() => { result.current.handleMobileSelect('广东'); });
        expect(result.current.currentLevel).toBe(1);
        act(() => { result.current.resetLevel(); });
        expect(result.current.currentLevel).toBe(0);
    });
});

// ─── 9. currentLevelOptions ──────────────────────────────────────────────────

describe('useCascaderState – currentLevelOptions', () => {
    it('level=0 时返回根级选项', () => {
        const { result } = setup({ isMobile: true });
        expect(result.current.currentLevelOptions).toHaveLength(2);
    });

    it('选中广东后 level=1 时返回广东子选项', () => {
        const onClose = vi.fn();
        const { result } = renderHook(() =>
            useCascaderState({ options: OPTIONS, isMobile: true, onClose }),
        );
        act(() => { result.current.handleMobileSelect('广东'); });
        expect(result.current.currentLevelOptions).toHaveLength(2);
        expect(result.current.currentLevelOptions[0]!.label).toBe('广州市');
    });
});

// ─── 10. allLevels（PC） ─────────────────────────────────────────────────────

describe('useCascaderState – allLevels', () => {
    it('isMobile=true 时 allLevels 为 []', () => {
        const { result } = setup({ isMobile: true });
        expect(result.current.allLevels).toEqual([]);
    });

    it('isMobile=false 初始时 allLevels 只有根级', () => {
        const { result } = setup({ isMobile: false });
        expect(result.current.allLevels).toHaveLength(1);
    });

    it('选中广东后 allLevels 展开第2级', () => {
        const onClose = vi.fn();
        const { result } = renderHook(() =>
            useCascaderState({ options: OPTIONS, isMobile: false, onClose }),
        );
        act(() => { result.current.handlePcSelect('广东', 0); });
        expect(result.current.allLevels).toHaveLength(2);
    });
});
