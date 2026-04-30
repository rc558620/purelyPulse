/**
 * AvatarUploader 组件整合测试
 *
 * 覆盖范围：
 *  ─ 基本渲染
 *    1.  渲染包裹容器（avatarUploader class）
 *    2.  包含 AvatarTrigger（渲染 button 元素）
 *    3.  包含隐藏 file input（type=file, accept=image/*, display:none）
 *    4.  file input 具有 aria-hidden="true"
 *    5.  ImageCropModal 初始不可见（visible=false）
 *  ─ avatar prop 透传
 *    6.  传入 avatar URL 时 AvatarTrigger 渲染 img
 *    7.  无 avatar 时 AvatarTrigger 渲染占位图
 *  ─ name prop 透传
 *    8.  传入 name="李四" 时 img alt 为「李四的头像」
 *  ─ size prop 透传
 *    9.  传入 size=12 时 button style width=12rem
 *  ─ className 透传
 *    10. 自定义 className 被附加到外层容器
 *  ─ 文件选择流程（点击 AvatarTrigger → 触发 input click）
 *    11. 点击 AvatarTrigger 时 fileInput.click() 被调用
 *  ─ 文件 input onChange 校验失败（非图片类型）
 *    12. 非图片类型文件 change 后 ImageCropModal 不打开
 *    13. 非图片类型时 showToast 被调用（type=error）
 *  ─ 文件 input onChange 校验成功
 *    14. 合法图片文件 change 后 ImageCropModal 变为 visible（渲染到 body）
 *  ─ 裁剪确认流程
 *    15. ImageCropModal onConfirm 触发后调用 onAvatarChange(croppedUrl)
 *    16. ImageCropModal onConfirm 触发后 cropVisible 变为 false
 *    17. showToast 以 type=success 提示「头像更新成功」
 *  ─ 裁剪取消流程
 *    18. ImageCropModal onCancel 触发后 cropVisible 变为 false
 *    19. 取消不调用 onAvatarChange
 *  ─ ImageCropModal props
 *    20. aspect=1（正方形裁剪）
 *    21. cropShape="round"（圆形裁剪）
 *    22. title="裁剪头像"
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AvatarUploader from '../AvatarUploader/AvatarUploader';

// ─── mock dependencies ────────────────────────────────────────────────────────
const mockShowToast = vi.fn();
vi.mock('@components/ui/feedback/Toast', () => ({
    showToast: (...args: unknown[]) => mockShowToast(...args),
}));

const mockValidateImageFile = vi.fn();
const mockReadFileAsDataURL = vi.fn();
vi.mock('@utils/imageValidation', () => ({
    validateImageFile: (...args: unknown[]) => mockValidateImageFile(...args),
    readFileAsDataURL: (...args: unknown[]) => mockReadFileAsDataURL(...args),
}));

// mock ImageCropModal，暴露 onConfirm / onCancel 的手动触发节点
vi.mock('@components/overlay/ImageCropModal', () => ({
    default: ({
        visible,
        onConfirm,
        onCancel,
        title,
        aspect,
        cropShape,
        imageSrc,
    }: {
        visible: boolean;
        onConfirm: (url: string) => void;
        onCancel: () => void;
        title?: string;
        aspect?: number;
        cropShape?: string;
        imageSrc?: string;
    }) =>
        visible ? (
            <div
                data-testid="mock-crop-modal"
                data-title={title}
                data-aspect={aspect}
                data-crop-shape={cropShape}
                data-image-src={imageSrc}
            >
                <button type="button" onClick={() => onConfirm('blob:cropped-url')}>
                    确定裁剪
                </button>
                <button type="button" onClick={onCancel}>
                    取消
                </button>
            </div>
        ) : null,
}));

// ─────────────────────────────────────────────────────────────────────────────
// 辅助：渲染默认 AvatarUploader
// ─────────────────────────────────────────────────────────────────────────────
function renderUploader(overrides: Partial<React.ComponentProps<typeof AvatarUploader>> = {}) {
    const defaults = { onAvatarChange: vi.fn() };
    return render(<AvatarUploader {...defaults} {...overrides} />);
}

// ─── 1. 基本渲染 ──────────────────────────────────────────────────────────────
describe('AvatarUploader – 基本渲染', () => {
    it('渲染包裹容器（含 avatarUploader class）', () => {
        const { container } = renderUploader();
        expect(container.querySelector('[class*="avatarUploader"]')).toBeInTheDocument();
    });

    it('包含 AvatarTrigger（渲染 button 元素）', () => {
        renderUploader();
        expect(screen.getByRole('button', { name: '点击更换头像' })).toBeInTheDocument();
    });

    it('包含隐藏 file input（type=file）', () => {
        const { container } = renderUploader();
        const input = container.querySelector('input[type="file"]');
        expect(input).toBeInTheDocument();
    });

    it('file input accept 为 "image/*"', () => {
        const { container } = renderUploader();
        const input = container.querySelector('input[type="file"]');
        expect(input).toHaveAttribute('accept', 'image/*');
    });

    it('file input 设置 display:none 隐藏', () => {
        const { container } = renderUploader();
        const input = container.querySelector('input[type="file"]') as HTMLElement;
        expect(input.style.display).toBe('none');
    });

    it('file input 具有 aria-hidden="true"', () => {
        const { container } = renderUploader();
        const input = container.querySelector('input[type="file"]');
        expect(input).toHaveAttribute('aria-hidden', 'true');
    });

    it('ImageCropModal 初始不可见', () => {
        renderUploader();
        expect(screen.queryByTestId('mock-crop-modal')).toBeNull();
    });
});

// ─── 2. avatar / name / size / className props 透传 ──────────────────────────
describe('AvatarUploader – props 透传', () => {
    it('传入 avatar URL 时 AvatarTrigger 渲染 img', () => {
        renderUploader({ avatar: 'https://example.com/avatar.jpg' });
        expect(screen.getByRole('img')).toBeInTheDocument();
    });

    it('无 avatar 时渲染占位图（无 img）', () => {
        renderUploader();
        expect(screen.queryByRole('img')).toBeNull();
    });

    it('传入 name="李四" 时 img alt 为「李四的头像」', () => {
        renderUploader({ avatar: 'https://example.com/a.jpg', name: '李四' });
        expect(screen.getByRole('img')).toHaveAttribute('alt', '李四的头像');
    });

    it('传入 size=12 时 button style width=12rem', () => {
        renderUploader({ size: 12 });
        const btn = screen.getByRole('button', { name: '点击更换头像' });
        expect(btn.style.width).toBe('12rem');
    });

    it('自定义 className 被附加到外层容器', () => {
        const { container } = renderUploader({ className: 'my-uploader' });
        expect(container.querySelector('.my-uploader')).toBeInTheDocument();
    });
});

// ─── 3. 文件选择流程 ──────────────────────────────────────────────────────────
describe('AvatarUploader – 文件选择流程', () => {
    it('点击 AvatarTrigger 时 fileInput.click() 被调用', async () => {
        const user = userEvent.setup();
        const { container } = renderUploader();
        const input = container.querySelector('input[type="file"]') as HTMLInputElement;
        const clickSpy = vi.spyOn(input, 'click').mockImplementation(() => undefined);

        await user.click(screen.getByRole('button', { name: '点击更换头像' }));
        expect(clickSpy).toHaveBeenCalledTimes(1);
    });
});

// ─── 4. handleFileChange 校验失败 ────────────────────────────────────────────
describe('AvatarUploader – handleFileChange 校验失败', () => {
    beforeEach(() => {
        mockShowToast.mockClear();
        mockValidateImageFile.mockClear();
        mockReadFileAsDataURL.mockClear();
    });

    it('非图片类型时 ImageCropModal 不出现', () => {
        mockValidateImageFile.mockReturnValue({ ok: false, reason: 'invalidType' });
        const { container } = renderUploader();
        const input = container.querySelector('input[type="file"]') as HTMLInputElement;
        const file = new File(['data'], 'test.pdf', { type: 'application/pdf' });

        fireEvent.change(input, { target: { files: [file] } });

        expect(screen.queryByTestId('mock-crop-modal')).toBeNull();
    });

    it('非图片类型时 showToast 被调用（type=error）', () => {
        mockValidateImageFile.mockImplementation(() => {
            mockShowToast({ message: '请上传图片格式文件', type: 'error' });
            return { ok: false, reason: 'invalidType' };
        });
        const { container } = renderUploader();
        const input = container.querySelector('input[type="file"]') as HTMLInputElement;
        const file = new File(['data'], 'test.pdf', { type: 'application/pdf' });

        fireEvent.change(input, { target: { files: [file] } });

        expect(mockShowToast).toHaveBeenCalledWith(
            expect.objectContaining({ type: 'error' }),
        );
    });
});

// ─── 5. handleFileChange 校验成功 ─────────────────────────────────────────────
describe('AvatarUploader – handleFileChange 校验成功', () => {
    beforeEach(() => {
        mockShowToast.mockClear();
        mockValidateImageFile.mockClear();
        mockReadFileAsDataURL.mockClear();
    });

    it('合法图片文件 change 后 ImageCropModal 变为 visible', async () => {
        mockValidateImageFile.mockReturnValue({ ok: true });
        mockReadFileAsDataURL.mockResolvedValue('data:image/jpeg;base64,test');
        const { container } = renderUploader();
        const input = container.querySelector('input[type="file"]') as HTMLInputElement;
        const file = new File(['data'], 'avatar.jpg', { type: 'image/jpeg' });

        await act(async () => {
            fireEvent.change(input, { target: { files: [file] } });
            await Promise.resolve();
        });

        await waitFor(() => {
            expect(screen.getByTestId('mock-crop-modal')).toBeInTheDocument();
        });
    });
});

// ─── 6. 裁剪确认流程 ──────────────────────────────────────────────────────────
describe('AvatarUploader – 裁剪确认', () => {
    beforeEach(() => {
        mockShowToast.mockClear();
        mockValidateImageFile.mockReturnValue({ ok: true });
        mockReadFileAsDataURL.mockResolvedValue('data:image/jpeg;base64,open');
    });

    async function openModal(onAvatarChange = vi.fn()) {
        const result = renderUploader({ onAvatarChange });
        const input = result.container.querySelector('input[type="file"]') as HTMLInputElement;
        const file = new File(['data'], 'avatar.jpg', { type: 'image/jpeg' });

        await act(async () => {
            fireEvent.change(input, { target: { files: [file] } });
            await Promise.resolve();
        });

        return result;
    }

    it('点击「确定裁剪」后 onAvatarChange(croppedUrl) 被调用', async () => {
        const user = userEvent.setup();
        const onAvatarChange = vi.fn();
        await openModal(onAvatarChange);

        await user.click(screen.getByRole('button', { name: '确定裁剪' }));

        expect(onAvatarChange).toHaveBeenCalledWith('blob:cropped-url');
        expect(onAvatarChange).toHaveBeenCalledTimes(1);
    });

    it('点击「确定裁剪」后 ImageCropModal 消失（cropVisible=false）', async () => {
        const user = userEvent.setup();
        await openModal();

        await user.click(screen.getByRole('button', { name: '确定裁剪' }));

        expect(screen.queryByTestId('mock-crop-modal')).toBeNull();
    });

    it('点击「确定裁剪」后 showToast 以 success 提示', async () => {
        const user = userEvent.setup();
        await openModal();

        await user.click(screen.getByRole('button', { name: '确定裁剪' }));

        expect(mockShowToast).toHaveBeenCalledWith(
            expect.objectContaining({ message: '头像更新成功', type: 'success' }),
        );
    });
});

// ─── 7. 裁剪取消流程 ──────────────────────────────────────────────────────────
describe('AvatarUploader – 裁剪取消', () => {
    beforeEach(() => {
        mockShowToast.mockClear();
        mockValidateImageFile.mockReturnValue({ ok: true });
        mockReadFileAsDataURL.mockResolvedValue('data:image/jpeg;base64,cancel');
    });

    async function openModal(onAvatarChange = vi.fn()) {
        const result = renderUploader({ onAvatarChange });
        const input = result.container.querySelector('input[type="file"]') as HTMLInputElement;
        const file = new File(['data'], 'avatar.jpg', { type: 'image/jpeg' });

        await act(async () => {
            fireEvent.change(input, { target: { files: [file] } });
            await Promise.resolve();
        });

        return result;
    }

    it('点击「取消」后 ImageCropModal 消失', async () => {
        const user = userEvent.setup();
        await openModal();

        await user.click(screen.getByRole('button', { name: '取消' }));

        expect(screen.queryByTestId('mock-crop-modal')).toBeNull();
    });

    it('取消不调用 onAvatarChange', async () => {
        const user = userEvent.setup();
        const onAvatarChange = vi.fn();
        await openModal(onAvatarChange);

        await user.click(screen.getByRole('button', { name: '取消' }));

        expect(onAvatarChange).not.toHaveBeenCalled();
    });
});

// ─── 8. ImageCropModal props 校验 ─────────────────────────────────────────────
describe('AvatarUploader – ImageCropModal props', () => {
    beforeEach(() => {
        mockShowToast.mockClear();
        mockValidateImageFile.mockReturnValue({ ok: true });
        mockReadFileAsDataURL.mockResolvedValue('data:image/jpeg;base64,props-test');
    });

    async function openModal() {
        const result = renderUploader();
        const input = result.container.querySelector('input[type="file"]') as HTMLInputElement;
        const file = new File(['data'], 'avatar.jpg', { type: 'image/jpeg' });

        await act(async () => {
            fireEvent.change(input, { target: { files: [file] } });
            await Promise.resolve();
        });

        return result;
    }

    it('ImageCropModal 接收 aspect=1（正方形）', async () => {
        await openModal();
        const modal = screen.getByTestId('mock-crop-modal');
        expect(modal).toHaveAttribute('data-aspect', '1');
    });

    it('ImageCropModal 接收 cropShape="round"（圆形）', async () => {
        await openModal();
        const modal = screen.getByTestId('mock-crop-modal');
        expect(modal).toHaveAttribute('data-crop-shape', 'round');
    });

    it('ImageCropModal 接收 title="裁剪头像"', async () => {
        await openModal();
        const modal = screen.getByTestId('mock-crop-modal');
        expect(modal).toHaveAttribute('data-title', '裁剪头像');
    });

    it('ImageCropModal 接收正确的 imageSrc（DataURL）', async () => {
        await openModal();
        const modal = screen.getByTestId('mock-crop-modal');
        expect(modal).toHaveAttribute('data-image-src', 'data:image/jpeg;base64,props-test');
    });
});

// ─── 9. pendingCropSrc 正确传给 ImageCropModal ────────────────────────────────
describe('AvatarUploader – pendingCropSrc 传递', () => {
    beforeEach(() => {
        mockShowToast.mockClear();
        mockValidateImageFile.mockReturnValue({ ok: true });
    });

    it('打开 modal 后 imageSrc 与 readFileAsDataURL resolve 值一致', async () => {
        const dataUrl = 'data:image/png;base64,unique-content-xyz';
        mockReadFileAsDataURL.mockResolvedValue(dataUrl);
        const { container } = renderUploader();
        const input = container.querySelector('input[type="file"]') as HTMLInputElement;

        await act(async () => {
            fireEvent.change(input, { target: { files: [new File(['d'], 'a.png', { type: 'image/png' })] } });
            await Promise.resolve();
        });

        const modal = screen.getByTestId('mock-crop-modal');
        expect(modal).toHaveAttribute('data-image-src', dataUrl);
    });

    it('取消后再次选文件，新 imageSrc 覆盖旧值', async () => {
        const dataUrl1 = 'data:image/jpeg;base64,first-url';
        const dataUrl2 = 'data:image/jpeg;base64,second-url';
        const { container } = renderUploader();
        const input = container.querySelector('input[type="file"]') as HTMLInputElement;

        mockReadFileAsDataURL.mockResolvedValue(dataUrl1);
        await act(async () => {
            fireEvent.change(input, { target: { files: [new File(['d'], 'a.jpg', { type: 'image/jpeg' })] } });
            await Promise.resolve();
        });
        expect(screen.getByTestId('mock-crop-modal')).toHaveAttribute('data-image-src', dataUrl1);

        // 取消
        const user = userEvent.setup();
        await user.click(screen.getByRole('button', { name: '取消' }));
        expect(screen.queryByTestId('mock-crop-modal')).toBeNull();

        // 第二次
        mockReadFileAsDataURL.mockResolvedValue(dataUrl2);
        await act(async () => {
            fireEvent.change(input, { target: { files: [new File(['d'], 'b.jpg', { type: 'image/jpeg' })] } });
            await Promise.resolve();
        });
        expect(screen.getByTestId('mock-crop-modal')).toHaveAttribute('data-image-src', dataUrl2);
    });
});

// ─── 10. 流程可重复（确认后能再次上传） ──────────────────────────────────────
describe('AvatarUploader – 流程可重复', () => {
    beforeEach(() => {
        mockShowToast.mockClear();
        mockValidateImageFile.mockReturnValue({ ok: true });
        mockReadFileAsDataURL.mockResolvedValue('data:image/jpeg;base64,repeat');
    });

    it('第一次确认裁剪后，再次选文件仍能打开 modal', async () => {
        const user = userEvent.setup();
        const onAvatarChange = vi.fn();
        const { container } = renderUploader({ onAvatarChange });
        const input = container.querySelector('input[type="file"]') as HTMLInputElement;

        // 第一次流程
        await act(async () => {
            fireEvent.change(input, { target: { files: [new File(['d'], 'a.jpg', { type: 'image/jpeg' })] } });
            await Promise.resolve();
        });
        await user.click(screen.getByRole('button', { name: '确定裁剪' }));
        expect(onAvatarChange).toHaveBeenCalledTimes(1);
        expect(screen.queryByTestId('mock-crop-modal')).toBeNull();

        // 第二次选文件
        await act(async () => {
            fireEvent.change(input, { target: { files: [new File(['d'], 'b.jpg', { type: 'image/jpeg' })] } });
            await Promise.resolve();
        });
        expect(screen.getByTestId('mock-crop-modal')).toBeInTheDocument();
    });

    it('多次完整流程，onAvatarChange 每次都被调用', async () => {
        const user = userEvent.setup();
        const onAvatarChange = vi.fn();
        const { container } = renderUploader({ onAvatarChange });
        const input = container.querySelector('input[type="file"]') as HTMLInputElement;

        for (let i = 0; i < 3; i++) {
            await act(async () => {
                fireEvent.change(input, { target: { files: [new File(['d'], 'a.jpg', { type: 'image/jpeg' })] } });
                await Promise.resolve();
            });
            await user.click(screen.getByRole('button', { name: '确定裁剪' }));
        }

        expect(onAvatarChange).toHaveBeenCalledTimes(3);
    });
});

// ─── 11. modal 反复开关状态一致性 ─────────────────────────────────────────────
describe('AvatarUploader – modal 反复开关', () => {
    beforeEach(() => {
        mockShowToast.mockClear();
        mockValidateImageFile.mockReturnValue({ ok: true });
        mockReadFileAsDataURL.mockResolvedValue('data:image/jpeg;base64,toggle');
    });

    it('打开 → 取消 → 打开 → 取消，modal 始终正确出现/消失', async () => {
        const user = userEvent.setup();
        const { container } = renderUploader();
        const input = container.querySelector('input[type="file"]') as HTMLInputElement;

        for (let i = 0; i < 2; i++) {
            await act(async () => {
                fireEvent.change(input, { target: { files: [new File(['d'], 'a.jpg', { type: 'image/jpeg' })] } });
                await Promise.resolve();
            });
            expect(screen.getByTestId('mock-crop-modal')).toBeInTheDocument();
            await user.click(screen.getByRole('button', { name: '取消' }));
            expect(screen.queryByTestId('mock-crop-modal')).toBeNull();
        }
    });

    it('打开 → 确认 → 打开 → 确认，modal 始终正确出现/消失', async () => {
        const user = userEvent.setup();
        const onAvatarChange = vi.fn();
        const { container } = renderUploader({ onAvatarChange });
        const input = container.querySelector('input[type="file"]') as HTMLInputElement;

        for (let i = 0; i < 2; i++) {
            await act(async () => {
                fireEvent.change(input, { target: { files: [new File(['d'], 'a.jpg', { type: 'image/jpeg' })] } });
                await Promise.resolve();
            });
            expect(screen.getByTestId('mock-crop-modal')).toBeInTheDocument();
            await user.click(screen.getByRole('button', { name: '确定裁剪' }));
            expect(screen.queryByTestId('mock-crop-modal')).toBeNull();
        }

        expect(onAvatarChange).toHaveBeenCalledTimes(2);
    });
});
