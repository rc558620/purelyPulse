/**
 * InlineItemActions + InlineItemLabel 组件单元测试
 *
 * ─ InlineItemActions
 *    1.  渲染 role="group" 容器
 *    2.  group aria-label="操作"
 *    3.  渲染编辑按钮
 *    4.  渲染删除按钮
 *    5.  编辑按钮 aria-label 包含 name
 *    6.  删除按钮 aria-label 包含 name
 *    7.  两个按钮均为 type="button"
 *    8.  点击编辑按钮触发 onEdit
 *    9.  点击删除按钮触发 onDelete
 *    10. onEdit 只触发一次
 *    11. onDelete 只触发一次
 *    12. 点击编辑不触发 onDelete，点击删除不触发 onEdit
 *    13. InlineItemActions 是 React.memo 包裹的组件
 *
 * ─ InlineItemLabel
 *    14. 渲染 name 文本
 *    15. name 更新后重新渲染
 *    16. InlineItemLabel 是 React.memo 包裹的组件
 */

import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import InlineItemActions from '../inlineEdit/InlineItemActions/InlineItemActions';
import InlineItemLabel from '../inlineEdit/InlineItemLabel/InlineItemLabel';

// ═══════════════════════════════════════════════════════════════
// InlineItemActions
// ═══════════════════════════════════════════════════════════════

function renderActions(overrides: Partial<React.ComponentProps<typeof InlineItemActions>> = {}) {
    const defaults = {
        name: '部门A',
        onEdit: vi.fn(),
        onDelete: vi.fn(),
    };
    return render(<InlineItemActions {...defaults} {...overrides} />);
}

describe('InlineItemActions – 基本渲染', () => {
    it('渲染 role="group" 容器', () => {
        renderActions();
        expect(screen.getByRole('group')).toBeInTheDocument();
    });

    it('group aria-label="操作"', () => {
        renderActions();
        expect(screen.getByRole('group')).toHaveAttribute('aria-label', '操作');
    });

    it('渲染两个 button', () => {
        renderActions();
        expect(screen.getAllByRole('button')).toHaveLength(2);
    });

    it('编辑按钮 aria-label 为"编辑「name」"', () => {
        renderActions({ name: '蔬菜区' });
        expect(screen.getByRole('button', { name: '编辑「蔬菜区」' })).toBeInTheDocument();
    });

    it('删除按钮 aria-label 为"删除「name」"', () => {
        renderActions({ name: '蔬菜区' });
        expect(screen.getByRole('button', { name: '删除「蔬菜区」' })).toBeInTheDocument();
    });

    it('两个 button 均为 type="button"', () => {
        renderActions();
        screen.getAllByRole('button').forEach((btn) => {
            expect(btn).toHaveAttribute('type', 'button');
        });
    });
});

describe('InlineItemActions – 点击事件', () => {
    it('点击编辑按钮触发 onEdit', async () => {
        const user = userEvent.setup();
        const onEdit = vi.fn();
        renderActions({ onEdit });
        await user.click(screen.getByRole('button', { name: /编辑/ }));
        expect(onEdit).toHaveBeenCalledTimes(1);
    });

    it('点击删除按钮触发 onDelete', async () => {
        const user = userEvent.setup();
        const onDelete = vi.fn();
        renderActions({ onDelete });
        await user.click(screen.getByRole('button', { name: /删除/ }));
        expect(onDelete).toHaveBeenCalledTimes(1);
    });

    it('点击编辑不触发 onDelete', async () => {
        const user = userEvent.setup();
        const onDelete = vi.fn();
        renderActions({ onDelete });
        await user.click(screen.getByRole('button', { name: /编辑/ }));
        expect(onDelete).not.toHaveBeenCalled();
    });

    it('点击删除不触发 onEdit', async () => {
        const user = userEvent.setup();
        const onEdit = vi.fn();
        renderActions({ onEdit });
        await user.click(screen.getByRole('button', { name: /删除/ }));
        expect(onEdit).not.toHaveBeenCalled();
    });
});

describe('InlineItemActions – React.memo', () => {
    it('InlineItemActions 是 React.memo 包裹的组件', () => {
        expect((InlineItemActions as unknown as { $$typeof?: symbol }).$$typeof?.toString()).toContain('memo');
    });
});

// ═══════════════════════════════════════════════════════════════
// InlineItemLabel
// ═══════════════════════════════════════════════════════════════

describe('InlineItemLabel – 基本渲染', () => {
    it('渲染 name 文本', () => {
        render(<InlineItemLabel name="蔬菜区" />);
        expect(screen.getByText('蔬菜区')).toBeInTheDocument();
    });

    it('name 更新后重新渲染新文本', () => {
        const { rerender } = render(<InlineItemLabel name="旧名称" />);
        rerender(<InlineItemLabel name="新名称" />);
        expect(screen.getByText('新名称')).toBeInTheDocument();
        expect(screen.queryByText('旧名称')).toBeNull();
    });

    it('name 为空字符串时渲染空', () => {
        render(<InlineItemLabel name="" />);
        const { container } = render(<InlineItemLabel name="" />);
        expect(container.querySelector('[class*="name"]')?.textContent).toBe('');
    });
});

describe('InlineItemLabel – React.memo', () => {
    it('InlineItemLabel 是 React.memo 包裹的组件', () => {
        expect((InlineItemLabel as unknown as { $$typeof?: symbol }).$$typeof?.toString()).toContain('memo');
    });
});
