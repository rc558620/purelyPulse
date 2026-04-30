/**
 * Button 组件单元测试
 *
 * 覆盖范围：
 *  ─ 基本渲染
 *    1.  渲染 button 元素
 *    2.  children 内容正常展示
 *    3.  type 默认为 "button"
 *    4.  type="submit" 正常透传
 *  ─ variant 样式
 *    5.  默认 variant 为 primary（含 variant-primary class）
 *    6.  variant="secondary" 添加 secondary class
 *    7.  variant="ghost" 添加 ghost class
 *  ─ size 样式
 *    8.  默认 size 为 lg（含 size-lg class）
 *    9.  size="md" 添加 size-md class
 *  ─ block 样式
 *    10. block=true（默认）含 block class
 *    11. block=false 不含 block class
 *  ─ loading 状态
 *    12. loading=false 时不渲染 Spinner，直接渲染 children
 *    13. loading=true 时渲染 Spinner（svg 元素）
 *    14. loading=true 时渲染 children（包裹在 loadingRow 内）
 *    15. loading=true 时按钮被禁用（disabled 属性）
 *    16. loading=true 时 loading class 被应用
 *    17. loading=true 时即使 disabled=false 按钮也被禁用
 *  ─ disabled
 *    18. disabled=true 时按钮被禁用
 *    19. disabled=false（默认）时按钮不被禁用
 *    20. disabled=true 且 loading=true 时仍然禁用
 *  ─ 点击事件
 *    21. 正常状态下点击触发 onClick
 *    22. disabled 状态下点击不触发 onClick
 *    23. loading 状态下点击不触发 onClick
 *  ─ className 透传
 *    24. 自定义 className 被附加到 button 上
 *  ─ 其他 HTML 属性透传
 *    25. aria-label 透传
 *    26. data-testid 透传
 *    27. form 属性透传
 *  ─ React.memo
 *    28. Button 是 React.memo 包裹的组件
 *  ─ Spinner
 *    29. Spinner 具有 aria-hidden="true"
 */

import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Button from '../action/Button/Button';

// ─────────────────────────────────────────────────────────────────────────────
// 辅助函数：渲染带默认 props 的 Button
// ─────────────────────────────────────────────────────────────────────────────
function renderButton(overrides: Partial<React.ComponentProps<typeof Button>> = {}) {
    const defaults = { children: '点击我' };
    return render(<Button {...defaults} {...overrides} />);
}

// ─── 1. 基本渲染 ──────────────────────────────────────────────────────────────
describe('Button – 基本渲染', () => {
    it('渲染 button 元素', () => {
        renderButton();
        expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('children 内容正常展示', () => {
        renderButton({ children: '提交' });
        expect(screen.getByText('提交')).toBeInTheDocument();
    });

    it('type 默认为 "button"', () => {
        renderButton();
        expect(screen.getByRole('button')).toHaveAttribute('type', 'button');
    });

    it('type="submit" 正常透传', () => {
        renderButton({ type: 'submit' });
        expect(screen.getByRole('button')).toHaveAttribute('type', 'submit');
    });
});

// ─── 2. variant 样式 ──────────────────────────────────────────────────────────
describe('Button – variant 样式', () => {
    it('默认 variant 为 primary（含 variant-primary class）', () => {
        renderButton();
        expect(screen.getByRole('button').className).toMatch(/variant-primary/);
    });

    it('variant="secondary" 添加对应 class', () => {
        renderButton({ variant: 'secondary' });
        expect(screen.getByRole('button').className).toMatch(/variant-secondary/);
    });

    it('variant="ghost" 添加对应 class', () => {
        renderButton({ variant: 'ghost' });
        expect(screen.getByRole('button').className).toMatch(/variant-ghost/);
    });

    it('variant="primary" 时不含 secondary/ghost class', () => {
        renderButton({ variant: 'primary' });
        const cls = screen.getByRole('button').className;
        expect(cls).not.toMatch(/variant-secondary/);
        expect(cls).not.toMatch(/variant-ghost/);
    });
});

// ─── 3. size 样式 ─────────────────────────────────────────────────────────────
describe('Button – size 样式', () => {
    it('默认 size 为 lg（含 size-lg class）', () => {
        renderButton();
        expect(screen.getByRole('button').className).toMatch(/size-lg/);
    });

    it('size="md" 添加对应 class', () => {
        renderButton({ size: 'md' });
        expect(screen.getByRole('button').className).toMatch(/size-md/);
    });

    it('size="md" 时不含 size-lg class', () => {
        renderButton({ size: 'md' });
        expect(screen.getByRole('button').className).not.toMatch(/size-lg/);
    });
});

// ─── 4. block 样式 ────────────────────────────────────────────────────────────
describe('Button – block 样式', () => {
    it('block=true（默认）含 block class', () => {
        renderButton();
        expect(screen.getByRole('button').className).toMatch(/block/);
    });

    it('block=false 不含 block class', () => {
        renderButton({ block: false });
        // 用精确匹配避免 "btn" 等命中
        const cls = screen.getByRole('button').className;
        // 不应有单独的 "block" class（但 "block" 可能出现在 "btn" 子字符串中，故用 \bblock\b 匹配单词边界逻辑）
        // CSS Module 处理后 class 为 "Block_xxxx" 形式或不含，直接检查不含对应 class 即可
        const parts = cls.split(/\s+/);
        expect(parts.some(p => /^block$/i.test(p) || /Block/.test(p))).toBe(false);
    });
});

// ─── 5. loading 状态 ──────────────────────────────────────────────────────────
describe('Button – loading 状态', () => {
    it('loading=false 时不渲染 SVG spinner', () => {
        const { container } = renderButton({ loading: false });
        expect(container.querySelector('svg')).toBeNull();
    });

    it('loading=true 时渲染 Spinner（svg 元素）', () => {
        const { container } = renderButton({ loading: true });
        expect(container.querySelector('svg')).toBeInTheDocument();
    });

    it('loading=true 时同时渲染 children', () => {
        renderButton({ loading: true, children: '加载中' });
        expect(screen.getByText('加载中')).toBeInTheDocument();
    });

    it('loading=true 时按钮被禁用', () => {
        renderButton({ loading: true });
        expect(screen.getByRole('button')).toBeDisabled();
    });

    it('loading=true 时 loading class 被应用', () => {
        renderButton({ loading: true });
        expect(screen.getByRole('button').className).toMatch(/loading/);
    });

    it('loading=false 时不含 loading class', () => {
        renderButton({ loading: false });
        expect(screen.getByRole('button').className).not.toMatch(/loading/);
    });

    it('Spinner svg 具有 aria-hidden="true"', () => {
        const { container } = renderButton({ loading: true });
        const svg = container.querySelector('svg');
        expect(svg).toHaveAttribute('aria-hidden', 'true');
    });
});

// ─── 6. disabled 状态 ────────────────────────────────────────────────────────
describe('Button – disabled 状态', () => {
    it('disabled=true 时按钮被禁用', () => {
        renderButton({ disabled: true });
        expect(screen.getByRole('button')).toBeDisabled();
    });

    it('disabled=false（默认）时按钮不被禁用', () => {
        renderButton();
        expect(screen.getByRole('button')).not.toBeDisabled();
    });

    it('disabled=true 且 loading=true 时仍然禁用', () => {
        renderButton({ disabled: true, loading: true });
        expect(screen.getByRole('button')).toBeDisabled();
    });
});

// ─── 7. 点击事件 ──────────────────────────────────────────────────────────────
describe('Button – 点击事件', () => {
    it('正常状态下点击触发 onClick', async () => {
        const user = userEvent.setup();
        const onClick = vi.fn();
        renderButton({ onClick });
        await user.click(screen.getByRole('button'));
        expect(onClick).toHaveBeenCalledTimes(1);
    });

    it('disabled 状态下点击不触发 onClick', async () => {
        const user = userEvent.setup();
        const onClick = vi.fn();
        renderButton({ disabled: true, onClick });
        await user.click(screen.getByRole('button'));
        expect(onClick).not.toHaveBeenCalled();
    });

    it('loading 状态下点击不触发 onClick', async () => {
        const user = userEvent.setup();
        const onClick = vi.fn();
        renderButton({ loading: true, onClick });
        await user.click(screen.getByRole('button'));
        expect(onClick).not.toHaveBeenCalled();
    });
});

// ─── 8. className 透传 ────────────────────────────────────────────────────────
describe('Button – className 透传', () => {
    it('自定义 className 被附加到 button 上', () => {
        renderButton({ className: 'custom-btn' });
        expect(screen.getByRole('button').className).toContain('custom-btn');
    });

    it('自定义 className 与内置 class 共存', () => {
        renderButton({ className: 'extra' });
        const cls = screen.getByRole('button').className;
        expect(cls).toContain('extra');
        expect(cls).toMatch(/variant-primary/);
    });
});

// ─── 9. 其他 HTML 属性透传 ────────────────────────────────────────────────────
describe('Button – HTML 属性透传', () => {
    it('aria-label 透传', () => {
        renderButton({ 'aria-label': '提交表单' });
        expect(screen.getByRole('button', { name: '提交表单' })).toBeInTheDocument();
    });

    it('data-testid 透传', () => {
        renderButton({ 'data-testid': 'my-btn' } as React.ComponentProps<typeof Button>);
        expect(screen.getByTestId('my-btn')).toBeInTheDocument();
    });

    it('tabIndex 透传', () => {
        renderButton({ tabIndex: 3 });
        expect(screen.getByRole('button')).toHaveAttribute('tabindex', '3');
    });
});

// ─── 10. React.memo ───────────────────────────────────────────────────────────
describe('Button – React.memo', () => {
    it('Button 是 React.memo 包裹的组件', () => {
        expect((Button as unknown as { $$typeof?: symbol }).$$typeof?.toString()).toContain('memo');
    });
});
