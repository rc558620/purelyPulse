/**
 * useAvatarUpload Hook 单元测试
 *
 * 覆盖范围：
 *  ─ 初始状态
 *    1.  cropVisible 初始为 false
 *    2.  pendingCropSrc 初始为空字符串
 *    3.  fileInputRef 初始为 { current: null }
 *  ─ openFilePicker
 *    4.  调用时对 fileInputRef.current 执行 click()
 *    5.  fileInputRef.current 为 null 时不抛出异常
 *  ─ handleFileChange
 *    6.  e.target.files 为空时不打开裁剪弹窗
 *    7.  文件类型非图片时不打开裁剪弹窗（validateImageFile 返回 { ok: false }）
 *    8.  文件类型非图片时 showToast 被调用（type='error'）
 *    9.  文件尺寸过大时不打开裁剪弹窗
 *    10. 合法图片文件时调用 readFileAsDataURL
 *    11. readFileAsDataURL 成功时 pendingCropSrc 被设置为 DataURL
 *    12. readFileAsDataURL 成功时 cropVisible 变为 true
 *    13. readFileAsDataURL 失败时 cropVisible 仍为 false
 *    14. readFileAsDataURL 失败时 showToast 被调用（message 含"图片读取失败"）
 *    15. handleFileChange 执行后 e.target.value 被清空为 ""
 *  ─ handleCropConfirm
 *    16. 调用后 cropVisible 变为 false
 *    17. 调用后 pendingCropSrc 被清空为 ""
 *    18. 调用 onAvatarChange(croppedUrl)
 *    19. showToast 以 type='success' 提示「头像更新成功」
 *  ─ handleCropCancel
 *    20. 调用后 cropVisible 变为 false
 *    21. 调用后 pendingCropSrc 被清空为 ""
 *    22. 不调用 onAvatarChange
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import useAvatarUpload from '../AvatarUploader/useAvatarUpload';

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

// ─────────────────────────────────────────────────────────────────────────────
// 辅助：创建伪造的 File 对象
// ─────────────────────────────────────────────────────────────────────────────
function makeFile(type = 'image/jpeg', size = 1024): File {
    return new File(['a'.repeat(size)], 'test.jpg', { type });
}

// ─────────────────────────────────────────────────────────────────────────────
// 辅助：创建伪造的 ChangeEvent<HTMLInputElement>
// ─────────────────────────────────────────────────────────────────────────────
function makeChangeEvent(file?: File): React.ChangeEvent<HTMLInputElement> {
    const input = document.createElement('input');
    input.type = 'file';
    // 模拟 value 可写
    Object.defineProperty(input, 'value', { writable: true, value: 'fake-path' });

    const event = {
        target: {
            files: file ? [file] : null,
            value: 'fake-path',
        },
    } as unknown as React.ChangeEvent<HTMLInputElement>;

    return event;
}

// ─────────────────────────────────────────────────────────────────────────────
// 测试
// ─────────────────────────────────────────────────────────────────────────────
describe('useAvatarUpload – 初始状态', () => {
    const onAvatarChange = vi.fn();

    it('cropVisible 初始为 false', () => {
        const { result } = renderHook(() => useAvatarUpload({ onAvatarChange }));
        expect(result.current.cropVisible).toBe(false);
    });

    it('pendingCropSrc 初始为空字符串', () => {
        const { result } = renderHook(() => useAvatarUpload({ onAvatarChange }));
        expect(result.current.pendingCropSrc).toBe('');
    });

    it('fileInputRef 初始 current 为 null', () => {
        const { result } = renderHook(() => useAvatarUpload({ onAvatarChange }));
        expect(result.current.fileInputRef.current).toBeNull();
    });
});

describe('useAvatarUpload – openFilePicker', () => {
    it('调用时对 fileInputRef.current 执行 click()', () => {
        const { result } = renderHook(() => useAvatarUpload({ onAvatarChange: vi.fn() }));
        const mockClick = vi.fn();
        // 手动模拟 ref 已挂载
        Object.defineProperty(result.current.fileInputRef, 'current', {
            value: { click: mockClick },
            writable: true,
        });

        act(() => {
            result.current.openFilePicker();
        });

        expect(mockClick).toHaveBeenCalledTimes(1);
    });

    it('fileInputRef.current 为 null 时不抛出异常', () => {
        const { result } = renderHook(() => useAvatarUpload({ onAvatarChange: vi.fn() }));
        expect(() => {
            act(() => {
                result.current.openFilePicker();
            });
        }).not.toThrow();
    });
});

describe('useAvatarUpload – handleFileChange', () => {
    beforeEach(() => {
        mockShowToast.mockClear();
        mockValidateImageFile.mockClear();
        mockReadFileAsDataURL.mockClear();
    });

    it('e.target.files 为 null/空时不调用 validateImageFile', () => {
        const { result } = renderHook(() => useAvatarUpload({ onAvatarChange: vi.fn() }));
        const event = makeChangeEvent(undefined);
        act(() => {
            result.current.handleFileChange(event);
        });
        expect(mockValidateImageFile).not.toHaveBeenCalled();
    });

    it('e.target.files 为空时 cropVisible 保持 false', () => {
        const { result } = renderHook(() => useAvatarUpload({ onAvatarChange: vi.fn() }));
        act(() => {
            result.current.handleFileChange(makeChangeEvent(undefined));
        });
        expect(result.current.cropVisible).toBe(false);
    });

    it('文件类型非图片时 validateImageFile 返回 { ok: false }，不打开裁剪弹窗', async () => {
        mockValidateImageFile.mockReturnValue({ ok: false, reason: 'invalidType' });
        const { result } = renderHook(() => useAvatarUpload({ onAvatarChange: vi.fn() }));
        const file = makeFile('application/pdf');

        await act(async () => {
            result.current.handleFileChange(makeChangeEvent(file));
        });

        expect(result.current.cropVisible).toBe(false);
        expect(mockReadFileAsDataURL).not.toHaveBeenCalled();
    });

    it('文件类型非图片时 showToast 被调用（type=error）', async () => {
        mockValidateImageFile.mockImplementation(() => {
            mockShowToast({ message: '请上传图片格式文件', type: 'error' });
            return { ok: false, reason: 'invalidType' };
        });
        const { result } = renderHook(() => useAvatarUpload({ onAvatarChange: vi.fn() }));

        await act(async () => {
            result.current.handleFileChange(makeChangeEvent(makeFile('application/pdf')));
        });

        expect(mockShowToast).toHaveBeenCalledWith(
            expect.objectContaining({ type: 'error' }),
        );
    });

    it('文件尺寸过大时不打开裁剪弹窗', async () => {
        mockValidateImageFile.mockReturnValue({ ok: false, reason: 'tooLarge' });
        const { result } = renderHook(() => useAvatarUpload({ onAvatarChange: vi.fn() }));

        await act(async () => {
            result.current.handleFileChange(makeChangeEvent(makeFile('image/jpeg', 10 * 1024 * 1024)));
        });

        expect(result.current.cropVisible).toBe(false);
    });

    it('合法图片文件时调用 readFileAsDataURL', async () => {
        mockValidateImageFile.mockReturnValue({ ok: true });
        mockReadFileAsDataURL.mockResolvedValue('data:image/jpeg;base64,abc');
        const { result } = renderHook(() => useAvatarUpload({ onAvatarChange: vi.fn() }));
        const file = makeFile('image/jpeg');

        await act(async () => {
            result.current.handleFileChange(makeChangeEvent(file));
        });

        expect(mockReadFileAsDataURL).toHaveBeenCalledWith(file);
    });

    it('readFileAsDataURL 成功时 pendingCropSrc 被设置', async () => {
        mockValidateImageFile.mockReturnValue({ ok: true });
        const dataUrl = 'data:image/jpeg;base64,xyz123';
        mockReadFileAsDataURL.mockResolvedValue(dataUrl);
        const { result } = renderHook(() => useAvatarUpload({ onAvatarChange: vi.fn() }));

        await act(async () => {
            result.current.handleFileChange(makeChangeEvent(makeFile()));
            // 等待 Promise 解析
            await Promise.resolve();
        });

        expect(result.current.pendingCropSrc).toBe(dataUrl);
    });

    it('readFileAsDataURL 成功时 cropVisible 变为 true', async () => {
        mockValidateImageFile.mockReturnValue({ ok: true });
        mockReadFileAsDataURL.mockResolvedValue('data:image/png;base64,test');
        const { result } = renderHook(() => useAvatarUpload({ onAvatarChange: vi.fn() }));

        await act(async () => {
            result.current.handleFileChange(makeChangeEvent(makeFile()));
            await Promise.resolve();
        });

        expect(result.current.cropVisible).toBe(true);
    });

    it('readFileAsDataURL 失败时 cropVisible 仍为 false', async () => {
        mockValidateImageFile.mockReturnValue({ ok: true });
        mockReadFileAsDataURL.mockRejectedValue(new Error('Read failed'));
        const { result } = renderHook(() => useAvatarUpload({ onAvatarChange: vi.fn() }));

        await act(async () => {
            result.current.handleFileChange(makeChangeEvent(makeFile()));
            await Promise.resolve();
        });

        expect(result.current.cropVisible).toBe(false);
    });

    it('readFileAsDataURL 失败时 showToast 被调用（message 含「图片读取失败」）', async () => {
        mockValidateImageFile.mockReturnValue({ ok: true });
        mockReadFileAsDataURL.mockRejectedValue(new Error('Read failed'));
        const { result } = renderHook(() => useAvatarUpload({ onAvatarChange: vi.fn() }));

        await act(async () => {
            result.current.handleFileChange(makeChangeEvent(makeFile()));
            await Promise.resolve();
        });

        expect(mockShowToast).toHaveBeenCalledWith(
            expect.objectContaining({
                message: expect.stringContaining('图片读取失败'),
                type: 'error',
            }),
        );
    });

    it('handleFileChange 执行时 e.target.value 被清空为 ""', () => {
        mockValidateImageFile.mockReturnValue({ ok: false, reason: 'invalidType' });
        const { result } = renderHook(() => useAvatarUpload({ onAvatarChange: vi.fn() }));
        const event = makeChangeEvent(makeFile());

        act(() => {
            result.current.handleFileChange(event);
        });

        expect((event.target as HTMLInputElement).value).toBe('');
    });
});

describe('useAvatarUpload – handleCropConfirm', () => {
    beforeEach(() => {
        mockShowToast.mockClear();
        mockValidateImageFile.mockClear();
        mockReadFileAsDataURL.mockClear();
    });

    // 辅助：先打开裁剪弹窗，再操作
    async function openCropState(onAvatarChange = vi.fn()) {
        mockValidateImageFile.mockReturnValue({ ok: true });
        mockReadFileAsDataURL.mockResolvedValue('data:image/jpeg;base64,abc');

        const hookResult = renderHook(() => useAvatarUpload({ onAvatarChange }));

        await act(async () => {
            hookResult.result.current.handleFileChange(makeChangeEvent(makeFile()));
            await Promise.resolve();
        });

        return hookResult;
    }

    it('调用后 cropVisible 变为 false', async () => {
        const { result } = await openCropState();
        expect(result.current.cropVisible).toBe(true);

        act(() => {
            result.current.handleCropConfirm('blob:cropped');
        });

        expect(result.current.cropVisible).toBe(false);
    });

    it('调用后 pendingCropSrc 被清空为 ""', async () => {
        const { result } = await openCropState();

        act(() => {
            result.current.handleCropConfirm('blob:cropped');
        });

        expect(result.current.pendingCropSrc).toBe('');
    });

    it('调用 onAvatarChange 并传入 croppedUrl', async () => {
        const onAvatarChange = vi.fn();
        const { result } = await openCropState(onAvatarChange);

        act(() => {
            result.current.handleCropConfirm('blob:http://test/cropped');
        });

        expect(onAvatarChange).toHaveBeenCalledWith('blob:http://test/cropped');
        expect(onAvatarChange).toHaveBeenCalledTimes(1);
    });

    it('showToast 以 type="success" 提示「头像更新成功」', async () => {
        const { result } = await openCropState();

        act(() => {
            result.current.handleCropConfirm('blob:cropped');
        });

        expect(mockShowToast).toHaveBeenCalledWith(
            expect.objectContaining({
                message: '头像更新成功',
                type: 'success',
            }),
        );
    });
});

describe('useAvatarUpload – handleCropCancel', () => {
    beforeEach(() => {
        mockShowToast.mockClear();
        mockValidateImageFile.mockClear();
        mockReadFileAsDataURL.mockClear();
    });

    async function openCropState(onAvatarChange = vi.fn()) {
        mockValidateImageFile.mockReturnValue({ ok: true });
        mockReadFileAsDataURL.mockResolvedValue('data:image/jpeg;base64,cancel-test');

        const hookResult = renderHook(() => useAvatarUpload({ onAvatarChange }));

        await act(async () => {
            hookResult.result.current.handleFileChange(makeChangeEvent(makeFile()));
            await Promise.resolve();
        });

        return hookResult;
    }

    it('调用后 cropVisible 变为 false', async () => {
        const { result } = await openCropState();
        expect(result.current.cropVisible).toBe(true);

        act(() => {
            result.current.handleCropCancel();
        });

        expect(result.current.cropVisible).toBe(false);
    });

    it('调用后 pendingCropSrc 被清空为 ""', async () => {
        const { result } = await openCropState();

        act(() => {
            result.current.handleCropCancel();
        });

        expect(result.current.pendingCropSrc).toBe('');
    });

    it('不调用 onAvatarChange', async () => {
        const onAvatarChange = vi.fn();
        const { result } = await openCropState(onAvatarChange);
        // 清除之前可能的调用（openCropState 内不应触发，但保险起见）
        onAvatarChange.mockClear();

        act(() => {
            result.current.handleCropCancel();
        });

        expect(onAvatarChange).not.toHaveBeenCalled();
    });

    it('不调用 showToast', async () => {
        const { result } = await openCropState();
        mockShowToast.mockClear();

        act(() => {
            result.current.handleCropCancel();
        });

        expect(mockShowToast).not.toHaveBeenCalled();
    });
});
