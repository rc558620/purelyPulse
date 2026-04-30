/**
 * useDeviceType Hook 单元测试
 *
 * 覆盖范围：
 *  - displayMode='pc'     → 始终返回 false
 *  - displayMode='mobile' → 始终返回 true
 *  - displayMode=undefined → 由 useIsMobile 决定（窗口宽度）
 *  - 自动模式下窗口宽度 < 768 → true
 *  - 自动模式下窗口宽度 >= 768 → false
 *  - 强制 pc 时不受窗口宽度影响
 *  - 强制 mobile 时不受窗口宽度影响
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import useDeviceType from '../useDeviceType';

// ─── 辅助：设置 window.innerWidth ────────────────────────────────────────────

function setWindowWidth(width: number) {
    Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: width,
    });
}

// ─── 1. 强制 displayMode ─────────────────────────────────────────────────────

describe('useDeviceType – 强制 displayMode', () => {
    it('displayMode="pc" 始终返回 false（无论窗口宽度）', () => {
        setWindowWidth(320); // 移动端宽度
        const { result } = renderHook(() => useDeviceType('pc'));
        expect(result.current).toBe(false);
    });

    it('displayMode="mobile" 始终返回 true（无论窗口宽度）', () => {
        setWindowWidth(1440); // PC 宽度
        const { result } = renderHook(() => useDeviceType('mobile'));
        expect(result.current).toBe(true);
    });

    it('displayMode="pc" 不受 resize 影响', () => {
        setWindowWidth(1200);
        const { result } = renderHook(() => useDeviceType('pc'));
        expect(result.current).toBe(false);
        // 模拟切到移动端
        setWindowWidth(375);
        // 强制 pc，不应变化
        expect(result.current).toBe(false);
    });
});

// ─── 2. 自动模式 ─────────────────────────────────────────────────────────────

describe('useDeviceType – 自动模式（displayMode=undefined）', () => {
    it('窗口宽度 < 768 时返回 true（移动端）', () => {
        setWindowWidth(767);
        const { result } = renderHook(() => useDeviceType(undefined));
        expect(result.current).toBe(true);
    });

    it('窗口宽度 = 768 时返回 false（PC）', () => {
        setWindowWidth(768);
        const { result } = renderHook(() => useDeviceType(undefined));
        expect(result.current).toBe(false);
    });

    it('窗口宽度 > 768 时返回 false（PC）', () => {
        setWindowWidth(1200);
        const { result } = renderHook(() => useDeviceType(undefined));
        expect(result.current).toBe(false);
    });
});
