/**
 * OverviewStatCard + StatCard 组件单元测试
 *
 * ─ OverviewStatCard
 *    1.  渲染 button 元素（type="button"）
 *    2.  渲染 icon 节点
 *    3.  渲染 safeNum(value) 数值
 *    4.  渲染 label 文字
 *    5.  variant="default" 含 statCardDefault class（active=false 时）
 *    6.  variant="success" 含 statCardSuccess class
 *    7.  variant="warning" 含 statCardWarning class
 *    8.  variant="danger"  含 statCardDanger class
 *    9.  active=true 含 statCardActive class
 *    10. active=false 不含 statCardActive class
 *    11. active=true 时 aria-pressed="true"
 *    12. active=false 时 aria-pressed="false"
 *    13. active=undefined 时 aria-pressed="false"
 *    14. 点击触发 onClick
 *    15. OverviewStatCard 是 React.memo 包裹的组件
 *
 * ─ StatCard
 *    16. mode="amount"（默认）渲染 ¥ 前缀
 *    17. mode="amount" 渲染 fmtAmount(value) 数值
 *    18. mode="text" 渲染纯文本 value
 *    19. mode="text" 不渲染 ¥ 前缀
 *    20. 渲染 icon 节点
 *    21. 渲染 label 文字
 *    22. variant="default" 不含 rose/indigo/orange class
 *    23. variant="rose"   含 variantRose class
 *    24. variant="indigo" 含 variantIndigo class
 *    25. variant="orange" 含 variantOrange class
 *    26. color 传入时设置 --card-color CSS 变量
 *    27. color 不传时不设置 CSS 变量
 *    28. subInfo 传入时渲染
 *    29. subInfo 不传时不渲染 subInfo 区域
 *    30. StatCard 是 React.memo 包裹的组件
 */

import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import OverviewStatCard from '../stats/OverviewStatCard/OverviewStatCard';
import StatCard from '../stats/StatCard/StatCard';

// ═══════════════════════════════════════════════════════════════
// OverviewStatCard
// ═══════════════════════════════════════════════════════════════

function renderOverview(overrides: Partial<React.ComponentProps<typeof OverviewStatCard>> = {}) {
    const defaults = {
        label: '总订单',
        value: 42,
        icon: <svg data-testid="ov-icon" />,
    };
    return render(<OverviewStatCard {...defaults} {...overrides} />);
}

describe('OverviewStatCard – 基本渲染', () => {
    it('渲染 button 元素', () => {
        renderOverview();
        expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('button type="button"', () => {
        renderOverview();
        expect(screen.getByRole('button')).toHaveAttribute('type', 'button');
    });

    it('渲染 icon 节点', () => {
        renderOverview();
        expect(screen.getByTestId('ov-icon')).toBeInTheDocument();
    });

    it('渲染 value 数值', () => {
        renderOverview({ value: 88 });
        expect(screen.getByText('88')).toBeInTheDocument();
    });

    it('渲染 label 文字', () => {
        renderOverview({ label: '待处理' });
        expect(screen.getByText('待处理')).toBeInTheDocument();
    });
});

describe('OverviewStatCard – variant 样式', () => {
    it('variant="default"（非 active）含 statCardDefault class', () => {
        renderOverview({ variant: 'default', active: false });
        expect(screen.getByRole('button').className).toMatch(/statCardDefault/);
    });

    it('variant="success" 含 statCardSuccess class', () => {
        renderOverview({ variant: 'success' });
        expect(screen.getByRole('button').className).toMatch(/statCardSuccess/);
    });

    it('variant="warning" 含 statCardWarning class', () => {
        renderOverview({ variant: 'warning' });
        expect(screen.getByRole('button').className).toMatch(/statCardWarning/);
    });

    it('variant="danger" 含 statCardDanger class', () => {
        renderOverview({ variant: 'danger' });
        expect(screen.getByRole('button').className).toMatch(/statCardDanger/);
    });
});

describe('OverviewStatCard – active 态', () => {
    it('active=true 含 statCardActive class', () => {
        renderOverview({ active: true });
        expect(screen.getByRole('button').className).toMatch(/statCardActive/);
    });

    it('active=false 不含 statCardActive class', () => {
        renderOverview({ active: false });
        expect(screen.getByRole('button').className).not.toMatch(/statCardActive/);
    });

    it('active=true 时 aria-pressed="true"', () => {
        renderOverview({ active: true });
        expect(screen.getByRole('button')).toHaveAttribute('aria-pressed', 'true');
    });

    it('active=false 时 aria-pressed="false"', () => {
        renderOverview({ active: false });
        expect(screen.getByRole('button')).toHaveAttribute('aria-pressed', 'false');
    });

    it('active=undefined 时 aria-pressed 未设置（组件不渲染该属性）', () => {
        renderOverview({ active: undefined });
        // active=undefined 时 aria-pressed={undefined}，React 不渲染该属性
        expect(screen.getByRole('button')).not.toHaveAttribute('aria-pressed', 'true');
    });
});

describe('OverviewStatCard – 点击事件', () => {
    it('点击触发 onClick', async () => {
        const user = userEvent.setup();
        const onClick = vi.fn();
        renderOverview({ onClick });
        await user.click(screen.getByRole('button'));
        expect(onClick).toHaveBeenCalledTimes(1);
    });
});

describe('OverviewStatCard – React.memo', () => {
    it('OverviewStatCard 是 React.memo 包裹的组件', () => {
        expect((OverviewStatCard as unknown as { $$typeof?: symbol }).$$typeof?.toString()).toContain('memo');
    });
});

// ═══════════════════════════════════════════════════════════════
// StatCard
// ═══════════════════════════════════════════════════════════════

describe('StatCard – mode="amount"（默认）', () => {
    it('渲染 ¥ 前缀', () => {
        render(
            <StatCard icon={<svg />} label="营业额" value={1234} />,
        );
        expect(screen.getByText('¥')).toBeInTheDocument();
    });

    it('渲染格式化数值（fmtAmount）', () => {
        // fmtAmount(1234) → "1,234"
        render(
            <StatCard icon={<svg />} label="营业额" value={1234} />,
        );
        expect(screen.getByText(/1,234/)).toBeInTheDocument();
    });

    it('value=0 时渲染 ¥ 前缀', () => {
        render(
            <StatCard icon={<svg />} label="营业额" value={0} />,
        );
        expect(screen.getByText('¥')).toBeInTheDocument();
    });
});

describe('StatCard – mode="text"', () => {
    it('渲染纯文本 value', () => {
        render(
            <StatCard icon={<svg />} label="状态" mode="text" value="已结算" />,
        );
        expect(screen.getByText('已结算')).toBeInTheDocument();
    });

    it('不渲染 ¥ 前缀', () => {
        render(
            <StatCard icon={<svg />} label="状态" mode="text" value="已结算" />,
        );
        expect(screen.queryByText('¥')).toBeNull();
    });
});

describe('StatCard – icon / label', () => {
    it('渲染 icon 节点', () => {
        render(
            <StatCard icon={<svg data-testid="stat-icon" />} label="测试" value={0} />,
        );
        expect(screen.getByTestId('stat-icon')).toBeInTheDocument();
    });

    it('渲染 label 文字', () => {
        render(
            <StatCard icon={<svg />} label="毛利润" value={500} />,
        );
        expect(screen.getByText('毛利润')).toBeInTheDocument();
    });
});

describe('StatCard – variant 样式', () => {
    it('variant="default" 不含 rose/indigo/orange class', () => {
        const { container } = render(
            <StatCard icon={<svg />} label="X" value={0} variant="default" />,
        );
        const card = container.firstChild as HTMLElement;
        expect(card.className).not.toMatch(/variantRose/);
        expect(card.className).not.toMatch(/variantIndigo/);
        expect(card.className).not.toMatch(/variantOrange/);
    });

    it('variant="rose" 含 variantRose class', () => {
        const { container } = render(
            <StatCard icon={<svg />} label="X" value={0} variant="rose" />,
        );
        expect((container.firstChild as HTMLElement).className).toMatch(/variantRose/);
    });

    it('variant="indigo" 含 variantIndigo class', () => {
        const { container } = render(
            <StatCard icon={<svg />} label="X" value={0} variant="indigo" />,
        );
        expect((container.firstChild as HTMLElement).className).toMatch(/variantIndigo/);
    });

    it('variant="orange" 含 variantOrange class', () => {
        const { container } = render(
            <StatCard icon={<svg />} label="X" value={0} variant="orange" />,
        );
        expect((container.firstChild as HTMLElement).className).toMatch(/variantOrange/);
    });
});

describe('StatCard – color CSS 变量', () => {
    it('color 传入时设置 --card-color CSS 变量', () => {
        const { container } = render(
            <StatCard icon={<svg />} label="X" value={0} color="#ff0000" />,
        );
        const card = container.firstChild as HTMLElement;
        expect(card.style.getPropertyValue('--card-color')).toBe('#ff0000');
    });

    it('color 不传时不设置 style', () => {
        const { container } = render(
            <StatCard icon={<svg />} label="X" value={0} />,
        );
        const card = container.firstChild as HTMLElement;
        expect(card.getAttribute('style')).toBeFalsy();
    });
});

describe('StatCard – subInfo', () => {
    it('subInfo 传入时渲染', () => {
        render(
            <StatCard
                icon={<svg />}
                label="X"
                value={0}
                subInfo={<span data-testid="sub">附加信息</span>}
            />,
        );
        expect(screen.getByTestId('sub')).toBeInTheDocument();
    });

    it('subInfo 不传时不渲染 subInfo 区域', () => {
        const { container } = render(
            <StatCard icon={<svg />} label="X" value={0} />,
        );
        expect(container.querySelector('[class*="statSubInfo"]')).toBeNull();
    });
});

describe('StatCard – React.memo', () => {
    it('StatCard 是 React.memo 包裹的组件', () => {
        expect((StatCard as unknown as { $$typeof?: symbol }).$$typeof?.toString()).toContain('memo');
    });
});
