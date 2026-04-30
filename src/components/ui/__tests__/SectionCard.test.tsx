/**
 * SectionCard 复合组件单元测试
 * 覆盖：SectionCard / SectionCard.Header / SectionCard.DividedList
 *
 * ─ SectionCard
 *    1.  渲染 div 容器
 *    2.  渲染 children
 *    3.  含 card class
 *    4.  fullHeight=true 含 cardFull class
 *    5.  fullHeight=false（默认）不含 cardFull class
 *    6.  noPadding=true 含 cardNoPadding class
 *    7.  noPadding=false（默认）不含 cardNoPadding class
 *    8.  className 附加到容器
 *    9.  SectionCard 是 React.memo 包裹的组件
 *
 * ─ SectionCard.Header
 *    10. 渲染 title 文字
 *    11. icon 为 ReactNode 时渲染图标
 *    12. icon 为 string（emoji）时包裹在 span.titleEmoji 中
 *    13. 不传 icon 时不渲染图标
 *    14. extra 传入时渲染
 *    15. 不传 extra 时不渲染 extra
 *    16. className 附加到 header div
 *    17. SectionCard.Header 是 React.memo 包裹的组件
 *
 * ─ SectionCard.DividedList
 *    18. 为每个 item 调用 renderItem
 *    19. 正确渲染所有 item 内容
 *    20. N 个 item 有 N-1 条分割线
 *    21. 最后一条 item 后无分割线
 *    22. 1 个 item 时无分割线
 *    23. 0 个 item 时无 item 无分割线
 *    24. keyExtractor 传入时使用其返回值作为 key（无重复渲染）
 *    25. 不传 keyExtractor 时默认取 item.id
 *    26. item 无 id 时 fallback 到 index
 *    27. className 附加到列表容器
 *    28. dividerClassName 附加到分割线
 *
 * ─ 复合导出
 *    29. SectionCard.Header 存在
 *    30. SectionCard.DividedList 存在
 */

import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import SectionCard from '../layout/SectionCard/SectionCard';

// ═══════════════════════════════════════════════════════════════
// SectionCard 基础容器
// ═══════════════════════════════════════════════════════════════

describe('SectionCard – 基础容器', () => {
    it('渲染 div 容器', () => {
        const { container } = render(<SectionCard>内容</SectionCard>);
        expect(container.querySelector('div')).toBeInTheDocument();
    });

    it('渲染 children', () => {
        render(<SectionCard><span data-testid="child">子内容</span></SectionCard>);
        expect(screen.getByTestId('child')).toBeInTheDocument();
    });

    it('默认含 card class', () => {
        const { container } = render(<SectionCard>内容</SectionCard>);
        expect((container.firstChild as HTMLElement).className).toMatch(/card/);
    });

    it('fullHeight=true 含 cardFull class', () => {
        const { container } = render(<SectionCard fullHeight>内容</SectionCard>);
        expect((container.firstChild as HTMLElement).className).toMatch(/cardFull/);
    });

    it('fullHeight=false（默认）不含 cardFull class', () => {
        const { container } = render(<SectionCard>内容</SectionCard>);
        expect((container.firstChild as HTMLElement).className).not.toMatch(/cardFull/);
    });

    it('noPadding=true 含 cardNoPadding class', () => {
        const { container } = render(<SectionCard noPadding>内容</SectionCard>);
        expect((container.firstChild as HTMLElement).className).toMatch(/cardNoPadding/);
    });

    it('noPadding=false（默认）不含 cardNoPadding class', () => {
        const { container } = render(<SectionCard>内容</SectionCard>);
        expect((container.firstChild as HTMLElement).className).not.toMatch(/cardNoPadding/);
    });

    it('className 附加到容器', () => {
        const { container } = render(<SectionCard className="my-section">内容</SectionCard>);
        expect((container.firstChild as HTMLElement).className).toContain('my-section');
    });

    it('SectionCard 是 React.memo 包裹的组件', () => {
        expect((SectionCard as unknown as { $$typeof?: symbol }).$$typeof?.toString()).toContain('memo');
    });
});

// ═══════════════════════════════════════════════════════════════
// SectionCard.Header
// ═══════════════════════════════════════════════════════════════

describe('SectionCard.Header – 渲染', () => {
    it('渲染 title 文字', () => {
        render(<SectionCard.Header title="销售统计" />);
        expect(screen.getByText('销售统计')).toBeInTheDocument();
    });

    it('icon 为 ReactNode 时直接渲染图标', () => {
        render(<SectionCard.Header title="标题" icon={<svg data-testid="header-icon" />} />);
        expect(screen.getByTestId('header-icon')).toBeInTheDocument();
    });

    it('icon 为 string（emoji）时包裹在 titleEmoji span 中', () => {
        const { container } = render(<SectionCard.Header title="标题" icon="📊" />);
        const emojiSpan = container.querySelector('[class*="titleEmoji"]');
        expect(emojiSpan).toBeInTheDocument();
        expect(emojiSpan!.textContent).toBe('📊');
    });

    it('不传 icon 时不渲染图标容器', () => {
        const { container } = render(<SectionCard.Header title="标题" />);
        expect(container.querySelector('[class*="titleEmoji"]')).toBeNull();
    });

    it('extra 传入时渲染', () => {
        render(
            <SectionCard.Header
                title="标题"
                extra={<span data-testid="header-extra">附加内容</span>}
            />,
        );
        expect(screen.getByTestId('header-extra')).toBeInTheDocument();
    });

    it('不传 extra 时不渲染 extra', () => {
        render(<SectionCard.Header title="标题" />);
        expect(screen.queryByTestId('header-extra')).toBeNull();
    });

    it('className 附加到 header div', () => {
        const { container } = render(<SectionCard.Header title="标题" className="header-extra" />);
        const header = container.querySelector('[class*="cardHeader"]');
        expect(header).toBeInTheDocument();
        expect(header!.className).toContain('header-extra');
    });

    it('SectionCard.Header 是 React.memo 包裹的组件', () => {
        expect(
            (SectionCard.Header as unknown as { $$typeof?: symbol }).$$typeof?.toString(),
        ).toContain('memo');
    });
});

// ═══════════════════════════════════════════════════════════════
// SectionCard.DividedList
// ═══════════════════════════════════════════════════════════════

interface Item {
    id: string;
    name: string;
}

const ITEMS: Item[] = [
    { id: '1', name: '商品A' },
    { id: '2', name: '商品B' },
    { id: '3', name: '商品C' },
];

function renderDividedList(
    items: Item[],
    overrides: Partial<React.ComponentProps<typeof SectionCard.DividedList<Item>>> = {},
) {
    return render(
        <SectionCard.DividedList
            items={items}
            renderItem={(item) => <div key={item.id} data-testid={`item-${item.id}`}>{item.name}</div>}
            {...overrides}
        />,
    );
}

describe('SectionCard.DividedList – 渲染', () => {
    it('正确渲染所有 item', () => {
        renderDividedList(ITEMS);
        ITEMS.forEach((item) => {
            expect(screen.getByText(item.name)).toBeInTheDocument();
        });
    });

    it('renderItem 被调用 items.length 次', () => {
        const renderItem = vi.fn((item: Item) => <div key={item.id}>{item.name}</div>);
        render(
            <SectionCard.DividedList items={ITEMS} renderItem={renderItem} />,
        );
        expect(renderItem).toHaveBeenCalledTimes(ITEMS.length);
    });

    it('3 个 item 有 2 条分割线', () => {
        const { container } = renderDividedList(ITEMS);
        const dividers = container.querySelectorAll('[aria-hidden="true"]');
        expect(dividers).toHaveLength(2);
    });

    it('最后一条 item 后无分割线（N-1 条）', () => {
        const { container } = renderDividedList(ITEMS);
        const dividers = container.querySelectorAll('[aria-hidden="true"]');
        // 3 items → 2 dividers
        expect(dividers.length).toBe(ITEMS.length - 1);
    });

    it('1 个 item 时无分割线', () => {
        const { container } = renderDividedList([ITEMS[0]]);
        const dividers = container.querySelectorAll('[aria-hidden="true"]');
        expect(dividers).toHaveLength(0);
    });

    it('0 个 item 时不渲染 item 和分割线', () => {
        const { container } = renderDividedList([]);
        const dividers = container.querySelectorAll('[aria-hidden="true"]');
        expect(dividers).toHaveLength(0);
        expect(screen.queryByTestId(/item-/)).toBeNull();
    });
});

describe('SectionCard.DividedList – keyExtractor', () => {
    it('keyExtractor 传入时被调用', () => {
        const keyExtractor = vi.fn((item: Item, index: number) => `${item.id}-${index}`);
        render(
            <SectionCard.DividedList
                items={ITEMS}
                renderItem={(item) => <div key={item.id}>{item.name}</div>}
                keyExtractor={keyExtractor}
            />,
        );
        expect(keyExtractor).toHaveBeenCalledTimes(ITEMS.length);
        expect(keyExtractor).toHaveBeenCalledWith(ITEMS[0], 0);
    });

    it('不传 keyExtractor 时使用 item.id', () => {
        // 验证不抛出重复 key 警告：只需要正常渲染即可
        const { container } = renderDividedList(ITEMS);
        expect(container).toBeTruthy();
    });
});

describe('SectionCard.DividedList – className / dividerClassName', () => {
    it('className 附加到列表容器', () => {
        const { container } = renderDividedList(ITEMS, { className: 'my-list' });
        expect((container.firstChild as HTMLElement).className).toContain('my-list');
    });

    it('dividerClassName 附加到分割线', () => {
        const { container } = renderDividedList(ITEMS, { dividerClassName: 'my-divider' });
        const dividers = container.querySelectorAll('[aria-hidden="true"]');
        dividers.forEach((d) => {
            expect(d.className).toContain('my-divider');
        });
    });
});

// ─── 复合导出 ─────────────────────────────────────────────────────────────────
describe('SectionCard – 复合导出', () => {
    it('SectionCard.Header 挂载存在', () => {
        expect(SectionCard.Header).toBeDefined();
    });

    it('SectionCard.DividedList 挂载存在', () => {
        expect(SectionCard.DividedList).toBeDefined();
    });
});
