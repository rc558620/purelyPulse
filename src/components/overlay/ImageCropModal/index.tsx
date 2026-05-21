// 图片裁剪弹窗：基于 react-easy-crop，支持自由比例/固定比例/圆形裁剪
import React, { useState, useCallback, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import Cropper from 'react-easy-crop';
import type { Area, Point } from 'react-easy-crop';
import { getCroppedImg } from './cropImageUtils';
import ZoomControls from './ZoomControls';
import CropModalFooter from './CropModalFooter';
import styles from './ImageCropModal.module.less';

export interface ImageCropModalProps {
  /** 弹窗可见状态 */
  visible: boolean;
  /** 待裁剪图片的 URL（DataURL 或网络地址） */
  imageSrc: string;
  /** 点击取消回调 */
  onCancel: () => void;
  /** 裁剪完成回调，参数为裁剪后的 Blob Object URL */
  onConfirm: (croppedImageUrl: string) => void;
  /**
   * 裁剪框宽高比，传入则固定比例，不传则可自由拖动调整。
   * 示例：1 = 正方形，16/9 = 宽屏，4/3 = 标准。
   */
  aspect?: number;
  /** 弹窗标题，默认「裁剪图片」 */
  title?: string;
  /** 裁剪框形状，默认 'rect' */
  cropShape?: 'rect' | 'round';
  /**
   * 点击「使用原图」回调，传入则显示该按钮，不传则隐藏。
   * 回调会拿到当前原始图片地址，避免调用方读取到过期的临时态。
   */
  onUseOriginal?: (originalImageSrc: string) => void;
}

const INITIAL_CROP: Point = { x: 0, y: 0 };
const INITIAL_ZOOM = 1;

const ImageCropModal: React.FC<ImageCropModalProps> = ({
  visible,
  imageSrc,
  onCancel,
  onConfirm,
  aspect,
  title = '裁剪图片',
  cropShape = 'rect',
  onUseOriginal,
}) => {
  const [crop, setCrop] = useState<Point>(INITIAL_CROP);
  const [zoom, setZoom] = useState(INITIAL_ZOOM);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);

  // 一旦打开过则保持 DOM（仅 CSS 隐藏），避免 Cropper 反复卸载/挂载的性能损耗。
  // 用 useState 惰性初始化：初始值取决于首次渲染时的 visible，之后只在打开时置 true。
  const [hasBeenOpen, setHasBeenOpen] = useState(() => visible);

  // visible 由 false → true 时标记为已打开过（纯渲染阶段派生，不在 effect 内 setState）
  if (visible && !hasBeenOpen) {
    setHasBeenOpen(true);
  }

  // 重置全部裁剪状态到初始值（在事件回调中调用，不在 effect 内）
  const resetState = useCallback(() => {
    setCrop(INITIAL_CROP);
    setZoom(INITIAL_ZOOM);
    setCroppedAreaPixels(null);
  }, []);

  // 记录上一次 visible，用于检测 false → true 的变化
  const prevVisibleRef = useRef(visible);
  useEffect(() => {
    const prev = prevVisibleRef.current;
    prevVisibleRef.current = visible;
    // 弹窗重新打开（false → true）时重置裁剪状态
    if (!prev && visible) {
      resetState();
    }
  }, [visible, resetState]);

  const onCropComplete = useCallback((_croppedArea: Area, croppedPixels: Area) => {
    setCroppedAreaPixels(croppedPixels);
  }, []);

  /** 重置 crop 坐标为原点，使图片回到裁剪框中心 */
  const handleResetPosition = useCallback(() => {
    setCrop(INITIAL_CROP);
  }, []);

  /** 重置缩放到初始值 */
  const handleResetZoom = useCallback(() => {
    setZoom(INITIAL_ZOOM);
  }, []);

  /** 取消：重置裁剪状态后调用外部 onCancel */
  const handleCancel = useCallback(() => {
    resetState();
    onCancel();
  }, [resetState, onCancel]);

  /** 确定裁剪 */
  const handleConfirm = useCallback(async () => {
    if (!croppedAreaPixels) return;
    try {
      const croppedImage = await getCroppedImg(imageSrc, croppedAreaPixels);
      onConfirm(croppedImage);
    } catch (e) {
      console.error('裁剪失败:', e);
    }
  }, [croppedAreaPixels, imageSrc, onConfirm]);

  /** 使用原图：重置裁剪状态后把当前原图地址回传给外部 */
  const handleUseOriginal = useCallback(() => {
    resetState();
    onUseOriginal?.(imageSrc);
  }, [imageSrc, resetState, onUseOriginal]);

  // 首次未打开时不渲染，节省初始资源
  if (!hasBeenOpen) return null;

  const modal = (
    <div
      className={`${styles.modalOverlay}${visible ? '' : ` ${styles.hidden}`}`}
    >
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        {/* 弹窗标题 */}
        <div className={styles.modalHeader}>
          <h3 className={styles.modalTitle}>{title}</h3>
        </div>

        {/* 裁剪画布区域 */}
        <div className={styles.cropContainer}>
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            {...(aspect !== undefined ? { aspect } : {})}
            minZoom={0.1}
            maxZoom={3}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={onCropComplete}
            cropShape={cropShape}
            showGrid={false}
            restrictPosition={false}
          />
        </div>

        {/* 缩放控制：滑块 + 重置位置按钮 */}
        <ZoomControls
          zoom={zoom}
          onZoomChange={setZoom}
          onCenter={handleResetPosition}
          onResetZoom={handleResetZoom}
        />

        {/* 底部操作按钮 */}
        <CropModalFooter
          onCancel={handleCancel}
          onConfirm={handleConfirm}
          onUseOriginal={onUseOriginal ? handleUseOriginal : undefined}
        />
      </div>
    </div>
  );

  return createPortal(modal, document.body);
};

export default React.memo(ImageCropModal);
