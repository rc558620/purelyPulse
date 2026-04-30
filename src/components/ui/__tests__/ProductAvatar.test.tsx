/**
 * ProductAvatar 组件单元测试
 *
 * 覆盖范围：
 *  ─ 基本渲染
 *    1.  渲染外层 wrapper div
 *    2.  有 image 时渲染 img 元素
 *    3.  无 image 时渲染占位 div（含 placeholder class）
 *    4.  无 image 时渲染 IconProductBag（svg 元素）
 *  ─ 图片模式
 *    5.  img.src 与传入 image 一致
 *    6.  img.alt 使用 name 作为 alt 文本
 *    7.  name 为空字符串时 alt 为空字符串（safeStr 处理）
 *  ─ alertLevel 分支
 *    8.  alertLevel="normal"（默认）占位 div 无 warning/danger class
 *    9.  alertLevel="warning" 占位 div 含 placeholderWarning class
 *    10. alertLevel="danger" 占位 div 含 placeholderDanger class
 *    11. alertLevel="normal" 时不渲染角标
 *    12. alertLevel="warning" 时渲染角标（含 badgeWarning class）
 *    13. alertLevel="danger" 时渲染角标（含 badgeDanger class）
 *  ─ 图片 + alertLevel
 *    14. 有 image 且 alertLevel="danger" 时仍渲染角标
 *    15. 有 image 且 alertLevel="normal" 时不渲染角标
 *  ─ size / iconSize
 *    16. size 默认 "4.8rem"，wrapper style width/height 为 4.8rem
 *    17. 自定义 size="6rem" 时 wrapper width/height 为 6rem
 *    18. 无 image 时 IconProductBag width/height 为默认 "20"
 *    19. 自定义 iconSize="32" 时 SVG width/height 为 32
 *  ─ className 透传
 *    20. className 附加到 wrapper
 *  ─ React.memo
 *    21. ProductAvatar 是 React.memo 包裹的组件
 */

import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import ProductAvatar from '../data-display/ProductAvatar/ProductAvatar';

// ─────────────────────────────────────────────────────────────────────────────
// 辅助函数
// ─────────────────────────────────────────────────────────────────────────────
function renderAvatar(overrides: Partial<React.ComponentProps<typeof ProductAvatar>> = {}) {
    const defaults = { name: '可口可乐' };
    return render(<ProductAvatar {...defaults} {...overrides} />);
}

// ─── 1. 基本渲染 ──────────────────────────────────────────────────────────────
describe('ProductAvatar – 基本渲染', () => {
    it('渲染外层 wrapper div', () => {
        const { container } = renderAvatar();
        expect(container.querySelector('div')).toBeInTheDocument();
    });

    it('有 image 时渲染 img 元素', () => {
        renderAvatar({ image: 'https://example.com/img.png' });
        expect(screen.getByRole('img')).toBeInTheDocument();
    });

    it('无 image 时不渲染 img 元素', () => {
        const { container } = renderAvatar({ image: undefined });
        expect(container.querySelector('img')).toBeNull();
    });

    it('无 image 时渲染占位 div（含 placeholder class）', () => {
        const { container } = renderAvatar({ image: undefined });
        expect(container.querySelector('[class*="placeholder"]')).toBeInTheDocument();
    });

    it('无 image 时渲染 svg 图标（IconProductBag）', () => {
        const { container } = renderAvatar({ image: undefined });
        expect(container.querySelector('svg')).toBeInTheDocument();
    });
});

// ─── 2. 图片模式 ──────────────────────────────────────────────────────────────
describe('ProductAvatar – 图片模式', () => {
    it('img.src 与传入 image 一致', () => {
        renderAvatar({ image: 'https://example.com/img.png' });
        expect(screen.getByRole('img')).toHaveAttribute('src', 'https://example.com/img.png');
    });

    it('img.alt 使用 name 作为 alt', () => {
        renderAvatar({ image: 'https://example.com/img.png', name: '可口可乐' });
        expect(screen.getByRole('img')).toHaveAttribute('alt', '可口可乐');
    });

    it('name 为空字符串时 alt 为空字符串（空 alt 图片为 presentation 角色）', () => {
        const { container } = renderAvatar({ image: 'https://example.com/img.png', name: '' });
        const img = container.querySelector('img');
        expect(img).toBeInTheDocument();
        expect(img).toHaveAttribute('alt', '');
    });
});

// ─── 3. alertLevel 分支 ──────────────────────────────────────────────────────
describe('ProductAvatar – alertLevel 样式与角标', () => {
    it('alertLevel="normal"（默认）占位 div 无 warning/danger class', () => {
        const { container } = renderAvatar({ alertLevel: 'normal' });
        const placeholder = container.querySelector('[class*="placeholder"]');
        expect(placeholder).toBeInTheDocument();
        expect(placeholder!.className).not.toMatch(/Warning/);
        expect(placeholder!.className).not.toMatch(/Danger/);
    });

    it('alertLevel="warning" 占位 div 含 placeholderWarning class', () => {
        const { container } = renderAvatar({ alertLevel: 'warning' });
        const placeholder = container.querySelector('[class*="placeholder"]');
        expect(placeholder!.className).toMatch(/placeholderWarning/);
    });

    it('alertLevel="danger" 占位 div 含 placeholderDanger class', () => {
        const { container } = renderAvatar({ alertLevel: 'danger' });
        const placeholder = container.querySelector('[class*="placeholder"]');
        expect(placeholder!.className).toMatch(/placeholderDanger/);
    });

    it('alertLevel="normal" 时不渲染角标', () => {
        const { container } = renderAvatar({ alertLevel: 'normal' });
        expect(container.querySelector('[class*="badge"]')).toBeNull();
    });

    it('alertLevel="warning" 时渲染角标（含 badgeWarning class）', () => {
        const { container } = renderAvatar({ alertLevel: 'warning' });
        const badge = container.querySelector('[class*="badge"]');
        expect(badge).toBeInTheDocument();
        expect(badge!.className).toMatch(/badgeWarning/);
    });

    it('alertLevel="danger" 时渲染角标（含 badgeDanger class）', () => {
        const { container } = renderAvatar({ alertLevel: 'danger' });
        const badge = container.querySelector('[class*="badge"]');
        expect(badge).toBeInTheDocument();
        expect(badge!.className).toMatch(/badgeDanger/);
    });
});

// ─── 4. 图片 + alertLevel ────────────────────────────────────────────────────
describe('ProductAvatar – 图片模式 + alertLevel', () => {
    it('有 image 且 alertLevel="danger" 时仍渲染角标', () => {
        const { container } = renderAvatar({
            image: 'https://example.com/img.png',
            alertLevel: 'danger',
        });
        expect(container.querySelector('[class*="badge"]')).toBeInTheDocument();
    });

    it('有 image 且 alertLevel="normal" 时不渲染角标', () => {
        const { container } = renderAvatar({
            image: 'https://example.com/img.png',
            alertLevel: 'normal',
        });
        expect(container.querySelector('[class*="badge"]')).toBeNull();
    });
});

// ─── 5. size / iconSize ────────────────────────────────────────────────────────
describe('ProductAvatar – size / iconSize', () => {
    it('size 默认 "4.8rem"，wrapper width/height 为 4.8rem', () => {
        const { container } = renderAvatar();
        const wrapper = container.firstChild as HTMLElement;
        expect(wrapper.style.width).toBe('4.8rem');
        expect(wrapper.style.height).toBe('4.8rem');
    });

    it('自定义 size="6rem" 时 wrapper width/height 为 6rem', () => {
        const { container } = renderAvatar({ size: '6rem' });
        const wrapper = container.firstChild as HTMLElement;
        expect(wrapper.style.width).toBe('6rem');
        expect(wrapper.style.height).toBe('6rem');
    });

    it('无 image 时 svg width/height 为默认 "20"', () => {
        const { container } = renderAvatar({ image: undefined });
        const svg = container.querySelector('svg');
        expect(svg).toBeInTheDocument();
        expect(svg!.getAttribute('width')).toBe('20');
        expect(svg!.getAttribute('height')).toBe('20');
    });

    it('自定义 iconSize="32" 时 svg width/height 为 32', () => {
        const { container } = renderAvatar({ image: undefined, iconSize: '32' });
        const svg = container.querySelector('svg');
        expect(svg!.getAttribute('width')).toBe('32');
        expect(svg!.getAttribute('height')).toBe('32');
    });
});

// ─── 6. className 透传 ────────────────────────────────────────────────────────
describe('ProductAvatar – className 透传', () => {
    it('className 附加到 wrapper', () => {
        const { container } = renderAvatar({ className: 'my-avatar' });
        expect((container.firstChild as HTMLElement).className).toContain('my-avatar');
    });
});

// ─── 7. React.memo ────────────────────────────────────────────────────────────
describe('ProductAvatar – React.memo', () => {
    it('ProductAvatar 是 React.memo 包裹的组件', () => {
        expect((ProductAvatar as unknown as { $$typeof?: symbol }).$$typeof?.toString()).toContain('memo');
    });
});
