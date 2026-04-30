/**
 * TrendBadge 组件单元测试
 *
 * 覆盖范围：
 *  ─ 空值处理
 *    1.  value=null 时返回 null（不渲染任何 DOM）
 *    2.  value=undefined 时返回 null
 *    3.  compareLastMonth=null 时返回 null
 *    4.  三个 prop 均为 undefined 时返回 null
 *  ─ 值优先级
 *    5.  value 优先于 compareLastMonth
 *    6.  compareLastMonth 优先于 compareLastPeriod
 *    7.  value=undefined 时回退到 compareLastMonth
 *    8.  value/compareLastMonth 均 undefined 时回退到 compareLastPeriod
 *  ─ 涨跌显示（默认 invertColor=false）
 *    9.  value > 0 时渲染 + 号前缀
 *    10. value < 0 时不渲染 + 号前缀
 *    11. value > 0 时含 up（绿色）class
 *    12. value < 0 时含 down（红色）class
 *    13. value = 0 时含 neutral class
 *  ─ invertColor=true（成本场景）
 *    14. invertColor=true，value>0 时含 down class（涨价为坏=红）
 *    15. invertColor=true，value<0 时含 up class（降价为好=绿）
 *    16. invertColor=true，value=0 时仍含 neutral class
 *  ─ 数值格式化
 *    17. 正数保留 1 位小数，如 12.5 → "12.5"
 *    18. 负数取绝对值后保留 1 位小数，如 -3.2 → "3.2"
 *    19. 整数添加 ".0"，如 5 → "5.0"
 *  ─ suffix
 *    20. 默认 suffix 为"较上期"
 *    21. 自定义 suffix 渲染正确
 *    22. suffix="" 时不渲染 suffix span
 *  ─ className 透传
 *    23. className 附加到 span 容器
 *  ─ React.memo
 *    24. TrendBadge 是 React.memo 包裹的组件
 */

import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import TrendBadge from '../data-display/TrendBadge/TrendBadge';

// ─────────────────────────────────────────────────────────────────────────────
// 辅助函数
// ─────────────────────────────────────────────────────────────────────────────
function renderBadge(overrides: Partial<React.ComponentProps<typeof TrendBadge>> = {}) {
    return render(<TrendBadge {...overrides} />);
}

// ─── 1. 空值处理 ──────────────────────────────────────────────────────────────
describe('TrendBadge – 空值处理', () => {
    it('value=null 时不渲染任何 DOM', () => {
        const { container } = renderBadge({ value: null });
        expect(container.firstChild).toBeNull();
    });

    it('value=undefined 且无其他值时不渲染', () => {
        const { container } = renderBadge({ value: undefined });
        expect(container.firstChild).toBeNull();
    });

    it('compareLastMonth=null 且无 value 时不渲染', () => {
        const { container } = renderBadge({ compareLastMonth: null });
        expect(container.firstChild).toBeNull();
    });

    it('三个 prop 均为 undefined 时不渲染', () => {
        const { container } = renderBadge({});
        expect(container.firstChild).toBeNull();
    });
});

// ─── 2. 值优先级 ──────────────────────────────────────────────────────────────
describe('TrendBadge – 值优先级', () => {
    it('value 优先于 compareLastMonth（显示 value 对应数值）', () => {
        const { container } = renderBadge({ value: 10, compareLastMonth: 20 });
        expect(container.textContent).toContain('10.0');
        expect(container.textContent).not.toContain('20.0');
    });

    it('value=undefined 时回退到 compareLastMonth', () => {
        const { container } = renderBadge({ value: undefined, compareLastMonth: 15 });
        expect(container.textContent).toContain('15.0');
    });

    it('compareLastMonth 优先于 compareLastPeriod', () => {
        const { container } = renderBadge({ compareLastMonth: 8, compareLastPeriod: 30 });
        expect(container.textContent).toContain('8.0');
        expect(container.textContent).not.toContain('30.0');
    });

    it('value/compareLastMonth 均 undefined 时回退到 compareLastPeriod', () => {
        const { container } = renderBadge({ compareLastPeriod: 7 });
        expect(container.textContent).toContain('7.0');
    });
});

// ─── 3. 涨跌样式（invertColor=false）────────────────────────────────────────
describe('TrendBadge – 涨跌样式（invertColor=false）', () => {
    it('value > 0 时渲染 + 号前缀', () => {
        const { container } = renderBadge({ value: 5 });
        expect(container.textContent).toContain('+');
    });

    it('value < 0 时不渲染 + 号前缀', () => {
        const { container } = renderBadge({ value: -5 });
        expect(container.textContent).not.toContain('+');
    });

    it('value > 0 时含 up class（绿色方向）', () => {
        const { container } = renderBadge({ value: 10 });
        expect((container.firstChild as HTMLElement).className).toMatch(/up/);
    });

    it('value < 0 时含 down class（红色方向）', () => {
        const { container } = renderBadge({ value: -10 });
        expect((container.firstChild as HTMLElement).className).toMatch(/down/);
    });

    it('value = 0 时含 neutral class', () => {
        const { container } = renderBadge({ value: 0 });
        expect((container.firstChild as HTMLElement).className).toMatch(/neutral/);
    });
});

// ─── 4. invertColor=true ─────────────────────────────────────────────────────
describe('TrendBadge – invertColor=true（成本场景）', () => {
    it('invertColor=true，value>0 时含 down class（涨价为坏=红）', () => {
        const { container } = renderBadge({ value: 10, invertColor: true });
        expect((container.firstChild as HTMLElement).className).toMatch(/down/);
    });

    it('invertColor=true，value<0 时含 up class（降价为好=绿）', () => {
        const { container } = renderBadge({ value: -10, invertColor: true });
        expect((container.firstChild as HTMLElement).className).toMatch(/up/);
    });

    it('invertColor=true，value=0 时仍含 neutral class', () => {
        const { container } = renderBadge({ value: 0, invertColor: true });
        expect((container.firstChild as HTMLElement).className).toMatch(/neutral/);
    });
});

// ─── 5. 数值格式化 ────────────────────────────────────────────────────────────
describe('TrendBadge – 数值格式化', () => {
    it('正数 12.5 显示为 "+12.5%"', () => {
        const { container } = renderBadge({ value: 12.5 });
        expect(container.textContent).toContain('+12.5');
    });

    it('负数 -3.2 显示绝对值 "3.2%"', () => {
        const { container } = renderBadge({ value: -3.2 });
        expect(container.textContent).toContain('3.2');
        expect(container.textContent).not.toContain('-');
    });

    it('整数 5 显示为 "+5.0%"', () => {
        const { container } = renderBadge({ value: 5 });
        expect(container.textContent).toContain('5.0');
    });
});

// ─── 6. suffix ────────────────────────────────────────────────────────────────
describe('TrendBadge – suffix', () => {
    it('默认 suffix 为"较上期"', () => {
        renderBadge({ value: 5 });
        expect(screen.getByText('较上期')).toBeInTheDocument();
    });

    it('自定义 suffix 渲染正确', () => {
        renderBadge({ value: 5, suffix: '较昨日' });
        expect(screen.getByText('较昨日')).toBeInTheDocument();
    });

    it('suffix="" 时不渲染 suffix span', () => {
        renderBadge({ value: 5, suffix: '' });
        // suffix span 内容为空则不渲染（源码：suffix && <span>...）
        // 确认 "较上期" 或其他 suffix 文字不出现
        expect(screen.queryByText('较上期')).toBeNull();
    });
});

// ─── 7. className 透传 ────────────────────────────────────────────────────────
describe('TrendBadge – className 透传', () => {
    it('className 附加到 span 容器', () => {
        const { container } = renderBadge({ value: 5, className: 'my-badge' });
        expect((container.firstChild as HTMLElement).className).toContain('my-badge');
    });
});

// ─── 8. React.memo ────────────────────────────────────────────────────────────
describe('TrendBadge – React.memo', () => {
    it('TrendBadge 是 React.memo 包裹的组件', () => {
        expect((TrendBadge as unknown as { $$typeof?: symbol }).$$typeof?.toString()).toContain('memo');
    });
});
