/**
 * PageHeader 组件单元测试
 *
 * 覆盖范围：
 *  ─ 基本渲染
 *    1.  渲染 header 元素
 *    2.  渲染返回按钮（aria-label="返回"）
 *    3.  返回按钮具有 type="button"
 *    4.  返回按钮内含 svg 图标
 *  ─ title
 *    5.  传入 title 时渲染 h1 标题
 *    6.  title 文本内容正确
 *    7.  不传 title 时不渲染 h1
 *    8.  不传 title 时不渲染右侧占位区域
 *    9.  传入 title 时渲染右侧 div 占位
 *  ─ rightExtra
 *    10. 传入 rightExtra 时在右侧渲染内容
 *    11. 不传 rightExtra 时右侧区域为空（div 存在但无内容）
 *  ─ variant 样式
 *    12. 默认 variant 为 sticky（含 header class）
 *    13. variant="transparent" 含 headerTransparent class
 *    14. variant="absolute" 含 headerAbsolute class
 *    15. variant="relative" 含 headerRelative class
 *  ─ 返回逻辑
 *    16. 传入 onBack 时点击返回按钮触发 onBack
 *    17. 传入 onBack 时不调用 navigate(-1)
 *    18. 不传 onBack 时点击返回按钮调用 navigate(-1)
 *  ─ React.memo
 *    19. PageHeader 是 React.memo 包裹的组件
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import PageHeader from '../PageHeader/index';

// ─────────────────────────────────────────────────────────────────────────────
// mock react-router-dom useNavigate
// ─────────────────────────────────────────────────────────────────────────────
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async (importOriginal) => {
    const actual = await importOriginal<typeof import('react-router-dom')>();
    return {
        ...actual,
        useNavigate: () => mockNavigate,
    };
});

beforeEach(() => {
    mockNavigate.mockReset();
});

// ─────────────────────────────────────────────────────────────────────────────
// 辅助：包裹 MemoryRouter 渲染 PageHeader
// ─────────────────────────────────────────────────────────────────────────────
function renderHeader(overrides: Partial<React.ComponentProps<typeof PageHeader>> = {}) {
    return render(
        <MemoryRouter>
            <PageHeader {...overrides} />
        </MemoryRouter>,
    );
}

// ─── 1. 基本渲染 ──────────────────────────────────────────────────────────────
describe('PageHeader – 基本渲染', () => {
    it('渲染 header 元素', () => {
        renderHeader();
        expect(screen.getByRole('banner')).toBeInTheDocument();
    });

    it('渲染返回按钮（aria-label="返回"）', () => {
        renderHeader();
        expect(screen.getByRole('button', { name: '返回' })).toBeInTheDocument();
    });

    it('返回按钮具有 type="button"', () => {
        renderHeader();
        expect(screen.getByRole('button', { name: '返回' })).toHaveAttribute('type', 'button');
    });

    it('返回按钮内含 svg 图标', () => {
        const { container } = renderHeader();
        const backBtn = screen.getByRole('button', { name: '返回' });
        expect(backBtn.querySelector('svg')).toBeInTheDocument();
    });
});

// ─── 2. title ────────────────────────────────────────────────────────────────
describe('PageHeader – title', () => {
    it('传入 title 时渲染 h1 标题', () => {
        renderHeader({ title: '修改密码' });
        expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
    });

    it('title 文本内容正确', () => {
        renderHeader({ title: '修改密码' });
        expect(screen.getByText('修改密码')).toBeInTheDocument();
    });

    it('不传 title 时不渲染 h1', () => {
        renderHeader();
        expect(screen.queryByRole('heading')).toBeNull();
    });

    it('不传 title 时不渲染右侧占位区域', () => {
        const { container } = renderHeader();
        const header = screen.getByRole('banner');
        // header 中只有返回按钮，没有右侧 div
        const children = Array.from(header.children);
        expect(children).toHaveLength(1); // 只有 backBtn
    });

    it('传入 title 时渲染右侧 div 占位', () => {
        const { container } = renderHeader({ title: '测试' });
        const header = screen.getByRole('banner');
        const children = Array.from(header.children);
        // backBtn + h1 + right div = 3个子节点
        expect(children).toHaveLength(3);
    });
});

// ─── 3. rightExtra ────────────────────────────────────────────────────────────
describe('PageHeader – rightExtra', () => {
    it('传入 rightExtra 时在右侧渲染内容', () => {
        renderHeader({
            title: '成本管理',
            rightExtra: <button type="button" aria-label="添加">+</button>,
        });
        expect(screen.getByRole('button', { name: '添加' })).toBeInTheDocument();
    });

    it('不传 rightExtra 时右侧区域为空（div 存在但无子节点）', () => {
        const { container } = renderHeader({ title: '测试' });
        const header = screen.getByRole('banner');
        const rightDiv = Array.from(header.children).find((el) =>
            el.tagName === 'DIV',
        ) as HTMLElement;
        expect(rightDiv).toBeTruthy();
        expect(rightDiv.children).toHaveLength(0);
    });
});

// ─── 4. variant 样式 ──────────────────────────────────────────────────────────
describe('PageHeader – variant 样式', () => {
    it('默认 variant 为 sticky（含 header class 而非 headerTransparent/headerAbsolute/headerRelative）', () => {
        renderHeader();
        const header = screen.getByRole('banner');
        expect(header.className).not.toMatch(/headerTransparent/);
        expect(header.className).not.toMatch(/headerAbsolute/);
        expect(header.className).not.toMatch(/headerRelative/);
    });

    it('variant="transparent" 含 headerTransparent class', () => {
        renderHeader({ variant: 'transparent' });
        const header = screen.getByRole('banner');
        expect(header.className).toMatch(/headerTransparent/);
    });

    it('variant="absolute" 含 headerAbsolute class', () => {
        renderHeader({ variant: 'absolute' });
        const header = screen.getByRole('banner');
        expect(header.className).toMatch(/headerAbsolute/);
    });

    it('variant="relative" 含 headerRelative class', () => {
        renderHeader({ variant: 'relative' });
        const header = screen.getByRole('banner');
        expect(header.className).toMatch(/headerRelative/);
    });
});

// ─── 5. 返回逻辑 ─────────────────────────────────────────────────────────────
describe('PageHeader – 返回逻辑', () => {
    it('传入 onBack 时点击返回按钮触发 onBack', async () => {
        const user = userEvent.setup();
        const onBack = vi.fn();
        renderHeader({ onBack });
        await user.click(screen.getByRole('button', { name: '返回' }));
        expect(onBack).toHaveBeenCalledTimes(1);
    });

    it('传入 onBack 时不调用 navigate', async () => {
        const user = userEvent.setup();
        const onBack = vi.fn();
        renderHeader({ onBack });
        await user.click(screen.getByRole('button', { name: '返回' }));
        expect(mockNavigate).not.toHaveBeenCalled();
    });

    it('不传 onBack 时点击返回按钮调用 navigate(-1)', async () => {
        const user = userEvent.setup();
        renderHeader();
        await user.click(screen.getByRole('button', { name: '返回' }));
        expect(mockNavigate).toHaveBeenCalledWith(-1);
    });

    it('不传 onBack 时 navigate 仅调用一次', async () => {
        const user = userEvent.setup();
        renderHeader();
        await user.click(screen.getByRole('button', { name: '返回' }));
        expect(mockNavigate).toHaveBeenCalledTimes(1);
    });
});

// ─── 6. React.memo ────────────────────────────────────────────────────────────
describe('PageHeader – React.memo', () => {
    it('PageHeader 是 React.memo 包裹的组件', () => {
        expect((PageHeader as unknown as { $$typeof?: symbol }).$$typeof?.toString()).toContain('memo');
    });
});
