/**
 * PageFab 组件单元测试
 *
 * 覆盖范围：
 *  ─ 基本渲染
 *    1.  渲染 button 元素
 *    2.  button type="button"
 *    3.  渲染 label 文字
 *    4.  渲染 icon 节点
 *  ─ aria-label
 *    5.  未传 ariaLabel 时 aria-label 默认使用 label
 *    6.  传入 ariaLabel 时 aria-label 使用 ariaLabel（覆盖 label）
 *  ─ 点击事件
 *    7.  点击触发 onClick
 *    8.  点击只触发一次
 *  ─ className（fab 已有内置 class）
 *    9.  button 含 fab class
 *  ─ React.memo
 *    10. PageFab 是 React.memo 包裹的组件
 */

import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import PageFab from '../layout/PageFab/PageFab';

// ─────────────────────────────────────────────────────────────────────────────
// 辅助函数
// ─────────────────────────────────────────────────────────────────────────────
function renderFab(overrides: Partial<React.ComponentProps<typeof PageFab>> = {}) {
    const defaults = {
        icon: <svg data-testid="fab-icon" />,
        label: '新建',
        onClick: vi.fn(),
    };
    return render(<PageFab {...defaults} {...overrides} />);
}

// ─── 1. 基本渲染 ──────────────────────────────────────────────────────────────
describe('PageFab – 基本渲染', () => {
    it('渲染 button 元素', () => {
        renderFab();
        expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('button type="button"', () => {
        renderFab();
        expect(screen.getByRole('button')).toHaveAttribute('type', 'button');
    });

    it('渲染 label 文字', () => {
        renderFab({ label: '添加商品' });
        expect(screen.getByText('添加商品')).toBeInTheDocument();
    });

    it('渲染 icon 节点', () => {
        renderFab();
        expect(screen.getByTestId('fab-icon')).toBeInTheDocument();
    });
});

// ─── 2. aria-label ────────────────────────────────────────────────────────────
describe('PageFab – aria-label', () => {
    it('未传 ariaLabel 时 aria-label 默认使用 label', () => {
        renderFab({ label: '新建部门' });
        expect(screen.getByRole('button')).toHaveAttribute('aria-label', '新建部门');
    });

    it('传入 ariaLabel 时使用 ariaLabel（覆盖 label）', () => {
        renderFab({ label: '新建', ariaLabel: '新建一个部门条目' });
        expect(screen.getByRole('button')).toHaveAttribute('aria-label', '新建一个部门条目');
    });
});

// ─── 3. 点击事件 ──────────────────────────────────────────────────────────────
describe('PageFab – 点击事件', () => {
    it('点击触发 onClick', async () => {
        const user = userEvent.setup();
        const onClick = vi.fn();
        renderFab({ onClick });
        await user.click(screen.getByRole('button'));
        expect(onClick).toHaveBeenCalledTimes(1);
    });

    it('多次点击只触发对应次数', async () => {
        const user = userEvent.setup();
        const onClick = vi.fn();
        renderFab({ onClick });
        await user.click(screen.getByRole('button'));
        await user.click(screen.getByRole('button'));
        expect(onClick).toHaveBeenCalledTimes(2);
    });
});

// ─── 4. fab class ─────────────────────────────────────────────────────────────
describe('PageFab – 内置 class', () => {
    it('button 含 fab class', () => {
        renderFab();
        expect(screen.getByRole('button').className).toMatch(/fab/);
    });
});

// ─── 5. React.memo ────────────────────────────────────────────────────────────
describe('PageFab – React.memo', () => {
    it('PageFab 是 React.memo 包裹的组件', () => {
        expect((PageFab as unknown as { $$typeof?: symbol }).$$typeof?.toString()).toContain('memo');
    });
});
