/**
 * InertiaSpinner 组件单元测试
 *
 * 覆盖范围：
 *  ─ 基本渲染
 *    1.  渲染 span 元素且 role="status"
 *    2.  默认 spinning=false 时 aria-label 为"已就绪"
 *    3.  spinning=true 时 aria-label 为"加载中"
 *    4.  自定义 spinningLabel / idleLabel
 *  ─ 无障碍（Bug1 回归）
 *    5.  spinning=true 时 aria-live="polite"
 *    6.  spinning=false 时 aria-live="off"
 *  ─ 尺寸与变体
 *    7.  size prop 对应 CSS class
 *    8.  variant prop 对应 CSS class
 *    9.  默认 size="md" variant="rainbow"
 *  ─ 旋转动画
 *    10. spinning=true 后启动 requestAnimationFrame
 *    11. spinning=false 后最终停止 requestAnimationFrame
 *    12. spinning=true 时应用 spinnerActive class
 *    13. spinning=false 时移除 spinnerActive class
 *  ─ boostSignal
 *    14. boostSignal 变化时在 spinning 状态下触发动画帧
 *    15. boostSignal 首次挂载不触发加速（跳过首次）
 *    16. boostSignal 在 spinning=false 且 velocity=0 时不加速
 *  ─ customIcon
 *    17. 传入 icon 时渲染自定义图标
 *    18. 自定义图标有 aria-hidden="true"
 *    19. 有 customIcon 时添加 spinnerCustom class
 *  ─ className 透传
 *    20. className 附加到根 span
 *  ─ 卸载清理
 *    21. 卸载时取消 requestAnimationFrame
 *  ─ React.memo
 *    22. InertiaSpinner 是 React.memo 包裹的组件
 */

import React, { act } from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { InertiaSpinner } from '../InertiaSpinner';

// ─────────────────────────────────────────────────────────────────────────────
// 辅助函数
// ─────────────────────────────────────────────────────────────────────────────
function renderSpinner(overrides: Partial<React.ComponentProps<typeof InertiaSpinner>> = {}) {
    const defaults: React.ComponentProps<typeof InertiaSpinner> = { spinning: false };
    return render(<InertiaSpinner {...defaults} {...overrides} />);
}

// ─── 1. 基本渲染 ──────────────────────────────────────────────────────────────
describe('InertiaSpinner – 基本渲染', () => {
    afterEach(cleanup);

    it('渲染 span 元素且 role="status"', () => {
        renderSpinner();
        expect(screen.getByRole('status')).toBeInTheDocument();
    });

    it('默认 spinning=false 时 aria-label 为"已就绪"', () => {
        renderSpinner({ spinning: false });
        expect(screen.getByRole('status')).toHaveAttribute('aria-label', '已就绪');
    });

    it('spinning=true 时 aria-label 为"加载中"', () => {
        renderSpinner({ spinning: true });
        expect(screen.getByRole('status')).toHaveAttribute('aria-label', '加载中');
    });

    it('自定义 spinningLabel / idleLabel', () => {
        const { rerender } = renderSpinner({
            spinning: true,
            spinningLabel: '刷新中',
            idleLabel: '已完成',
        });
        expect(screen.getByRole('status')).toHaveAttribute('aria-label', '刷新中');

        rerender(<InertiaSpinner spinning={false} spinningLabel="刷新中" idleLabel="已完成" />);
        expect(screen.getByRole('status')).toHaveAttribute('aria-label', '已完成');
    });
});

// ─── 2. 无障碍（Bug1 回归）──────────────────────────────────────────────────
describe('InertiaSpinner – aria-live（Bug1 回归）', () => {
    afterEach(cleanup);

    it('spinning=true 时 aria-live="polite"', () => {
        renderSpinner({ spinning: true });
        expect(screen.getByRole('status')).toHaveAttribute('aria-live', 'polite');
    });

    it('spinning=false 时 aria-live="off"', () => {
        renderSpinner({ spinning: false });
        expect(screen.getByRole('status')).toHaveAttribute('aria-live', 'off');
    });

    it('spinning 从 false→true 时 aria-live 从 off→polite', () => {
        const { rerender } = renderSpinner({ spinning: false });
        expect(screen.getByRole('status')).toHaveAttribute('aria-live', 'off');

        rerender(<InertiaSpinner spinning />);
        expect(screen.getByRole('status')).toHaveAttribute('aria-live', 'polite');
    });

    it('spinning 从 true→false 时 aria-live 从 polite→off', () => {
        const { rerender } = renderSpinner({ spinning: true });
        expect(screen.getByRole('status')).toHaveAttribute('aria-live', 'polite');

        rerender(<InertiaSpinner spinning={false} />);
        expect(screen.getByRole('status')).toHaveAttribute('aria-live', 'off');
    });
});

// ─── 3. 尺寸与变体 ───────────────────────────────────────────────────────────
describe('InertiaSpinner – 尺寸与变体', () => {
    afterEach(cleanup);

    it('默认 size="md" variant="rainbow"', () => {
        renderSpinner();
        const el = screen.getByRole('status');
        expect(el.className).toMatch(/size_md/);
        expect(el.className).toMatch(/variant_rainbow/);
    });

    it('size="sm" 添加 size_sm class', () => {
        renderSpinner({ size: 'sm' });
        expect(screen.getByRole('status').className).toMatch(/size_sm/);
    });

    it('size="lg" 添加 size_lg class', () => {
        renderSpinner({ size: 'lg' });
        expect(screen.getByRole('status').className).toMatch(/size_lg/);
    });

    it('variant="brand" 添加 variant_brand class', () => {
        renderSpinner({ variant: 'brand' });
        expect(screen.getByRole('status').className).toMatch(/variant_brand/);
    });

    it('variant="neutral" 添加 variant_neutral class', () => {
        renderSpinner({ variant: 'neutral' });
        expect(screen.getByRole('status').className).toMatch(/variant_neutral/);
    });
});

// ─── 4. 旋转动画 ─────────────────────────────────────────────────────────────
describe('InertiaSpinner – 旋转动画', () => {
    beforeEach(() => vi.useFakeTimers());
    afterEach(() => {
        cleanup();
        vi.useRealTimers();
    });

    it('spinning=true 后启动 requestAnimationFrame', () => {
        const rafSpy = vi.spyOn(window, 'requestAnimationFrame');
        renderSpinner({ spinning: true });
        expect(rafSpy).toHaveBeenCalled();
        rafSpy.mockRestore();
    });

    it('spinning=true 时应用 spinnerActive class', () => {
        renderSpinner({ spinning: true });
        expect(screen.getByRole('status').className).toMatch(/spinnerActive/);
    });

    it('spinning=false 时无 spinnerActive class', () => {
        renderSpinner({ spinning: false });
        expect(screen.getByRole('status').className).not.toMatch(/spinnerActive/);
    });

    it('spinning 从 true→false 后 spinnerActive class 移除', () => {
        const { rerender } = renderSpinner({ spinning: true });
        expect(screen.getByRole('status').className).toMatch(/spinnerActive/);

        rerender(<InertiaSpinner spinning={false} />);
        expect(screen.getByRole('status').className).not.toMatch(/spinnerActive/);
    });

    it('spinning=true 时 transform 被持续更新（旋转中）', () => {
        renderSpinner({ spinning: true });
        // 推进几帧，让 rAF 回调执行
        act(() => { vi.advanceTimersByTime(64); });
        const el = screen.getByRole('status');
        // CSS Module 会做 hash，检查内联 style 即可
        expect(el.style.transform).toMatch(/rotate/);
    });
});

// ─── 5. boostSignal ──────────────────────────────────────────────────────────
describe('InertiaSpinner – boostSignal', () => {
    beforeEach(() => vi.useFakeTimers());
    afterEach(() => {
        cleanup();
        vi.useRealTimers();
    });

    it('boostSignal 首次挂载不触发加速（跳过首次）', () => {
        const rafSpy = vi.spyOn(window, 'requestAnimationFrame');
        renderSpinner({ spinning: false, boostSignal: 1 });
        // 非旋转态下首次 boostSignal 不应启动动画帧
        expect(rafSpy).not.toHaveBeenCalled();
        rafSpy.mockRestore();
    });

    it('spinning=false 且 velocity=0 时 boostSignal 不加速', () => {
        const rafSpy = vi.spyOn(window, 'requestAnimationFrame');
        const { rerender } = renderSpinner({ spinning: false, boostSignal: 0 });
        // 更新 boostSignal，但 spinning=false 且无惯性
        rerender(<InertiaSpinner spinning={false} boostSignal={1} />);
        expect(rafSpy).not.toHaveBeenCalled();
        rafSpy.mockRestore();
    });

    it('spinning=true 时 boostSignal 变化仍保持旋转', () => {
        const { rerender } = renderSpinner({ spinning: true, boostSignal: 0 });
        act(() => { vi.advanceTimersByTime(32); });
        // boostSignal 变化
        rerender(<InertiaSpinner spinning boostSignal={1} />);
        const el = screen.getByRole('status');
        expect(el.style.transform).toMatch(/rotate/);
    });
});

// ─── 6. customIcon ──────────────────────────────────────────────────────────
describe('InertiaSpinner – customIcon', () => {
    afterEach(cleanup);

    it('传入 icon 时渲染自定义图标', () => {
        renderSpinner({ icon: <svg data-testid="custom-svg" /> });
        expect(screen.getByTestId('custom-svg')).toBeInTheDocument();
    });

    it('自定义图标容器有 aria-hidden="true"', () => {
        renderSpinner({ icon: <svg data-testid="custom-svg" /> });
        const iconContainer = screen.getByTestId('custom-svg').parentElement;
        expect(iconContainer).toHaveAttribute('aria-hidden', 'true');
    });

    it('有 customIcon 时添加 spinnerCustom class', () => {
        renderSpinner({ icon: <svg data-testid="custom-svg" /> });
        expect(screen.getByRole('status').className).toMatch(/spinnerCustom/);
    });

    it('无 icon 时不渲染 customIcon 容器', () => {
        const { container } = renderSpinner();
        // 没有 customIcon class 的子 span
        const customIconSpan = container.querySelector('[aria-hidden="true"]');
        expect(customIconSpan).toBeNull();
    });
});

// ─── 7. className 透传 ──────────────────────────────────────────────────────
describe('InertiaSpinner – className 透传', () => {
    afterEach(cleanup);

    it('className 附加到根 span', () => {
        renderSpinner({ className: 'my-spinner' });
        expect(screen.getByRole('status').className).toContain('my-spinner');
    });
});

// ─── 8. 卸载清理 ────────────────────────────────────────────────────────────
describe('InertiaSpinner – 卸载清理', () => {
    beforeEach(() => vi.useFakeTimers());
    afterEach(() => {
        vi.useRealTimers();
    });

    it('卸载时取消 requestAnimationFrame（不抛错）', () => {
        const cancelSpy = vi.spyOn(window, 'cancelAnimationFrame');
        const { unmount } = renderSpinner({ spinning: true });
        act(() => { vi.advanceTimersByTime(32); });
        expect(() => unmount()).not.toThrow();
        expect(cancelSpy).toHaveBeenCalled();
        cancelSpy.mockRestore();
    });
});

// ─── 9. React.memo ──────────────────────────────────────────────────────────
describe('InertiaSpinner – React.memo', () => {
    it('InertiaSpinner 是 React.memo 包裹的组件', () => {
        expect((InertiaSpinner as unknown as { $$typeof?: symbol }).$$typeof?.toString()).toContain('memo');
    });
});
