/**
 * SectionToggleHeader 组件单元测试
 *
 * 覆盖范围：
 *  ─ 基本渲染
 *    1.  渲染 title 文字
 *    2.  渲染 toggle button
 *    3.  button type="button"
 *    4.  渲染默认图标（DefaultToggleIcon svg）
 *  ─ visible=true 状态
 *    5.  visible=true 时按钮文字为"收起"
 *    6.  visible=true 时按钮含 toggleBtnActive class
 *    7.  visible=true 时 aria-label="收起{title}"
 *    8.  visible=true 时 aria-pressed="true"
 *  ─ visible=false 状态
 *    9.  visible=false 时按钮文字为"展开"
 *    10. visible=false 时按钮不含 toggleBtnActive class
 *    11. visible=false 时 aria-label="展开{title}"
 *    12. visible=false 时 aria-pressed="false"
 *  ─ 自定义图标
 *    13. toggleIcon 传入时渲染自定义图标
 *    14. toggleIcon 传入时不渲染默认 svg（源码逻辑是覆盖，但默认图标 SVG 被替换）
 *  ─ 点击事件
 *    15. 点击按钮触发 onToggle
 *    16. 点击只触发一次
 *  ─ React.memo
 *    17. SectionToggleHeader 是 React.memo 包裹的组件
 */

import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SectionToggleHeader from '../layout/SectionToggleHeader/SectionToggleHeader';

// ─────────────────────────────────────────────────────────────────────────────
// 辅助函数
// ─────────────────────────────────────────────────────────────────────────────
function renderHeader(overrides: Partial<React.ComponentProps<typeof SectionToggleHeader>> = {}) {
    const defaults = {
        title: '销售分析',
        visible: true,
        onToggle: vi.fn(),
    };
    return render(<SectionToggleHeader {...defaults} {...overrides} />);
}

// ─── 1. 基本渲染 ──────────────────────────────────────────────────────────────
describe('SectionToggleHeader – 基本渲染', () => {
    it('渲染 title 文字', () => {
        renderHeader({ title: '利润趋势' });
        expect(screen.getByText('利润趋势')).toBeInTheDocument();
    });

    it('渲染 toggle button', () => {
        renderHeader();
        expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('button type="button"', () => {
        renderHeader();
        expect(screen.getByRole('button')).toHaveAttribute('type', 'button');
    });

    it('渲染默认图标（svg 元素）', () => {
        const { container } = renderHeader({ toggleIcon: undefined });
        // DefaultToggleIcon 是 svg
        expect(container.querySelector('svg')).toBeInTheDocument();
    });
});

// ─── 2. visible=true 状态 ─────────────────────────────────────────────────────
describe('SectionToggleHeader – visible=true', () => {
    it('按钮文字为"收起"', () => {
        renderHeader({ visible: true });
        expect(screen.getByRole('button')).toHaveTextContent('收起');
    });

    it('按钮含 toggleBtnActive class', () => {
        renderHeader({ visible: true });
        expect(screen.getByRole('button').className).toMatch(/toggleBtnActive/);
    });

    it('aria-label="收起{title}"', () => {
        renderHeader({ title: '成本结构', visible: true });
        expect(screen.getByRole('button')).toHaveAttribute('aria-label', '收起成本结构');
    });

    it('aria-pressed="true"', () => {
        renderHeader({ visible: true });
        expect(screen.getByRole('button')).toHaveAttribute('aria-pressed', 'true');
    });
});

// ─── 3. visible=false 状态 ────────────────────────────────────────────────────
describe('SectionToggleHeader – visible=false', () => {
    it('按钮文字为"展开"', () => {
        renderHeader({ visible: false });
        expect(screen.getByRole('button')).toHaveTextContent('展开');
    });

    it('按钮不含 toggleBtnActive class', () => {
        renderHeader({ visible: false });
        expect(screen.getByRole('button').className).not.toMatch(/toggleBtnActive/);
    });

    it('aria-label="展开{title}"', () => {
        renderHeader({ title: '销售分析', visible: false });
        expect(screen.getByRole('button')).toHaveAttribute('aria-label', '展开销售分析');
    });

    it('aria-pressed="false"', () => {
        renderHeader({ visible: false });
        expect(screen.getByRole('button')).toHaveAttribute('aria-pressed', 'false');
    });
});

// ─── 4. 自定义图标 ────────────────────────────────────────────────────────────
describe('SectionToggleHeader – 自定义图标', () => {
    it('toggleIcon 传入时渲染自定义图标', () => {
        renderHeader({ toggleIcon: <span data-testid="custom-icon">★</span> });
        expect(screen.getByTestId('custom-icon')).toBeInTheDocument();
    });

    it('toggleIcon 传入时默认 SVG 图标被替换（找不到 svg）', () => {
        const { container } = renderHeader({
            toggleIcon: <span data-testid="custom-icon">★</span>,
        });
        // 自定义图标替换了 DefaultToggleIcon（svg）
        expect(container.querySelector('svg')).toBeNull();
    });
});

// ─── 5. 点击事件 ──────────────────────────────────────────────────────────────
describe('SectionToggleHeader – 点击事件', () => {
    it('点击按钮触发 onToggle', async () => {
        const user = userEvent.setup();
        const onToggle = vi.fn();
        renderHeader({ onToggle });
        await user.click(screen.getByRole('button'));
        expect(onToggle).toHaveBeenCalledTimes(1);
    });

    it('点击只触发一次', async () => {
        const user = userEvent.setup();
        const onToggle = vi.fn();
        renderHeader({ onToggle });
        await user.click(screen.getByRole('button'));
        expect(onToggle).toHaveBeenCalledTimes(1);
    });
});

// ─── 6. React.memo ────────────────────────────────────────────────────────────
describe('SectionToggleHeader – React.memo', () => {
    it('SectionToggleHeader 是 React.memo 包裹的组件', () => {
        expect((SectionToggleHeader as unknown as { $$typeof?: symbol }).$$typeof?.toString()).toContain('memo');
    });
});
