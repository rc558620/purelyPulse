// 通用图片上传工具：把本地 blob / DataURL 上传到对象存储，返回可持久化的远程 URL
import { http, resolveEnvPath } from './http';

const DEFAULT_IMAGE_UPLOAD_API_PATH = '/upload/image';

/** 图片上传接口的成功响应结构。 */
interface UploadImageResponse {
  /** 可直接落库的远程访问地址 */
  url: string;
  /** 对象存储中的文件 key（排查与删除时用） */
  key: string;
}

/** 解析图片上传接口路径。 */
const resolveImageUploadApiPath = (): string =>
  resolveEnvPath(
    import.meta.env.VITE_IMAGE_UPLOAD_API_PATH,
    DEFAULT_IMAGE_UPLOAD_API_PATH,
  );

/**
 * 本地待上传地址前缀：blob:（裁剪产物）/ data:（FileReader 产物，「使用原图」分支）。
 * 两者都必须 fetch 成 Blob 再走接口，否则会把浏览器本地地址写进表单，落库后图片必然失效。
 */
const LOCAL_IMAGE_PREFIXES = ['blob:', 'data:'] as const;

/**
 * 将本地图片地址上传到对象存储。
 *
 * 已是远程地址时直接返回：重复上传同一个远端图没有意义，也会白白占用带宽。
 * @param imageUrl - blob URL / DataURL / 已是远程地址
 * @returns 对象存储返回的文件访问 URL
 */
export const uploadBlobToCos = async (imageUrl: string): Promise<string> => {
  if (!LOCAL_IMAGE_PREFIXES.some((prefix) => imageUrl.startsWith(prefix))) {
    return imageUrl;
  }

  const response = await fetch(imageUrl);
  if (!response.ok) {
    throw new Error('图片文件读取失败，请重新选择');
  }

  const blob = await response.blob();
  const formData = new FormData();
  formData.append('file', blob, 'image.jpg');

  const result = await http.post<UploadImageResponse>(
    resolveImageUploadApiPath(),
    formData,
    {
      headers: { 'Content-Type': 'multipart/form-data' },
      errorMessage: '图片上传失败，请稍后重试',
    },
  );

  return result.url;
};
