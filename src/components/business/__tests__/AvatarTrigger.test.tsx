/**
 * AvatarTrigger 单元测试
 *
 * 覆盖范围：
 *  ─ 基本渲染
 *    1.  渲染 button 元素，role=button
 *    2.  aria-label 为「点击更换头像」
 *    3.  type="button"
 *  ─ 尺寸 style
 *    4.  默认 size=10 时 button style 为 width:10rem / height:10rem
 *    5.  自定义 size=8 时 style 为 width:8rem / height:8rem
 *    6.  size=5 边界值正确应用
 *  ─ 有头像（avatar prop）
 *    7.  传入 avatar URL 时渲染 img 元素
 *    8.  img src 为传入的 avatar 值
 *    9.  img alt 包含 name（默认「用户」）
 *    10. 传入 name="张三" 时 img alt 为「张三的头像」
 *    11. 有头像时不渲染占位图 svg
 *  ─ 无头像（avatar 为空）
 *    12. 无 avatar 时不渲染 img 元素
 *    13. 无 avatar 时渲染占位 svg 容器（IconAvatarPlaceholder）
 *    14. avatar 为空字符串时也渲染占位图
 *  ─ 编辑遮罩
 *    15. 渲染编辑遮罩 div（包含 aria-hidden="true"）
 *    16. 遮罩内有 IconAvatarEdit svg
 *  ─ 点击交互
 *    17. 点击 button 触发 onClick
 *    18. onClick 被触发 1 次
 *  ─ className 透传
 *    19. 自定义 className 被附加到 button
 *    20. 内置 class 与自定义 className 共存
 */

import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AvatarTrigger from '../AvatarUploader/AvatarTrigger';

// ─────────────────────────────────────────────────────────────────────────────
// 辅助：渲染带默认 props 的 AvatarTrigger
// ─────────────────────────────────────────────────────────────────────────────
function renderTrigger(overrides: Partial<React.ComponentProps<typeof AvatarTrigger>> = {}) {
    const defaults = { onClick: vi.fn() };
    return render(<AvatarTrigger {...defaults} {...overrides} />);
}

// ─── 1. 基本渲染 ──────────────────────────────────────────────────────────────
describe('AvatarTrigger – 基本渲染', () => {
    it('渲染 button 元素', () => {
        renderTrigger();
        expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('aria-label 为「点击更换头像」', () => {
        renderTrigger();
        expect(screen.getByRole('button', { name: '点击更换头像' })).toBeInTheDocument();
    });

    it('type="button"（防止表单意外提交）', () => {
        renderTrigger();
        expect(screen.getByRole('button')).toHaveAttribute('type', 'button');
    });
});

// ─── 2. 尺寸 style ────────────────────────────────────────────────────────────
describe('AvatarTrigger – 尺寸样式', () => {
    it('默认 size=10 时 button style width 为 10rem', () => {
        renderTrigger();
        const btn = screen.getByRole('button');
        expect(btn.style.width).toBe('10rem');
    });

    it('默认 size=10 时 button style height 为 10rem', () => {
        renderTrigger();
        const btn = screen.getByRole('button');
        expect(btn.style.height).toBe('10rem');
    });

    it('自定义 size=8 时 width/height 为 8rem', () => {
        renderTrigger({ size: 8 });
        const btn = screen.getByRole('button');
        expect(btn.style.width).toBe('8rem');
        expect(btn.style.height).toBe('8rem');
    });

    it('size=5 边界值正确应用', () => {
        renderTrigger({ size: 5 });
        const btn = screen.getByRole('button');
        expect(btn.style.width).toBe('5rem');
        expect(btn.style.height).toBe('5rem');
    });

    it('size=15 大尺寸正确应用', () => {
        renderTrigger({ size: 15 });
        const btn = screen.getByRole('button');
        expect(btn.style.width).toBe('15rem');
        expect(btn.style.height).toBe('15rem');
    });
});

// ─── 3. 有头像 ───────────────────────────────────────────────────────────────
describe('AvatarTrigger – 有 avatar 时', () => {
    const avatarUrl = 'https://example.com/avatar.jpg';

    it('传入 avatar 时渲染 img 元素', () => {
        renderTrigger({ avatar: avatarUrl });
        expect(screen.getByRole('img')).toBeInTheDocument();
    });

    it('img src 为传入的 avatar 值', () => {
        renderTrigger({ avatar: avatarUrl });
        expect(screen.getByRole('img')).toHaveAttribute('src', avatarUrl);
    });

    it('未传 name 时 img alt 默认为「用户的头像」', () => {
        renderTrigger({ avatar: avatarUrl });
        expect(screen.getByRole('img')).toHaveAttribute('alt', '用户的头像');
    });

    it('传入 name="张三" 时 img alt 为「张三的头像」', () => {
        renderTrigger({ avatar: avatarUrl, name: '张三' });
        expect(screen.getByRole('img')).toHaveAttribute('alt', '张三的头像');
    });

    it('有头像时不渲染占位 svg（avatarPlaceholder div）', () => {
        const { container } = renderTrigger({ avatar: avatarUrl });
        // 占位符容器（avatarPlaceholder class）不存在
        const placeholder = container.querySelector('[class*="avatarPlaceholder"]');
        expect(placeholder).toBeNull();
    });

    it('base64 DataURL avatar 正常渲染', () => {
        const base64 = 'data:image/png;base64,iVBORw0KGgo=';
        renderTrigger({ avatar: base64 });
        expect(screen.getByRole('img')).toHaveAttribute('src', base64);
    });
});

// ─── 4. 无头像 ────────────────────────────────────────────────────────────────
describe('AvatarTrigger – 无 avatar 时', () => {
    it('不渲染 img 元素', () => {
        renderTrigger();
        expect(screen.queryByRole('img')).toBeNull();
    });

    it('渲染占位容器（avatarPlaceholder class）', () => {
        const { container } = renderTrigger();
        const placeholder = container.querySelector('[class*="avatarPlaceholder"]');
        expect(placeholder).toBeInTheDocument();
    });

    it('占位容器内有 svg（IconAvatarPlaceholder）', () => {
        const { container } = renderTrigger();
        const placeholder = container.querySelector('[class*="avatarPlaceholder"]');
        expect(placeholder?.querySelector('svg')).toBeInTheDocument();
    });

    it('avatar 为空字符串时也渲染占位图', () => {
        renderTrigger({ avatar: '' });
        expect(screen.queryByRole('img')).toBeNull();
        const { container } = renderTrigger({ avatar: '' });
        expect(container.querySelector('[class*="avatarPlaceholder"]')).toBeInTheDocument();
    });
});

// ─── 5. 编辑遮罩 ──────────────────────────────────────────────────────────────
describe('AvatarTrigger – 编辑遮罩', () => {
    it('渲染编辑遮罩层（editOverlay class）', () => {
        const { container } = renderTrigger();
        expect(container.querySelector('[class*="editOverlay"]')).toBeInTheDocument();
    });

    it('遮罩层具有 aria-hidden="true"（无障碍隔离）', () => {
        const { container } = renderTrigger();
        const overlay = container.querySelector('[class*="editOverlay"]');
        expect(overlay).toHaveAttribute('aria-hidden', 'true');
    });

    it('遮罩层内有 svg（IconAvatarEdit 相机图标）', () => {
        const { container } = renderTrigger();
        const overlay = container.querySelector('[class*="editOverlay"]');
        expect(overlay?.querySelector('svg')).toBeInTheDocument();
    });
});

// ─── 6. 点击事件 ──────────────────────────────────────────────────────────────
describe('AvatarTrigger – 点击交互', () => {
    it('点击 button 触发 onClick', async () => {
        const user = userEvent.setup();
        const onClick = vi.fn();
        renderTrigger({ onClick });
        await user.click(screen.getByRole('button'));
        expect(onClick).toHaveBeenCalledTimes(1);
    });

    it('快速连续点击 onClick 被调用对应次数', async () => {
        const user = userEvent.setup();
        const onClick = vi.fn();
        renderTrigger({ onClick });
        const btn = screen.getByRole('button');
        await user.click(btn);
        await user.click(btn);
        expect(onClick).toHaveBeenCalledTimes(2);
    });
});

// ─── 7. className 透传 ────────────────────────────────────────────────────────
describe('AvatarTrigger – className 透传', () => {
    it('自定义 className 被附加到 button', () => {
        renderTrigger({ className: 'my-avatar-trigger' });
        expect(screen.getByRole('button')).toHaveClass('my-avatar-trigger');
    });

    it('自定义 className 与内置 class 共存', () => {
        renderTrigger({ className: 'extra-class' });
        const cls = screen.getByRole('button').className;
        expect(cls).toContain('extra-class');
        // 内置 avatarBtn class 也存在
        expect(cls).toMatch(/avatarBtn|avatar/i);
    });
});

// ─── 8. name 边界值 ────────────────────────────────────────────────────────────
describe('AvatarTrigger – name 边界值', () => {
    const avatarUrl = 'https://example.com/avatar.jpg';

    it('name="" 空字符串时 alt 为「的头像」（不崩溃）', () => {
        renderTrigger({ avatar: avatarUrl, name: '' });
        expect(screen.getByRole('img')).toHaveAttribute('alt', '的头像');
    });

    it('name 为长字符串时 alt 正确拼接', () => {
        renderTrigger({ avatar: avatarUrl, name: 'VeryLongUserName123456' });
        expect(screen.getByRole('img')).toHaveAttribute('alt', 'VeryLongUserName123456的头像');
    });

    it('name 含特殊字符时 alt 正确拼接', () => {
        renderTrigger({ avatar: avatarUrl, name: '用户<test>' });
        expect(screen.getByRole('img')).toHaveAttribute('alt', '用户<test>的头像');
    });
});

// ─── 9. 键盘交互 ──────────────────────────────────────────────────────────────
describe('AvatarTrigger – 键盘交互', () => {
    it('按 Enter 键触发 onClick', async () => {
        const user = userEvent.setup();
        const onClick = vi.fn();
        renderTrigger({ onClick });
        screen.getByRole('button').focus();
        await user.keyboard('{Enter}');
        expect(onClick).toHaveBeenCalledTimes(1);
    });

    it('按 Space 键触发 onClick', async () => {
        const user = userEvent.setup();
        const onClick = vi.fn();
        renderTrigger({ onClick });
        screen.getByRole('button').focus();
        await user.keyboard(' ');
        expect(onClick).toHaveBeenCalledTimes(1);
    });

    it('Tab 键可聚焦到 button', async () => {
        const user = userEvent.setup();
        renderTrigger();
        await user.tab();
        expect(screen.getByRole('button')).toHaveFocus();
    });
});

// ─── 10. 纯渲染无副作用 ───────────────────────────────────────────────────────
describe('AvatarTrigger – 纯渲染无副作用', () => {
    it('渲染时不调用 onClick', () => {
        const onClick = vi.fn();
        renderTrigger({ onClick });
        expect(onClick).not.toHaveBeenCalled();
    });

    it('props 不变时 rerender 不触发 onClick', () => {
        const onClick = vi.fn();
        const { rerender } = renderTrigger({ onClick });
        rerender(<AvatarTrigger onClick={onClick} />);
        expect(onClick).not.toHaveBeenCalled();
    });

    it('渲染后 DOM 只有一个 button', () => {
        renderTrigger();
        expect(screen.getAllByRole('button')).toHaveLength(1);
    });

    it('有 avatar 时 DOM 只有一个 img', () => {
        renderTrigger({ avatar: 'https://example.com/a.jpg' });
        expect(screen.getAllByRole('img')).toHaveLength(1);
    });
});
