// 通用图片上传状态管理 hook：封装拖拽标记、文件校验、FileReader 读取、裁剪弹窗生命周期与 COS 上传中态
import { useCallback, useRef, useState } from 'react';
import { showToast } from '@components/ui/feedback/Toast';
import { validateImageFile, readFileAsDataURL } from '@utils/imageValidation';
import { uploadBlobToCos } from '@utils/imageUpload';

interface UseImageUploadOptions {
  /** 裁剪 / 使用原图确认后的回调，参数为可持久化的图片 URL（COS 远程地址） */
  onChange?: (url: string) => void;
  /** 禁用态：不响应点击与拖拽 */
  disabled?: boolean;
  /** 上传中态变化回调：供调用方在上传完成前拦住提交按钮 */
  onUploadingChange?: (uploading: boolean) => void;
}

interface UseImageUploadReturn {
  /** 隐藏文件 input 的 ref */
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  /** 是否处于拖拽悬浮状态 */
  isDragging: boolean;
  /** 是否显示裁剪弹窗 */
  cropVisible: boolean;
  /** 待裁剪的图片 DataURL */
  pendingCropSrc: string;
  /** 是否正在上传到 COS */
  uploading: boolean;
  /** 触发文件选择器打开 */
  handleClick: () => void;
  /** 文件 input onChange 处理函数 */
  handleFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  /** 拖拽进入区域 */
  handleDragEnter: (e: React.DragEvent) => void;
  /** 拖拽离开区域 */
  handleDragLeave: (e: React.DragEvent) => void;
  /** 拖拽悬停（阻止默认行为） */
  handleDragOver: (e: React.DragEvent) => void;
  /** 文件放置处理函数 */
  handleDrop: (e: React.DragEvent) => void;
  /** 裁剪确认回调 */
  handleCropConfirm: (croppedUrl: string) => Promise<void>;
  /** 裁剪取消回调 */
  handleCropCancel: () => void;
  /** 使用原图（跳过裁剪）回调 */
  handleUseOriginal: (originalImageSrc: string) => void;
}

/**
 * 管理图片上传全流程：文件选择/拖拽 → 校验 → DataURL 读取 → 裁剪弹窗 → 上传 COS → 回调通知。
 *
 * 裁剪确认与「使用原图」两条出口都必须先上传再回传远程 URL：
 * 任一条绕过上传都会把 DataURL / blob URL 写进表单，落库后是浏览器本地地址，图片必然失效。
 */
const useImageUpload = ({
  onChange,
  disabled = false,
  onUploadingChange,
}: UseImageUploadOptions): UseImageUploadReturn => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  /** 拖拽计数器：解决子元素触发 dragLeave 导致 isDragging 闪烁的问题 */
  const dragCountRef = useRef(0);
  /** 上传锁：同一时刻只允许一个上传在飞，避免连点重复占用带宽与重复回调 */
  const uploadingRef = useRef(false);
  const [isDragging, setIsDragging] = useState(false);
  const [cropVisible, setCropVisible] = useState(false);
  const [pendingCropSrc, setPendingCropSrc] = useState('');
  const [uploading, setUploading] = useState(false);

  /** 统一维护本地 uploading 与对外的 onUploadingChange 回调 */
  const syncUploading = useCallback((next: boolean): void => {
    uploadingRef.current = next;
    setUploading(next);
    onUploadingChange?.(next);
  }, [onUploadingChange]);

  /** 关闭裁剪弹窗并释放待裁剪的临时地址持有 */
  const closeCropModal = useCallback((): void => {
    setCropVisible(false);
    setPendingCropSrc('');
  }, []);

  const processFile = useCallback((file: File): void => {
    // 上传在途时不再接受新文件：连选会让两次上传互相覆盖回调，最终落到表单上的图不确定是哪张
    if (uploadingRef.current) return;
    const validation = validateImageFile(file);
    if (!validation.ok) return;

    void readFileAsDataURL(file)
      .then((dataUrl) => {
        setPendingCropSrc(dataUrl);
        setCropVisible(true);
      })
      .catch(() => {
        showToast({ message: '图片读取失败，请重试', type: 'error' });
      });
  }, []);

  const handleClick = useCallback((): void => {
    if (disabled || uploadingRef.current) {
      return;
    }
    fileInputRef.current?.click();
  }, [disabled]);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>): void => {
    const file = e.target.files?.[0];
    // 清空 value，确保选择同一文件仍可再次触发 onChange
    e.target.value = '';
    if (disabled) return;
    if (file) processFile(file);
  }, [disabled, processFile]);

  const handleDragEnter = useCallback((e: React.DragEvent): void => {
    e.preventDefault();
    e.stopPropagation();
    if (disabled) return;
    dragCountRef.current += 1;
    if (dragCountRef.current === 1) {
      setIsDragging(true);
    }
  }, [disabled]);

  const handleDragLeave = useCallback((e: React.DragEvent): void => {
    e.preventDefault();
    e.stopPropagation();
    dragCountRef.current -= 1;
    if (dragCountRef.current === 0) {
      setIsDragging(false);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent): void => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent): void => {
    e.preventDefault();
    e.stopPropagation();
    dragCountRef.current = 0;
    setIsDragging(false);
    if (disabled) return;
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  }, [disabled, processFile]);

  const handleCropConfirm = useCallback(async (croppedUrl: string): Promise<void> => {
    if (uploadingRef.current) {
      return;
    }
    syncUploading(true);
    try {
      const nextImageUrl = await uploadBlobToCos(croppedUrl);
      onChange?.(nextImageUrl);
      closeCropModal();
      showToast({ message: '图片上传成功', type: 'success' });
    } catch {
      showToast({ message: '图片上传失败，请重试', type: 'error' });
    } finally {
      // blob URL 用完即释放：留着会在内存里挂到页面卸载
      if (croppedUrl.startsWith('blob:')) {
        URL.revokeObjectURL(croppedUrl);
      }
      syncUploading(false);
    }
  }, [closeCropModal, onChange, syncUploading]);

  const handleCropCancel = useCallback((): void => {
    closeCropModal();
  }, [closeCropModal]);

  /*
   * 使用原图：走的是 DataURL（FileReader 产物），必须与裁剪分支一样先上传再回传。
   * 旧实现直接把 DataURL 交给 onChange，表单里看着有预览，提交后库里存的是
   * data:image/... base64（或直接因字段超长被后端拒绝）。
   */
  const handleUseOriginal = useCallback(async (originalImageSrc: string): Promise<void> => {
    if (uploadingRef.current) {
      return;
    }
    syncUploading(true);
    try {
      const nextImageUrl = await uploadBlobToCos(originalImageSrc);
      onChange?.(nextImageUrl);
      closeCropModal();
      showToast({ message: '图片上传成功', type: 'success' });
    } catch {
      showToast({ message: '图片上传失败，请重试', type: 'error' });
    } finally {
      syncUploading(false);
    }
  }, [closeCropModal, onChange, syncUploading]);

  return {
    fileInputRef,
    isDragging,
    cropVisible,
    pendingCropSrc,
    uploading,
    handleClick,
    handleFileChange,
    handleDragEnter,
    handleDragLeave,
    handleDragOver,
    handleDrop,
    handleCropConfirm,
    handleCropCancel,
    handleUseOriginal,
  };
};

export default useImageUpload;
