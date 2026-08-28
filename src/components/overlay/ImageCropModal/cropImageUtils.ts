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
 *
 * 防御措施：
 *  1. 裁剪坐标取整 —— 避免亚像素渲染导致的边缘半透明（JPEG 无 alpha，半透明变黑）
 *  2. 坐标钳位到图片实际尺寸 —— 防止 react-easy-crop 在首次加载时返回越界坐标，
 *     导致 drawImage 读取到透明区域，编码为黑色
 *  3. 白色底色填充 —— 兜底保障：即使存在 1px 缝隙，JPEG 输出也不会出现黑边
 *
 * @param imageSrc 原始图片 URL（DataURL 或网络图片）
 * @param pixelCrop react-easy-crop 返回的像素级裁剪区域
 * @returns 裁剪后图片的 Blob Object URL（JPEG 格式）
 */
export async function getCroppedImg(imageSrc: string, pixelCrop: Area): Promise<string> {
  const image = await createImage(imageSrc);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('Canvas context not available');
  }

  // 1. 取整，消除浮点坐标引起的亚像素偏移
  const sx = Math.round(pixelCrop.x);
  const sy = Math.round(pixelCrop.y);
  const sw = Math.round(pixelCrop.width);
  const sh = Math.round(pixelCrop.height);

  // 2. 钳位到图片实际尺寸，防止越界读取透明像素
  const clampedX = Math.max(0, Math.min(sx, image.naturalWidth));
  const clampedY = Math.max(0, Math.min(sy, image.naturalHeight));
  const clampedW = Math.min(sw, image.naturalWidth - clampedX);
  const clampedH = Math.min(sh, image.naturalHeight - clampedY);

  canvas.width = clampedW;
  canvas.height = clampedH;

  // 3. 白色底色填充，防止 JPEG 编码时透明像素变黑
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, clampedW, clampedH);

  ctx.drawImage(
    image,
    clampedX,
    clampedY,
    clampedW,
    clampedH,
    0,
    0,
    clampedW,
    clampedH,
  );

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error('Canvas toBlob 返回空值'));
        return;
      }
      resolve(URL.createObjectURL(blob));
    }, 'image/jpeg');
  });
}
