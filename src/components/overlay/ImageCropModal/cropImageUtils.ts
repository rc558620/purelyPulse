// 图片裁剪工具函数：Canvas 绘制与 Blob 生成
import type { Area } from 'react-easy-crop';

/** 通过 URL 加载 HTMLImageElement，支持跨域 */
const createImage = (url: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener('load', () => resolve(image));
    image.addEventListener('error', (error) => reject(error));
    image.crossOrigin = 'anonymous';
    image.src = url;
  });

/**
 * 将图片按像素裁剪区域绘制到 Canvas，并输出 Blob URL。
 * @param imageSrc 原始图片 URL（DataURL 或网络图片）
 * @param pixelCrop react-easy-crop 返回的像素级裁剪区域
 * @returns 裁剪后图片的 Blob Object URL（PNG 格式，保留透明通道）
 */
export async function getCroppedImg(imageSrc: string, pixelCrop: Area): Promise<string> {
  const image = await createImage(imageSrc);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('Canvas context not available');
  }

  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;

  // 清除画布，确保透明背景不被填充为黑色（PNG 支持透明通道）
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height,
  );

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error('Canvas toBlob 返回空值'));
        return;
      }
      resolve(URL.createObjectURL(blob));
    }, 'image/png');
  });
}
