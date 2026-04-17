// 图片文件校验公共工具：校验规则单一来源，供所有上传组件复用
import { showToast } from '@components/ui/feedback/Toast';

/** 图片大小上限（5 MB） */
export const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

/** 校验结果 */
export type ImageValidationResult =
    | { ok: true }
    | { ok: false; reason: 'invalidType' | 'tooLarge' };

/**
 * 校验图片文件类型与大小。
 * 不合格时通过 showToast 给用户反馈并返回 { ok: false }。
 */
export const validateImageFile = (file: File): ImageValidationResult => {
    if (!file.type.startsWith('image/')) {
        showToast({ message: '请上传图片格式文件', type: 'error' });
        return { ok: false, reason: 'invalidType' };
    }
    if (file.size > MAX_IMAGE_SIZE) {
        showToast({ message: '图片大小不能超过 5MB', type: 'error' });
        return { ok: false, reason: 'tooLarge' };
    }
    return { ok: true };
};

/**
 * 将 File 读取为 DataURL（base64）。
 * 返回 Promise，resolve 时为 DataURL 字符串。
 */
export const readFileAsDataURL = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const result = e.target?.result;
            if (typeof result === 'string') {
                resolve(result);
            } else {
                reject(new Error('FileReader did not return a string result'));
            }
        };
        reader.onerror = () => reject(reader.error);
        reader.readAsDataURL(file);
    });
