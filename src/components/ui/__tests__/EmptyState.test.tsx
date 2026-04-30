/**
 * EmptyState + ListEmptyState 组件单元测试
 *
 * ─ EmptyState
 *    1.  渲染 icon 节点
 *    2.  渲染 title
 *    3.  渲染 desc
 *    4.  onAction 不传时不渲染按钮
 *    5.  onAction 传入但 actionText 未传时不渲染按钮
 *    6.  onAction 与 actionText 都传入时渲染按钮
 *    7.  按钮文字与 actionText 一致
 *    8.  actionIcon 传入时渲染图标
 *    9.  点击按钮触发 onAction
 *    10. button type="button"
 *
 * ─ ListEmptyState
 *    11. hasFilter=false（默认）时显示 emptyTitle
 *    12. hasFilter=false 时显示 emptyDesc
 *    13. hasFilter=true 时显示 filteredTitle（默认"没有符合条件的数据"）
 *    14. hasFilter=true 时显示 filteredDesc（默认"尝试调整搜索条件或清除筛选"）
 *    15. 自定义 filteredTitle 生效
 *    16. 自定义 filteredDesc 生效
 *    17. hasFilter=false 时渲染 emptyAction 按钮
 *    18. hasFilter=true 时渲染 filteredAction 按钮
 *    19. emptyAction.variant="primary" 时按钮含 actionBtn class
 *    20. emptyAction.variant="clear"（默认）时按钮含 clearBtn class
 *    21. 点击 emptyAction 按钮触发 onClick
 *    22. 点击 filteredAction 按钮触发 onClick
 *    23. 无对应 action 时不渲染按钮
 *    24. 渲染 icon 节点
 *    25. ListEmptyState 是 React.memo 包裹的组件
 */

import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import EmptyState from '../feedback/EmptyState/EmptyState';
import ListEmptyState from '../feedback/ListEmptyState/ListEmptyState';

// ─────────────────────────────────────────────────────────────────────────────
// ═══ EmptyState ═══
// ─────────────────────────────────────────────────────────────────────────────

const DefaultIcon = <svg data-testid="empty-icon" />;

function renderEmptyState(overrides: Partial<React.ComponentProps<typeof EmptyState>> = {}) {
    const defaults = {
        icon: DefaultIcon,
        title: '暂无数据',
        desc: '当前没有可显示的内容',
    };
    return render(<EmptyState {...defaults} {...overrides} />);
}

describe('EmptyState – 基本渲染', () => {
    it('渲染 icon 节点', () => {
        renderEmptyState();
        expect(screen.getByTestId('empty-icon')).toBeInTheDocument();
    });

    it('渲染 title', () => {
        renderEmptyState({ title: '什么都没有' });
        expect(screen.getByText('什么都没有')).toBeInTheDocument();
    });

    it('渲染 desc', () => {
        renderEmptyState({ desc: '先添加一些数据吧' });
        expect(screen.getByText('先添加一些数据吧')).toBeInTheDocument();
    });
});

describe('EmptyState – 操作按钮', () => {
    it('onAction 不传时不渲染按钮', () => {
        renderEmptyState({ onAction: undefined });
        expect(screen.queryByRole('button')).toBeNull();
    });

    it('onAction 传入但 actionText 未传时不渲染按钮', () => {
        renderEmptyState({ onAction: vi.fn(), actionText: undefined });
        expect(screen.queryByRole('button')).toBeNull();
    });

    it('onAction 与 actionText 都传入时渲染按钮', () => {
        renderEmptyState({ onAction: vi.fn(), actionText: '去添加' });
        expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('按钮文字与 actionText 一致', () => {
        renderEmptyState({ onAction: vi.fn(), actionText: '立即添加' });
        expect(screen.getByRole('button')).toHaveTextContent('立即添加');
    });

    it('actionIcon 传入时渲染图标', () => {
        renderEmptyState({
            onAction: vi.fn(),
            actionText: '添加',
            actionIcon: <svg data-testid="action-icon" />,
        });
        expect(screen.getByTestId('action-icon')).toBeInTheDocument();
    });

    it('点击按钮触发 onAction', async () => {
        const user = userEvent.setup();
        const onAction = vi.fn();
        renderEmptyState({ onAction, actionText: '点我' });
        await user.click(screen.getByRole('button'));
        expect(onAction).toHaveBeenCalledTimes(1);
    });

    it('button type="button"', () => {
        renderEmptyState({ onAction: vi.fn(), actionText: '按钮' });
        expect(screen.getByRole('button')).toHaveAttribute('type', 'button');
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// ═══ ListEmptyState ═══
// ─────────────────────────────────────────────────────────────────────────────

const ListIcon = <svg data-testid="list-icon" />;

function renderListEmpty(overrides: Partial<React.ComponentProps<typeof ListEmptyState>> = {}) {
    const defaults = {
        icon: ListIcon,
        emptyTitle: '列表为空',
        emptyDesc: '当前没有数据',
    };
    return render(<ListEmptyState {...defaults} {...overrides} />);
}

describe('ListEmptyState – 无筛选态（hasFilter=false）', () => {
    it('显示 emptyTitle', () => {
        renderListEmpty({ emptyTitle: '暂无记录' });
        expect(screen.getByText('暂无记录')).toBeInTheDocument();
    });

    it('显示 emptyDesc', () => {
        renderListEmpty({ emptyDesc: '先添加一条数据' });
        expect(screen.getByText('先添加一条数据')).toBeInTheDocument();
    });

    it('不显示 filteredTitle', () => {
        renderListEmpty({ emptyTitle: 'Empty', filteredTitle: '筛选为空' });
        expect(screen.queryByText('筛选为空')).toBeNull();
    });

    it('渲染 icon 节点', () => {
        renderListEmpty();
        expect(screen.getByTestId('list-icon')).toBeInTheDocument();
    });
});

describe('ListEmptyState – 筛选态（hasFilter=true）', () => {
    it('显示默认 filteredTitle', () => {
        renderListEmpty({ hasFilter: true });
        expect(screen.getByText('没有符合条件的数据')).toBeInTheDocument();
    });

    it('显示默认 filteredDesc', () => {
        renderListEmpty({ hasFilter: true });
        expect(screen.getByText('尝试调整搜索条件或清除筛选')).toBeInTheDocument();
    });

    it('自定义 filteredTitle 生效', () => {
        renderListEmpty({ hasFilter: true, filteredTitle: '没找到结果' });
        expect(screen.getByText('没找到结果')).toBeInTheDocument();
    });

    it('自定义 filteredDesc 生效', () => {
        renderListEmpty({ hasFilter: true, filteredDesc: '换个关键词试试' });
        expect(screen.getByText('换个关键词试试')).toBeInTheDocument();
    });

    it('hasFilter=true 时不显示 emptyTitle', () => {
        renderListEmpty({ hasFilter: true, emptyTitle: '列表为空' });
        expect(screen.queryByText('列表为空')).toBeNull();
    });
});

describe('ListEmptyState – action 按钮', () => {
    it('hasFilter=false 时渲染 emptyAction 按钮', () => {
        renderListEmpty({ emptyAction: { label: '立即添加', onClick: vi.fn(), variant: 'primary' } });
        expect(screen.getByRole('button', { name: '立即添加' })).toBeInTheDocument();
    });

    it('hasFilter=true 时渲染 filteredAction 按钮', () => {
        renderListEmpty({
            hasFilter: true,
            filteredAction: { label: '清除筛选', onClick: vi.fn(), variant: 'clear' },
        });
        expect(screen.getByRole('button', { name: '清除筛选' })).toBeInTheDocument();
    });

    it('emptyAction.variant="primary" 时按钮含 actionBtn class', () => {
        const { container } = renderListEmpty({
            emptyAction: { label: '添加', onClick: vi.fn(), variant: 'primary' },
        });
        const btn = container.querySelector('button');
        expect(btn!.className).toMatch(/actionBtn/);
    });

    it('emptyAction.variant="clear"（默认）时按钮含 clearBtn class', () => {
        const { container } = renderListEmpty({
            emptyAction: { label: '清除', onClick: vi.fn(), variant: 'clear' },
        });
        const btn = container.querySelector('button');
        expect(btn!.className).toMatch(/clearBtn/);
    });

    it('emptyAction 无 variant 时默认 clearBtn class', () => {
        const { container } = renderListEmpty({
            emptyAction: { label: '清除', onClick: vi.fn() },
        });
        const btn = container.querySelector('button');
        expect(btn!.className).toMatch(/clearBtn/);
    });

    it('点击 emptyAction 按钮触发 onClick', async () => {
        const user = userEvent.setup();
        const onClick = vi.fn();
        renderListEmpty({ emptyAction: { label: '添加', onClick } });
        await user.click(screen.getByRole('button'));
        expect(onClick).toHaveBeenCalledTimes(1);
    });

    it('点击 filteredAction 按钮触发 onClick', async () => {
        const user = userEvent.setup();
        const onClick = vi.fn();
        renderListEmpty({
            hasFilter: true,
            filteredAction: { label: '清除', onClick },
        });
        await user.click(screen.getByRole('button'));
        expect(onClick).toHaveBeenCalledTimes(1);
    });

    it('无对应 action 时不渲染按钮', () => {
        renderListEmpty({ emptyAction: undefined });
        expect(screen.queryByRole('button')).toBeNull();
    });
});

describe('ListEmptyState – React.memo', () => {
    it('ListEmptyState 是 React.memo 包裹的组件', () => {
        expect((ListEmptyState as unknown as { $$typeof?: symbol }).$$typeof?.toString()).toContain('memo');
    });
});
