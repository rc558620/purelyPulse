/**
 * EmptyState + ListEmptyState 组件单元测试
 *
 * ─ EmptyState
 *    1.  渲染 icon 节点
 *    2.  渲染 title
 *    3.  渲染 desc（传入时）
 *    4.  不传 desc 时不渲染描述
 *    5.  onAction 不传时不渲染按钮
 *    6.  onAction 传入但 actionText 未传时不渲染按钮
 *    7.  onAction 与 actionText 都传入时渲染按钮
 *    8.  按钮文字与 actionText 一致
 *    9.  actionIcon 传入时渲染图标且含 aria-hidden
 *    10. 点击按钮触发 onAction
 *    11. button type="button"
 *    12. disabled 传入时按钮禁用
 *    13. className 透传
 *    14. style 透传
 *    15. EmptyState 是 React.memo 包裹的组件
 *
 * ─ ListEmptyState
 *    16. hasFilter=false（默认）时显示 emptyTitle
 *    17. hasFilter=false 时显示 emptyDesc
 *    18. hasFilter=true 时显示 filteredTitle（默认"没有符合条件的数据"）
 *    19. hasFilter=true 时显示 filteredDesc（默认"尝试调整搜索条件或清除筛选"）
 *    20. 自定义 filteredTitle 生效
 *    21. 自定义 filteredDesc 生效
 *    22. hasFilter=false 时渲染 emptyAction 按钮
 *    23. hasFilter=true 时渲染 filteredAction 按钮
 *    24. emptyAction.variant="primary" 时按钮含 actionBtn class
 *    25. emptyAction.variant="clear"（默认）时按钮含 clearBtn class
 *    26. 点击 emptyAction 按钮触发 onClick
 *    27. 点击 filteredAction 按钮触发 onClick
 *    28. 无对应 action 时不渲染按钮
 *    29. 渲染 icon 节点
 *    30. ListEmptyState 是 React.memo 包裹的组件
 *    31. emptyTitle 默认值为"暂无数据"
 *    32. 不传 emptyDesc 时不渲染描述 DOM 节点
 *    33. emptyDesc 传空字符串时不渲染描述 DOM 节点
 *    34. action.disabled=true 时按钮被禁用
 *    35. filteredAction.disabled=true 时按钮被禁用
 *    36. hasFilter=true 时不显示 emptyTitle（含默认值）
 */

import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import EmptyState from '../feedback/EmptyState';
import ListEmptyState from '../feedback/ListEmptyState/ListEmptyState';

// ─────────────────────────────────────────────────────────────────────────────
// ═══ EmptyState ═══
// ─────────────────────────────────────────────────────────────────────────────

const DefaultIcon = <svg data-testid="empty-icon" />;

function renderEmptyState(overrides: Partial<React.ComponentProps<typeof EmptyState>> = {}) {
    const defaults = {
        icon: DefaultIcon,
        title: '暂无数据',
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

    it('渲染 desc（传入时）', () => {
        renderEmptyState({ desc: '先添加一些数据吧' });
        expect(screen.getByText('先添加一些数据吧')).toBeInTheDocument();
    });

    it('不传 desc 时不渲染描述', () => {
        const { container } = renderEmptyState();
        expect(container.querySelector(`[class*="emptyDesc"]`)).toBeNull();
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

    it('actionIcon 传入时渲染图标且含 aria-hidden', () => {
        renderEmptyState({
            onAction: vi.fn(),
            actionText: '添加',
            actionIcon: <svg data-testid="action-icon" />,
        });
        const iconWrapper = screen.getByTestId('action-icon').parentElement;
        expect(iconWrapper).toHaveAttribute('aria-hidden', 'true');
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

    it('disabled 传入时按钮禁用', () => {
        renderEmptyState({ onAction: vi.fn(), actionText: '重试', disabled: true });
        expect(screen.getByRole('button')).toBeDisabled();
    });
});

describe('EmptyState – 透传属性', () => {
    it('className 透传', () => {
        const { container } = renderEmptyState({ className: 'custom-class' });
        expect(container.firstChild).toHaveClass('custom-class');
    });

    it('style 透传', () => {
        const { container } = renderEmptyState({ style: { marginTop: 10 } });
        expect(container.firstChild).toHaveStyle({ marginTop: '10px' });
    });
});

describe('EmptyState – React.memo', () => {
    it('EmptyState 是 React.memo 包裹的组件', () => {
        expect((EmptyState as unknown as { $$typeof?: symbol }).$$typeof?.toString()).toContain('memo');
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// ═══ ListEmptyState ═══
// ─────────────────────────────────────────────────────────────────────────────

const ListIcon = <svg data-testid="list-icon" />;

function renderListEmpty(overrides: Partial<React.ComponentProps<typeof ListEmptyState>> = {}) {
    const defaults = {
        icon: ListIcon,
    };
    return render(<ListEmptyState {...defaults} {...overrides} />);
}

describe('ListEmptyState – 无筛选态（hasFilter=false）', () => {
    it('显示 emptyTitle（自定义）', () => {
        renderListEmpty({ emptyTitle: '暂无记录' });
        expect(screen.getByText('暂无记录')).toBeInTheDocument();
    });

    it('显示 emptyTitle（默认"暂无数据"）', () => {
        renderListEmpty();
        expect(screen.getByText('暂无数据')).toBeInTheDocument();
    });

    it('显示 emptyDesc', () => {
        renderListEmpty({ emptyDesc: '先添加一条数据' });
        expect(screen.getByText('先添加一条数据')).toBeInTheDocument();
    });

    it('不传 emptyDesc 时不渲染描述 DOM 节点', () => {
        const { container } = renderListEmpty();
        expect(container.querySelector(`[class*="emptyDesc"]`)).toBeNull();
    });

    it('emptyDesc 传空字符串时不渲染描述 DOM 节点', () => {
        const { container } = renderListEmpty({ emptyDesc: '' });
        expect(container.querySelector(`[class*="emptyDesc"]`)).toBeNull();
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

    it('hasFilter=true 时不显示默认 emptyTitle', () => {
        renderListEmpty({ hasFilter: true });
        expect(screen.queryByText('暂无数据')).toBeNull();
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

    it('emptyAction.disabled=true 时按钮被禁用', () => {
        renderListEmpty({
            emptyAction: { label: '添加', onClick: vi.fn(), disabled: true },
        });
        expect(screen.getByRole('button')).toBeDisabled();
    });

    it('filteredAction.disabled=true 时按钮被禁用', () => {
        renderListEmpty({
            hasFilter: true,
            filteredAction: { label: '清除', onClick: vi.fn(), disabled: true },
        });
        expect(screen.getByRole('button')).toBeDisabled();
    });
});

describe('ListEmptyState – React.memo', () => {
    it('ListEmptyState 是 React.memo 包裹的组件', () => {
        expect((ListEmptyState as unknown as { $$typeof?: symbol }).$$typeof?.toString()).toContain('memo');
    });
});
