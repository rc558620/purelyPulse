/**
 * AvatarUploader barrel export 契约测试（index.tsx）
 *
 * 覆盖范围：
 *  1. 默认导出是 AvatarUploader 组件（渲染后包含 button）
 *  2. 默认导出与直接导入 AvatarUploader.tsx 的默认导出引用相同
 *  3. AvatarUploaderProps 类型导出可被消费（TypeScript 类型层面）
 *  4. 通过 index 渲染组件，与直接渲染 AvatarUploader.tsx 结果一致
 */

import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

// ─── mock dependencies ────────────────────────────────────────────────────────
vi.mock('@components/ui/feedback/Toast', () => ({
    showToast: vi.fn(),
}));
vi.mock('@utils/imageValidation', () => ({
    validateImageFile: vi.fn(() => ({ ok: false })),
    readFileAsDataURL: vi.fn(),
}));
vi.mock('@components/overlay/ImageCropModal', () => ({
    default: ({ visible }: { visible: boolean }) =>
        visible ? <div data-testid="mock-crop-modal" /> : null,
}));

// ─────────────────────────────────────────────────────────────────────────────
// 导入两种路径
// ─────────────────────────────────────────────────────────────────────────────
import AvatarUploaderFromIndex, { type AvatarUploaderProps } from '../AvatarUploader/index';
import AvatarUploaderDirect from '../AvatarUploader/AvatarUploader';

// ─── 1. 默认导出是正常可渲染的 AvatarUploader 组件 ────────────────────────────
describe('AvatarUploader index – 默认导出', () => {
    it('从 index 导入的默认导出可渲染，包含 button', () => {
        render(<AvatarUploaderFromIndex onAvatarChange={vi.fn()} />);
        expect(screen.getByRole('button', { name: '点击更换头像' })).toBeInTheDocument();
    });

    it('从 index 导入的默认导出可渲染，包含 file input', () => {
        const { container } = render(<AvatarUploaderFromIndex onAvatarChange={vi.fn()} />);
        expect(container.querySelector('input[type="file"]')).toBeInTheDocument();
    });

    it('从 index 导入的组件与直接导入 AvatarUploader.tsx 是同一个引用', () => {
        expect(AvatarUploaderFromIndex).toBe(AvatarUploaderDirect);
    });
});

// ─── 2. AvatarUploaderProps 类型契约 ─────────────────────────────────────────
describe('AvatarUploader index – AvatarUploaderProps 类型契约', () => {
    it('onAvatarChange 是必填 prop，缺失时 TypeScript 应报错（运行时验证：提供时正常渲染）', () => {
        // 这里仅验证运行时行为：有 onAvatarChange 时能渲染
        const handler = vi.fn();
        render(<AvatarUploaderFromIndex onAvatarChange={handler} />);
        expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('avatar prop 可选，不传时仍能渲染', () => {
        render(<AvatarUploaderFromIndex onAvatarChange={vi.fn()} />);
        expect(screen.queryByRole('img')).toBeNull();
    });

    it('传入 avatar 时能正常渲染 img', () => {
        render(<AvatarUploaderFromIndex onAvatarChange={vi.fn()} avatar="https://example.com/a.jpg" />);
        expect(screen.getByRole('img')).toBeInTheDocument();
    });

    it('name、size、className 可选 props 正常透传', () => {
        const { container } = render(
            <AvatarUploaderFromIndex
                onAvatarChange={vi.fn()}
                avatar="https://example.com/a.jpg"
                name="测试用户"
                size={8}
                className="barrel-test-class"
            />,
        );
        expect(screen.getByRole('img')).toHaveAttribute('alt', '测试用户的头像');
        expect(screen.getByRole('button')).toHaveStyle({ width: '8rem' });
        expect(container.querySelector('.barrel-test-class')).toBeInTheDocument();
    });
});

// ─── 3. 通过 index 渲染与直接渲染结果一致 ─────────────────────────────────────
describe('AvatarUploader index – 与直接导入结果一致', () => {
    it('两种导入方式渲染的 button aria-label 相同', () => {
        const { unmount } = render(<AvatarUploaderFromIndex onAvatarChange={vi.fn()} />);
        const btnFromIndex = screen.getByRole('button').getAttribute('aria-label');
        unmount();

        render(<AvatarUploaderDirect onAvatarChange={vi.fn()} />);
        const btnFromDirect = screen.getByRole('button').getAttribute('aria-label');

        expect(btnFromIndex).toBe(btnFromDirect);
    });

    it('两种导入方式渲染的 file input accept 相同', () => {
        const { container: c1, unmount } = render(<AvatarUploaderFromIndex onAvatarChange={vi.fn()} />);
        const acceptFromIndex = c1.querySelector('input[type="file"]')?.getAttribute('accept');
        unmount();

        const { container: c2 } = render(<AvatarUploaderDirect onAvatarChange={vi.fn()} />);
        const acceptFromDirect = c2.querySelector('input[type="file"]')?.getAttribute('accept');

        expect(acceptFromIndex).toBe(acceptFromDirect);
    });
});

// 类型使用验证（仅编译期，运行时忽略）
const _typeCheck: AvatarUploaderProps = {
    onAvatarChange: (_url: string) => undefined,
};
void _typeCheck;
