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
 *    8.  多次点击触发对应次数
 *  ─ className（fab 已有内置 class）
 *    9.  button 含 fab class
 *  ─ React.memo
 *    10. PageFab 是 React.memo 包裹的组件
 *  ─ disabled
 *    11. disabled 时按钮有 disabled 属性
 *    12. disabled 时点击不触发 onClick
 *  ─ loading
 *    13. loading 时按钮有 disabled 属性
 *    14. loading 时显示 spinner 替代 icon
 *    15. loading 时点击不触发 onClick
 *    16. loading 时 aria-busy 为 true
 *  ─ className prop
 *    17. 传入 className 时合并到按钮 class
 *  ─ 键盘交互
 *    18. 按 Enter 触发 onClick
 *    19. 按 Space 触发 onClick
 *    20. disabled 时按 Enter 不触发 onClick
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

// ─── 6. disabled ──────────────────────────────────────────────────────────────
describe('PageFab – disabled', () => {
    it('disabled 时按钮有 disabled 属性', () => {
        renderFab({ disabled: true });
        expect(screen.getByRole('button')).toBeDisabled();
    });

    it('disabled 时点击不触发 onClick', async () => {
        const user = userEvent.setup();
        const onClick = vi.fn();
        renderFab({ disabled: true, onClick });
        await user.click(screen.getByRole('button'));
        expect(onClick).not.toHaveBeenCalled();
    });
});

// ─── 7. loading ───────────────────────────────────────────────────────────────
describe('PageFab – loading', () => {
    it('loading 时按钮有 disabled 属性', () => {
        renderFab({ loading: true });
        expect(screen.getByRole('button')).toBeDisabled();
    });

    it('loading 时显示 spinner 替代 icon', () => {
        renderFab({ loading: true });
        // icon 不应渲染
        expect(screen.queryByTestId('fab-icon')).not.toBeInTheDocument();
        // spinner 应渲染
        expect(screen.getByTestId('fab-spinner')).toBeInTheDocument();
    });

    it('loading 时点击不触发 onClick', async () => {
        const user = userEvent.setup();
        const onClick = vi.fn();
        renderFab({ loading: true, onClick });
        await user.click(screen.getByRole('button'));
        expect(onClick).not.toHaveBeenCalled();
    });

    it('loading 时 aria-busy 为 true', () => {
        renderFab({ loading: true });
        expect(screen.getByRole('button')).toHaveAttribute('aria-busy', 'true');
    });

    it('非 loading 时 aria-busy 不存在', () => {
        renderFab({ loading: false });
        expect(screen.getByRole('button')).not.toHaveAttribute('aria-busy');
    });
});

// ─── 8. className prop ────────────────────────────────────────────────────────
describe('PageFab – className prop', () => {
    it('传入 className 时合并到按钮 class', () => {
        renderFab({ className: 'custom-fab' });
        expect(screen.getByRole('button').className).toContain('custom-fab');
    });

    it('不传 className 时按钮仍含 fab class', () => {
        renderFab();
        expect(screen.getByRole('button').className).toMatch(/fab/);
    });
});

// ─── 9. 键盘交互 ──────────────────────────────────────────────────────────────
describe('PageFab – 键盘交互', () => {
    it('按 Enter 触发 onClick', async () => {
        const user = userEvent.setup();
        const onClick = vi.fn();
        renderFab({ onClick });
        screen.getByRole('button').focus();
        await user.keyboard('{Enter}');
        expect(onClick).toHaveBeenCalledTimes(1);
    });

    it('按 Space 触发 onClick', async () => {
        const user = userEvent.setup();
        const onClick = vi.fn();
        renderFab({ onClick });
        screen.getByRole('button').focus();
        await user.keyboard(' ');
        expect(onClick).toHaveBeenCalledTimes(1);
    });

    it('disabled 时按 Enter 不触发 onClick', async () => {
        const user = userEvent.setup();
        const onClick = vi.fn();
        renderFab({ disabled: true, onClick });
        screen.getByRole('button').focus();
        await user.keyboard('{Enter}');
        expect(onClick).not.toHaveBeenCalled();
    });
});
