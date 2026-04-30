/**
 * AvatarUploaderIcons 单元测试
 *
 * 覆盖范围：
 *  ─ IconAvatarPlaceholder
 *    1.  正常渲染 svg 元素
 *    2.  默认 width=52、height=52
 *    3.  viewBox="0 0 24 24"
 *    4.  fill="none"
 *    5.  aria-hidden="true"（屏幕阅读器隐藏）
 *    6.  自定义 className 透传到 svg
 *    7.  自定义 width/height 透传覆盖默认值
 *    8.  包含至少 3 条 path 子元素（眼睛 + 头部 + 鼻子）
 *
 *  ─ IconAvatarEdit
 *    9.  正常渲染 svg 元素
 *    10. 默认 width=22、height=22
 *    11. viewBox="0 0 24 24"
 *    12. stroke="currentColor"
 *    13. aria-hidden="true"
 *    14. 自定义 className 透传到 svg
 *    15. 自定义 width/height 透传覆盖默认值
 *    16. 包含 path 和 circle 子元素（相机图标）
 */

import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { IconAvatarPlaceholder, IconAvatarEdit } from '../AvatarUploader/AvatarUploaderIcons';

// ─────────────────────────────────────────────────────────────────────────────
// IconAvatarPlaceholder
// ─────────────────────────────────────────────────────────────────────────────
describe('IconAvatarPlaceholder – 基本渲染', () => {
    it('正常渲染 svg 元素', () => {
        const { container } = render(<IconAvatarPlaceholder />);
        expect(container.querySelector('svg')).toBeInTheDocument();
    });

    it('默认 width 为 52', () => {
        const { container } = render(<IconAvatarPlaceholder />);
        expect(container.querySelector('svg')).toHaveAttribute('width', '52');
    });

    it('默认 height 为 52', () => {
        const { container } = render(<IconAvatarPlaceholder />);
        expect(container.querySelector('svg')).toHaveAttribute('height', '52');
    });

    it('viewBox 为 "0 0 24 24"', () => {
        const { container } = render(<IconAvatarPlaceholder />);
        expect(container.querySelector('svg')).toHaveAttribute('viewBox', '0 0 24 24');
    });

    it('fill 为 "none"', () => {
        const { container } = render(<IconAvatarPlaceholder />);
        expect(container.querySelector('svg')).toHaveAttribute('fill', 'none');
    });

    it('具有 aria-hidden="true"（对屏幕阅读器隐藏）', () => {
        const { container } = render(<IconAvatarPlaceholder />);
        expect(container.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
    });

    it('自定义 className 透传到 svg', () => {
        const { container } = render(<IconAvatarPlaceholder className="test-placeholder" />);
        expect(container.querySelector('svg')).toHaveClass('test-placeholder');
    });

    it('自定义 width/height 透传覆盖默认值', () => {
        const { container } = render(<IconAvatarPlaceholder width={36} height={36} />);
        const svg = container.querySelector('svg');
        expect(svg).toHaveAttribute('width', '36');
        expect(svg).toHaveAttribute('height', '36');
    });

    it('svg 内包含至少 3 条 path 子元素（头部轮廓 + 左眼 + 右眼 + 鼻子）', () => {
        const { container } = render(<IconAvatarPlaceholder />);
        const paths = container.querySelectorAll('svg path');
        expect(paths.length).toBeGreaterThanOrEqual(3);
    });
});

describe('IconAvatarPlaceholder – SVG 路径内容', () => {
    it('第一条 path 具有头部轮廓描述（包含 stroke 和 fill）', () => {
        const { container } = render(<IconAvatarPlaceholder />);
        const paths = container.querySelectorAll('svg path');
        // 第一条路径是头部
        const headPath = paths[0];
        expect(headPath).toHaveAttribute('stroke', 'currentColor');
        expect(headPath.getAttribute('fill')).not.toBeNull();
    });

    it('眼睛路径具有圆角笔触（stroke-linecap=round）', () => {
        const { container } = render(<IconAvatarPlaceholder />);
        const paths = container.querySelectorAll('svg path');
        // React 渲染 SVG 时将 strokeLinecap → stroke-linecap（kebab-case DOM 属性）
        // 至少有 2 条眼睛路径含 round
        const roundPaths = Array.from(paths).filter(
            (p) =>
                p.getAttribute('stroke-linecap') === 'round' ||
                p.getAttribute('strokeLinecap') === 'round',
        );
        expect(roundPaths.length).toBeGreaterThanOrEqual(2);
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// IconAvatarEdit
// ─────────────────────────────────────────────────────────────────────────────
describe('IconAvatarEdit – 基本渲染', () => {
    it('正常渲染 svg 元素', () => {
        const { container } = render(<IconAvatarEdit />);
        expect(container.querySelector('svg')).toBeInTheDocument();
    });

    it('默认 width 为 22', () => {
        const { container } = render(<IconAvatarEdit />);
        expect(container.querySelector('svg')).toHaveAttribute('width', '22');
    });

    it('默认 height 为 22', () => {
        const { container } = render(<IconAvatarEdit />);
        expect(container.querySelector('svg')).toHaveAttribute('height', '22');
    });

    it('viewBox 为 "0 0 24 24"', () => {
        const { container } = render(<IconAvatarEdit />);
        expect(container.querySelector('svg')).toHaveAttribute('viewBox', '0 0 24 24');
    });

    it('stroke 为 "currentColor"', () => {
        const { container } = render(<IconAvatarEdit />);
        expect(container.querySelector('svg')).toHaveAttribute('stroke', 'currentColor');
    });

    it('具有 aria-hidden="true"', () => {
        const { container } = render(<IconAvatarEdit />);
        expect(container.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
    });

    it('自定义 className 透传到 svg', () => {
        const { container } = render(<IconAvatarEdit className="edit-icon" />);
        expect(container.querySelector('svg')).toHaveClass('edit-icon');
    });

    it('自定义 width/height 透传覆盖默认值', () => {
        const { container } = render(<IconAvatarEdit width={18} height={18} />);
        const svg = container.querySelector('svg');
        expect(svg).toHaveAttribute('width', '18');
        expect(svg).toHaveAttribute('height', '18');
    });
});

describe('IconAvatarEdit – SVG 内容（相机图标结构）', () => {
    it('包含一条 path 元素（相机外框）', () => {
        const { container } = render(<IconAvatarEdit />);
        const paths = container.querySelectorAll('svg path');
        expect(paths.length).toBeGreaterThanOrEqual(1);
    });

    it('包含 circle 元素（相机镜头）', () => {
        const { container } = render(<IconAvatarEdit />);
        const circles = container.querySelectorAll('svg circle');
        expect(circles.length).toBeGreaterThanOrEqual(1);
    });

    it('circle 的 cx=12, cy=13, r=4', () => {
        const { container } = render(<IconAvatarEdit />);
        const circle = container.querySelector('svg circle');
        expect(circle).toHaveAttribute('cx', '12');
        expect(circle).toHaveAttribute('cy', '13');
        expect(circle).toHaveAttribute('r', '4');
    });

    it('stroke-width 为 "2"（React 渲染 SVG 使用 kebab-case DOM 属性）', () => {
        const { container } = render(<IconAvatarEdit />);
        const svg = container.querySelector('svg')!;
        // React 在 SVG 中渲染 strokeWidth → stroke-width
        const val = svg.getAttribute('stroke-width') ?? svg.getAttribute('strokeWidth');
        expect(val).toBe('2');
    });

    it('stroke-linecap 为 "round"', () => {
        const { container } = render(<IconAvatarEdit />);
        const svg = container.querySelector('svg')!;
        const val = svg.getAttribute('stroke-linecap') ?? svg.getAttribute('strokeLinecap');
        expect(val).toBe('round');
    });

    it('stroke-linejoin 为 "round"', () => {
        const { container } = render(<IconAvatarEdit />);
        const svg = container.querySelector('svg')!;
        const val = svg.getAttribute('stroke-linejoin') ?? svg.getAttribute('strokeLinejoin');
        expect(val).toBe('round');
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// 通用 SVGProps 透传：data-* 与 style
// ─────────────────────────────────────────────────────────────────────────────
describe('IconAvatarPlaceholder – data-* 与 style 透传', () => {
    it('data-testid 透传到 svg', () => {
        const { container } = render(<IconAvatarPlaceholder data-testid="placeholder-icon" />);
        expect(container.querySelector('svg')).toHaveAttribute('data-testid', 'placeholder-icon');
    });

    it('自定义 data-* 属性透传到 svg', () => {
        const { container } = render(<IconAvatarPlaceholder data-type="cat" />);
        expect(container.querySelector('svg')).toHaveAttribute('data-type', 'cat');
    });

    it('style 属性透传到 svg', () => {
        const { container } = render(
            <IconAvatarPlaceholder style={{ color: 'red', opacity: 0.5 }} />,
        );
        const svg = container.querySelector('svg') as HTMLElement;
        expect(svg.style.color).toBe('red');
        expect(svg.style.opacity).toBe('0.5');
    });

    it('同时透传 className、style、data-* 不冲突', () => {
        const { container } = render(
            <IconAvatarPlaceholder
                className="combo-test"
                style={{ fontSize: '12px' }}
                data-role="avatar-icon"
            />,
        );
        const svg = container.querySelector('svg') as HTMLElement;
        expect(svg).toHaveClass('combo-test');
        expect(svg.style.fontSize).toBe('12px');
        expect(svg).toHaveAttribute('data-role', 'avatar-icon');
    });
});

describe('IconAvatarEdit – data-* 与 style 透传', () => {
    it('data-testid 透传到 svg', () => {
        const { container } = render(<IconAvatarEdit data-testid="edit-icon" />);
        expect(container.querySelector('svg')).toHaveAttribute('data-testid', 'edit-icon');
    });

    it('自定义 data-* 属性透传到 svg', () => {
        const { container } = render(<IconAvatarEdit data-action="edit" />);
        expect(container.querySelector('svg')).toHaveAttribute('data-action', 'edit');
    });

    it('style 属性透传到 svg', () => {
        const { container } = render(
            <IconAvatarEdit style={{ color: 'white', opacity: 0.8 }} />,
        );
        const svg = container.querySelector('svg') as HTMLElement;
        expect(svg.style.color).toBe('white');
        expect(svg.style.opacity).toBe('0.8');
    });

    it('同时透传 className、style、data-* 不冲突', () => {
        const { container } = render(
            <IconAvatarEdit
                className="edit-combo"
                style={{ cursor: 'pointer' }}
                data-icon="camera"
            />,
        );
        const svg = container.querySelector('svg') as HTMLElement;
        expect(svg).toHaveClass('edit-combo');
        expect(svg.style.cursor).toBe('pointer');
        expect(svg).toHaveAttribute('data-icon', 'camera');
    });
});
