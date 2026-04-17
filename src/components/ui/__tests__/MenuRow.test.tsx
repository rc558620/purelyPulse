/**
 * MenuRow 组件单元测试
 *
 * 覆盖范围：
 *  ─ 基本渲染
 *    1.  渲染 button 元素
 *    2.  label 文本正常展示
 *    3.  button type="button"
 *  ─ icon
 *    4.  传入 icon 时渲染 icon 容器
 *    5.  不传 icon 时不渲染 icon 容器
 *    6.  icon 容器具有 aria-hidden="true"
 *  ─ description
 *    7.  传入 description 时渲染描述文字
 *    8.  不传 description 时不渲染描述节点
 *  ─ badge
 *    9.  传入 badge 时渲染徽标文字
 *    10. 不传 badge 时不渲染徽标
 *    11. badgeVariant="success" 添加对应 badge--success class
 *    12. badgeVariant="warning" 添加对应 badge--warning class
 *    13. badgeVariant="danger"  添加对应 badge--danger class
 *    14. badgeVariant="info"    添加对应 badge--info class（默认）
 *    15. 默认 badgeVariant 为 info
 *  ─ showArrow
 *    16. 默认 showArrow=true 时渲染箭头 span
 *    17. showArrow=false 时不渲染箭头
 *  ─ danger 样式
 *    18. danger=true 时 button 含 menuRowDanger class
 *    19. danger=true 时 icon 容器含 menuIconDanger class
 *    20. danger=false（默认）时不含 menuRowDanger class
 *  ─ className 透传
 *    21. 自定义 className 被附加到 button 上
 *  ─ 点击事件
 *    22. 点击按钮触发 onClick
 *    23. onClick 仅触发一次
 *  ─ React.memo
 *    24. MenuRow 是 React.memo 包裹的组件
 */

import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import MenuRow from '../MenuRow/MenuRow';
import type { BadgeVariant } from '../MenuRow/MenuRow';

// ─────────────────────────────────────────────────────────────────────────────
// 辅助函数：渲染带默认 props 的 MenuRow
// ─────────────────────────────────────────────────────────────────────────────
function renderMenuRow(overrides: Partial<React.ComponentProps<typeof MenuRow>> = {}) {
    const defaults = {
        label: '菜单项',
        onClick: vi.fn(),
    };
    return render(<MenuRow {...defaults} {...overrides} />);
}

// ─── 1. 基本渲染 ──────────────────────────────────────────────────────────────
describe('MenuRow – 基本渲染', () => {
    it('渲染 button 元素', () => {
        renderMenuRow();
        expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('label 文本正常展示', () => {
        renderMenuRow({ label: '修改密码' });
        expect(screen.getByText('修改密码')).toBeInTheDocument();
    });

    it('button type="button"', () => {
        renderMenuRow();
        expect(screen.getByRole('button')).toHaveAttribute('type', 'button');
    });
});

// ─── 2. icon ──────────────────────────────────────────────────────────────────
describe('MenuRow – icon', () => {
    it('传入 icon 时渲染 icon 容器', () => {
        renderMenuRow({ icon: <svg data-testid="icon-svg" /> });
        expect(screen.getByTestId('icon-svg')).toBeInTheDocument();
    });

    it('不传 icon 时不渲染 icon 容器', () => {
        const { container } = renderMenuRow({ icon: undefined });
        // 确认没有含 menuIcon class 的 div
        const iconWrapper = container.querySelector('[class*="menuIcon"]');
        expect(iconWrapper).toBeNull();
    });

    it('icon 容器具有 aria-hidden="true"', () => {
        const { container } = renderMenuRow({ icon: <span>图标</span> });
        const iconWrapper = container.querySelector('[aria-hidden="true"]');
        expect(iconWrapper).toBeInTheDocument();
    });
});

// ─── 3. description ───────────────────────────────────────────────────────────
describe('MenuRow – description', () => {
    it('传入 description 时渲染描述文字', () => {
        renderMenuRow({ description: '这是一段描述' });
        expect(screen.getByText('这是一段描述')).toBeInTheDocument();
    });

    it('不传 description 时不渲染描述 span', () => {
        const { container } = renderMenuRow({ description: undefined });
        const descEl = container.querySelector('[class*="menuDesc"]');
        expect(descEl).toBeNull();
    });
});

// ─── 4. badge ────────────────────────────────────────────────────────────────
describe('MenuRow – badge', () => {
    it('传入 badge 时渲染徽标文字', () => {
        renderMenuRow({ badge: '未认证' });
        expect(screen.getByText('未认证')).toBeInTheDocument();
    });

    it('不传 badge 时不渲染徽标', () => {
        const { container } = renderMenuRow({ badge: undefined });
        const badgeEl = container.querySelector('[class*="menuBadge"]');
        expect(badgeEl).toBeNull();
    });

    const badgeVariants: BadgeVariant[] = ['success', 'warning', 'danger', 'info'];
    badgeVariants.forEach((variant) => {
        it(`badgeVariant="${variant}" 时徽标含 badge--${variant} class`, () => {
            const { container } = renderMenuRow({ badge: '标签', badgeVariant: variant });
            const badgeEl = container.querySelector('[class*="menuBadge"]');
            expect(badgeEl).toBeInTheDocument();
            expect(badgeEl!.className).toMatch(new RegExp(`badge--${variant}`));
        });
    });

    it('默认 badgeVariant 为 info', () => {
        const { container } = renderMenuRow({ badge: '标签' });
        const badgeEl = container.querySelector('[class*="menuBadge"]');
        expect(badgeEl!.className).toMatch(/badge--info/);
    });
});

// ─── 5. showArrow ─────────────────────────────────────────────────────────────
describe('MenuRow – showArrow', () => {
    it('默认 showArrow=true 时渲染箭头 span（含 menuArrow class）', () => {
        const { container } = renderMenuRow();
        const arrowEl = container.querySelector('[class*="menuArrow"]');
        expect(arrowEl).toBeInTheDocument();
    });

    it('showArrow=false 时不渲染箭头', () => {
        const { container } = renderMenuRow({ showArrow: false });
        const arrowEl = container.querySelector('[class*="menuArrow"]');
        expect(arrowEl).toBeNull();
    });
});

// ─── 6. danger 样式 ──────────────────────────────────────────────────────────
describe('MenuRow – danger 样式', () => {
    it('danger=true 时 button 含 menuRowDanger class', () => {
        renderMenuRow({ danger: true });
        expect(screen.getByRole('button').className).toMatch(/menuRowDanger/);
    });

    it('danger=true 时 icon 容器含 menuIconDanger class', () => {
        const { container } = renderMenuRow({ danger: true, icon: <span>图标</span> });
        const iconWrapper = container.querySelector('[class*="menuIcon"]');
        expect(iconWrapper!.className).toMatch(/menuIconDanger/);
    });

    it('danger=false（默认）时不含 menuRowDanger class', () => {
        renderMenuRow();
        expect(screen.getByRole('button').className).not.toMatch(/menuRowDanger/);
    });
});

// ─── 7. className 透传 ────────────────────────────────────────────────────────
describe('MenuRow – className 透传', () => {
    it('自定义 className 被附加到 button 上', () => {
        renderMenuRow({ className: 'custom-row' });
        expect(screen.getByRole('button').className).toContain('custom-row');
    });
});

// ─── 8. 点击事件 ──────────────────────────────────────────────────────────────
describe('MenuRow – 点击事件', () => {
    it('点击按钮触发 onClick', async () => {
        const user = userEvent.setup();
        const onClick = vi.fn();
        renderMenuRow({ onClick });
        await user.click(screen.getByRole('button'));
        expect(onClick).toHaveBeenCalledTimes(1);
    });

    it('onClick 仅触发一次（无重复调用）', async () => {
        const user = userEvent.setup();
        const onClick = vi.fn();
        renderMenuRow({ onClick });
        await user.click(screen.getByRole('button'));
        expect(onClick).toHaveBeenCalledTimes(1);
    });
});

// ─── 9. React.memo ────────────────────────────────────────────────────────────
describe('MenuRow – React.memo', () => {
    it('MenuRow 是 React.memo 包裹的组件', () => {
        expect((MenuRow as unknown as { $$typeof?: symbol }).$$typeof?.toString()).toContain('memo');
    });
});
