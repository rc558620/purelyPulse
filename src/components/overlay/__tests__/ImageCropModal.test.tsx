/**
 * ImageCropModal / ZoomControls / CropModalFooter 单元测试
 *
 * ── ZoomControls
 *    1.  渲染 range input（缩放滑块）
 *    2.  range input 具有正确的 min/max/step 属性
 *    3.  range input 的 aria-label 为「调整缩放比例」
 *    4.  传入 zoom 值正确设置 input value
 *    5.  拖动滑块触发 onZoomChange（传入数值）
 *    6.  --slider-percent CSS 变量随 zoom 正确计算
 *    7.  居中按钮存在且 aria-label 正确
 *    8.  点击居中按钮触发 onCenter
 *    9.  ZoomControls 为 React.memo 包裹
 *
 * ── CropModalFooter
 *    10. 渲染「取消」按钮
 *    11. 渲染「确定裁剪」按钮
 *    12. 不传 onUseOriginal 时「使用原图」按钮不渲染
 *    13. 传入 onUseOriginal 时「使用原图」按钮出现
 *    14. 点击「取消」触发 onCancel
 *    15. 点击「确定裁剪」触发 onConfirm
 *    16. 点击「使用原图」触发 onUseOriginal
 *    17. 三个按钮均为 type="button"
 *    18. CropModalFooter 为 React.memo 包裹
 *
 * ── ImageCropModal（主组件）
 *    19. visible=false 且 hasBeenOpen=false 时不渲染任何内容
 *    20. visible=true 时渲染到 document.body（Portal）
 *    21. 默认标题「裁剪图片」正常渲染
 *    22. 自定义 title 正常渲染
 *    23. 组件包含 ZoomControls（range input）
 *    24. 组件包含 CropModalFooter（取消/确定裁剪按钮）
 *    25. 传入 onUseOriginal 时「使用原图」按钮出现
 *    26. 不传 onUseOriginal 时「使用原图」按钮不出现
 *    27. 点击「取消」触发 onCancel
 *    28. 点击「使用原图」触发 onUseOriginal
 *    29. visible true→false 后弹窗通过 style 隐藏（不卸载 DOM）
 *    30. visible false→true 后弹窗重新可见（无 visibility:hidden）
 *    31. visible 关闭再打开后 zoom 重置回 1
 *    32. handleConfirm：croppedAreaPixels 为 null 时不调用 onConfirm
 *    33. handleConfirm：getCroppedImg 成功时调用 onConfirm(url)
 *    34. handleConfirm：getCroppedImg 失败时不调用 onConfirm，打印 error
 *    35. 内容区点击不冒泡到遮罩层
 *    36. 卸载后不留残留节点
 *    37. ImageCropModal 为 React.memo 包裹
 */

import React, { act } from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// ─── 子组件直接引入 ───────────────────────────────────────────────────────────
import ZoomControls from '../ImageCropModal/ZoomControls';
import CropModalFooter from '../ImageCropModal/CropModalFooter';

// ─── 主组件 ──────────────────────────────────────────────────────────────────
import ImageCropModal from '../ImageCropModal/index';

// ─── mock react-easy-crop ─────────────────────────────────────────────────────
vi.mock('react-easy-crop', () => ({
  default: ({ onCropComplete }: { onCropComplete?: (a: unknown, b: unknown) => void }) => {
    // 渲染一个简单替身，同时暴露手动触发 onCropComplete 的入口
    return (
      <div
        data-testid="mock-cropper"
        // 点击该节点触发 onCropComplete（测试用）
        onClick={() =>
          onCropComplete?.(
            { x: 0, y: 0, width: 100, height: 100 },
            { x: 10, y: 10, width: 80, height: 80 },
          )
        }
      />
    );
  },
}));

// ─── mock cropImageUtils ─────────────────────────────────────────────────────
const mockGetCroppedImg = vi.fn();
vi.mock('../ImageCropModal/cropImageUtils', () => ({
  getCroppedImg: (...args: unknown[]) => mockGetCroppedImg(...args),
}));

// ─────────────────────────────────────────────────────────────────────────────
// ZoomControls 测试
// ─────────────────────────────────────────────────────────────────────────────
describe('ZoomControls – 基本渲染', () => {
  it('渲染 range input（缩放滑块）', () => {
    render(<ZoomControls zoom={1} onZoomChange={vi.fn()} onCenter={vi.fn()} />);
    expect(screen.getByRole('slider')).toBeInTheDocument();
  });

  it('range input 具有正确的 min/max/step 属性', () => {
    render(<ZoomControls zoom={1} onZoomChange={vi.fn()} onCenter={vi.fn()} />);
    const slider = screen.getByRole('slider');
    expect(slider).toHaveAttribute('min', '0.1');
    expect(slider).toHaveAttribute('max', '3');
    expect(slider).toHaveAttribute('step', '0.01');
  });

  it('range input 的 aria-label 为「调整缩放比例」', () => {
    render(<ZoomControls zoom={1} onZoomChange={vi.fn()} onCenter={vi.fn()} />);
    expect(screen.getByRole('slider')).toHaveAttribute('aria-label', '调整缩放比例');
  });

  it('传入 zoom=1.5 时 input value 为 1.5', () => {
    render(<ZoomControls zoom={1.5} onZoomChange={vi.fn()} onCenter={vi.fn()} />);
    expect(screen.getByRole('slider')).toHaveValue('1.5');
  });

  it('传入 zoom=0.1（最小值）时 input value 为 0.1', () => {
    render(<ZoomControls zoom={0.1} onZoomChange={vi.fn()} onCenter={vi.fn()} />);
    expect(screen.getByRole('slider')).toHaveValue('0.1');
  });

  it('传入 zoom=3（最大值）时 input value 为 3', () => {
    render(<ZoomControls zoom={3} onZoomChange={vi.fn()} onCenter={vi.fn()} />);
    expect(screen.getByRole('slider')).toHaveValue('3');
  });
});

describe('ZoomControls – 交互', () => {
  it('拖动滑块触发 onZoomChange（传入数值）', () => {
    const onZoomChange = vi.fn();
    render(<ZoomControls zoom={1} onZoomChange={onZoomChange} onCenter={vi.fn()} />);
    const slider = screen.getByRole('slider');
    fireEvent.change(slider, { target: { value: '2' } });
    expect(onZoomChange).toHaveBeenCalledWith(2);
  });

  it('onZoomChange 接收的是 Number 类型', () => {
    const onZoomChange = vi.fn();
    render(<ZoomControls zoom={1} onZoomChange={onZoomChange} onCenter={vi.fn()} />);
    fireEvent.change(screen.getByRole('slider'), { target: { value: '1.5' } });
    expect(typeof onZoomChange.mock.calls[0][0]).toBe('number');
    expect(onZoomChange.mock.calls[0][0]).toBeCloseTo(1.5);
  });

  it('居中按钮存在且 aria-label 为「重置图片位置」', () => {
    render(<ZoomControls zoom={1} onZoomChange={vi.fn()} onCenter={vi.fn()} />);
    expect(screen.getByRole('button', { name: '重置图片位置' })).toBeInTheDocument();
  });

  it('点击居中按钮触发 onCenter', async () => {
    const user = userEvent.setup();
    const onCenter = vi.fn();
    render(<ZoomControls zoom={1} onZoomChange={vi.fn()} onCenter={onCenter} />);
    await user.click(screen.getByRole('button', { name: '重置图片位置' }));
    expect(onCenter).toHaveBeenCalledTimes(1);
  });

  it('居中按钮具有 type="button"', () => {
    render(<ZoomControls zoom={1} onZoomChange={vi.fn()} onCenter={vi.fn()} />);
    expect(screen.getByRole('button', { name: '重置图片位置' })).toHaveAttribute('type', 'button');
  });
});

describe('ZoomControls – CSS 变量', () => {
  it('zoom=1 时 --slider-percent 约为 31.03%（(1-0.1)/(3-0.1)*100）', () => {
    render(<ZoomControls zoom={1} onZoomChange={vi.fn()} onCenter={vi.fn()} />);
    const slider = screen.getByRole('slider');
    const pct = parseFloat((slider as HTMLElement).style.getPropertyValue('--slider-percent'));
    // (1-0.1)/(3-0.1)*100 ≈ 31.03
    expect(pct).toBeCloseTo(31.03, 1);
  });

  it('zoom=0.1（最小）时 --slider-percent 为 0%', () => {
    render(<ZoomControls zoom={0.1} onZoomChange={vi.fn()} onCenter={vi.fn()} />);
    const slider = screen.getByRole('slider');
    const pct = parseFloat((slider as HTMLElement).style.getPropertyValue('--slider-percent'));
    expect(pct).toBeCloseTo(0, 1);
  });

  it('zoom=3（最大）时 --slider-percent 为 100%', () => {
    render(<ZoomControls zoom={3} onZoomChange={vi.fn()} onCenter={vi.fn()} />);
    const slider = screen.getByRole('slider');
    const pct = parseFloat((slider as HTMLElement).style.getPropertyValue('--slider-percent'));
    expect(pct).toBeCloseTo(100, 1);
  });
});

describe('ZoomControls – React.memo', () => {
  it('ZoomControls 是 React.memo 包裹的组件', () => {
    expect((ZoomControls as unknown as { $$typeof?: symbol }).$$typeof?.toString()).toContain('memo');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// CropModalFooter 测试
// ─────────────────────────────────────────────────────────────────────────────
describe('CropModalFooter – 基本渲染', () => {
  it('渲染「取消」按钮', () => {
    render(<CropModalFooter onCancel={vi.fn()} onConfirm={vi.fn()} />);
    expect(screen.getByRole('button', { name: '取消' })).toBeInTheDocument();
  });

  it('渲染「确定裁剪」按钮', () => {
    render(<CropModalFooter onCancel={vi.fn()} onConfirm={vi.fn()} />);
    expect(screen.getByRole('button', { name: '确定裁剪' })).toBeInTheDocument();
  });

  it('不传 onUseOriginal 时「使用原图」按钮不渲染', () => {
    render(<CropModalFooter onCancel={vi.fn()} onConfirm={vi.fn()} />);
    expect(screen.queryByRole('button', { name: '使用原图' })).toBeNull();
  });

  it('传入 onUseOriginal 时「使用原图」按钮出现', () => {
    render(
      <CropModalFooter onCancel={vi.fn()} onConfirm={vi.fn()} onUseOriginal={vi.fn()} />,
    );
    expect(screen.getByRole('button', { name: '使用原图' })).toBeInTheDocument();
  });

  it('所有按钮均为 type="button"', () => {
    render(
      <CropModalFooter onCancel={vi.fn()} onConfirm={vi.fn()} onUseOriginal={vi.fn()} />,
    );
    screen.getAllByRole('button').forEach((btn) => {
      expect(btn).toHaveAttribute('type', 'button');
    });
  });
});

describe('CropModalFooter – 交互', () => {
  it('点击「取消」触发 onCancel', async () => {
    const user = userEvent.setup();
    const onCancel = vi.fn();
    render(<CropModalFooter onCancel={onCancel} onConfirm={vi.fn()} />);
    await user.click(screen.getByRole('button', { name: '取消' }));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('点击「确定裁剪」触发 onConfirm', async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();
    render(<CropModalFooter onCancel={vi.fn()} onConfirm={onConfirm} />);
    await user.click(screen.getByRole('button', { name: '确定裁剪' }));
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it('点击「使用原图」触发 onUseOriginal', async () => {
    const user = userEvent.setup();
    const onUseOriginal = vi.fn();
    render(
      <CropModalFooter onCancel={vi.fn()} onConfirm={vi.fn()} onUseOriginal={onUseOriginal} />,
    );
    await user.click(screen.getByRole('button', { name: '使用原图' }));
    expect(onUseOriginal).toHaveBeenCalledTimes(1);
  });

  it('点击「取消」不触发其他回调', async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();
    const onUseOriginal = vi.fn();
    render(
      <CropModalFooter onCancel={vi.fn()} onConfirm={onConfirm} onUseOriginal={onUseOriginal} />,
    );
    await user.click(screen.getByRole('button', { name: '取消' }));
    expect(onConfirm).not.toHaveBeenCalled();
    expect(onUseOriginal).not.toHaveBeenCalled();
  });
});

describe('CropModalFooter – React.memo', () => {
  it('CropModalFooter 是 React.memo 包裹的组件', () => {
    expect((CropModalFooter as unknown as { $$typeof?: symbol }).$$typeof?.toString()).toContain('memo');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// ImageCropModal 主组件测试
// ─────────────────────────────────────────────────────────────────────────────

/** 辅助：渲染标准 ImageCropModal */
function renderCropModal(overrides: Partial<React.ComponentProps<typeof ImageCropModal>> = {}) {
  const defaults = {
    visible: true,
    imageSrc: 'data:image/png;base64,abc',
    onCancel: vi.fn(),
    onConfirm: vi.fn(),
  };
  return render(<ImageCropModal {...defaults} {...overrides} />);
}

describe('ImageCropModal – 初始渲染', () => {
  it('visible=false 且从未打开过时不渲染任何内容', () => {
    const { container } = renderCropModal({ visible: false });
    // hasBeenOpen=false 时返回 null
    expect(container.firstChild).toBeNull();
    expect(screen.queryByText('裁剪图片')).toBeNull();
  });

  it('visible=true 时渲染默认标题「裁剪图片」', () => {
    renderCropModal({ visible: true });
    expect(screen.getByText('裁剪图片')).toBeInTheDocument();
  });

  it('自定义 title 正常渲染', () => {
    renderCropModal({ title: '上传头像' });
    expect(screen.getByText('上传头像')).toBeInTheDocument();
  });

  it('内容挂载到 document.body（Portal）', () => {
    const { container } = renderCropModal();
    expect(container.firstChild).toBeNull();
    expect(document.body).toContainElement(screen.getByText('裁剪图片'));
  });

  it('渲染 ZoomControls（range input 存在）', () => {
    renderCropModal();
    expect(screen.getByRole('slider')).toBeInTheDocument();
  });

  it('渲染 CropModalFooter（取消/确定裁剪按钮存在）', () => {
    renderCropModal();
    expect(screen.getByRole('button', { name: '取消' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '确定裁剪' })).toBeInTheDocument();
  });

  it('传入 onUseOriginal 时「使用原图」按钮出现', () => {
    renderCropModal({ onUseOriginal: vi.fn() });
    expect(screen.getByRole('button', { name: '使用原图' })).toBeInTheDocument();
  });

  it('不传 onUseOriginal 时「使用原图」按钮不出现', () => {
    renderCropModal();
    expect(screen.queryByRole('button', { name: '使用原图' })).toBeNull();
  });
});

describe('ImageCropModal – 按钮交互', () => {
  it('点击「取消」触发 onCancel', async () => {
    const user = userEvent.setup();
    const onCancel = vi.fn();
    renderCropModal({ onCancel });
    await user.click(screen.getByRole('button', { name: '取消' }));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('点击「使用原图」触发 onUseOriginal', async () => {
    const user = userEvent.setup();
    const onUseOriginal = vi.fn();
    renderCropModal({ onUseOriginal });
    await user.click(screen.getByRole('button', { name: '使用原图' }));
    expect(onUseOriginal).toHaveBeenCalledTimes(1);
  });
});

describe('ImageCropModal – visible 切换与重置', () => {
  it('visible true→false 后弹窗通过 style 隐藏（DOM 保留）', async () => {
    const onCancel = vi.fn();
    const onConfirm = vi.fn();
    // 先打开
    const { rerender } = renderCropModal({ visible: true });
    expect(screen.getByText('裁剪图片')).toBeInTheDocument();

    // 关闭
    rerender(
      <ImageCropModal
        visible={false}
        imageSrc="data:image/png;base64,abc"
        onCancel={onCancel}
        onConfirm={onConfirm}
      />,
    );
    // DOM 不销毁（hasBeenOpen=true），但 overlay 包含 visibility:hidden
    const overlay = document.body.querySelector('[class*="modalOverlay"]') as HTMLElement;
    expect(overlay).not.toBeNull();
    expect(overlay.style.visibility).toBe('hidden');
  });

  it('visible false→true 后弹窗重新可见（无 visibility:hidden）', () => {
    const onCancel = vi.fn();
    const onConfirm = vi.fn();
    // 先打开再关闭
    const { rerender } = renderCropModal({ visible: true });
    rerender(
      <ImageCropModal
        visible={false}
        imageSrc="data:image/png;base64,abc"
        onCancel={onCancel}
        onConfirm={onConfirm}
      />,
    );
    // 重新打开
    rerender(
      <ImageCropModal
        visible={true}
        imageSrc="data:image/png;base64,abc"
        onCancel={onCancel}
        onConfirm={onConfirm}
      />,
    );
    const overlay = document.body.querySelector('[class*="modalOverlay"]') as HTMLElement;
    expect(overlay).not.toBeNull();
    expect(overlay.style.visibility).not.toBe('hidden');
  });

  it('visible 关闭再打开后 zoom slider 重置回 1', async () => {
    const onCancel = vi.fn();
    const onConfirm = vi.fn();
    const { rerender } = renderCropModal({ visible: true });

    // 改变 zoom
    const slider = screen.getByRole('slider');
    fireEvent.change(slider, { target: { value: '2' } });
    expect(slider).toHaveValue('2');

    // 关闭
    rerender(
      <ImageCropModal
        visible={false}
        imageSrc="data:image/png;base64,abc"
        onCancel={onCancel}
        onConfirm={onConfirm}
      />,
    );
    // 重新打开
    rerender(
      <ImageCropModal
        visible={true}
        imageSrc="data:image/png;base64,abc"
        onCancel={onCancel}
        onConfirm={onConfirm}
      />,
    );
    expect(screen.getByRole('slider')).toHaveValue('1');
  });
});

describe('ImageCropModal – handleConfirm 逻辑', () => {
  beforeEach(() => {
    mockGetCroppedImg.mockReset();
  });

  it('croppedAreaPixels 为 null 时点击「确定裁剪」不调用 onConfirm', async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();
    // 不触发 onCropComplete，croppedAreaPixels 保持 null
    renderCropModal({ onConfirm });
    await user.click(screen.getByRole('button', { name: '确定裁剪' }));
    expect(onConfirm).not.toHaveBeenCalled();
    expect(mockGetCroppedImg).not.toHaveBeenCalled();
  });

  it('getCroppedImg 成功时调用 onConfirm(url)', async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();
    mockGetCroppedImg.mockResolvedValue('blob:http://test/cropped-url');

    renderCropModal({ onConfirm });

    // 通过点击 mock-cropper 触发 onCropComplete，设置 croppedAreaPixels
    const cropper = screen.getByTestId('mock-cropper');
    fireEvent.click(cropper);

    // 点击「确定裁剪」
    await act(async () => {
      await user.click(screen.getByRole('button', { name: '确定裁剪' }));
    });

    await waitFor(() => {
      expect(onConfirm).toHaveBeenCalledWith('blob:http://test/cropped-url');
    });
  });

  it('getCroppedImg 失败时不调用 onConfirm，打印 error', async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    mockGetCroppedImg.mockRejectedValue(new Error('Canvas failed'));

    renderCropModal({ onConfirm });

    // 触发 croppedAreaPixels
    fireEvent.click(screen.getByTestId('mock-cropper'));

    await act(async () => {
      await user.click(screen.getByRole('button', { name: '确定裁剪' }));
    });

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith('裁剪失败:', expect.any(Error));
    });
    expect(onConfirm).not.toHaveBeenCalled();
    consoleSpy.mockRestore();
  });

  it('handleConfirm 调用 getCroppedImg 时传入正确的 imageSrc 和 croppedAreaPixels', async () => {
    const user = userEvent.setup();
    mockGetCroppedImg.mockResolvedValue('blob:test');
    const imageSrc = 'data:image/jpeg;base64,xyz';

    renderCropModal({ imageSrc, onConfirm: vi.fn() });
    fireEvent.click(screen.getByTestId('mock-cropper'));

    await act(async () => {
      await user.click(screen.getByRole('button', { name: '确定裁剪' }));
    });

    await waitFor(() => {
      expect(mockGetCroppedImg).toHaveBeenCalledWith(
        imageSrc,
        { x: 10, y: 10, width: 80, height: 80 },
      );
    });
  });
});

describe('ImageCropModal – 事件传播', () => {
  it('内容区点击不冒泡到遮罩层（onCancel 不被触发）', () => {
    const onCancel = vi.fn();
    renderCropModal({ onCancel });
    const content = document.body.querySelector('[class*="modalContent"]') as HTMLElement;
    expect(content).not.toBeNull();
    fireEvent.click(content);
    expect(onCancel).not.toHaveBeenCalled();
  });
});

describe('ImageCropModal – React.memo', () => {
  it('ImageCropModal 是 React.memo 包裹的组件', () => {
    expect((ImageCropModal as unknown as { $$typeof?: symbol }).$$typeof?.toString()).toContain('memo');
  });
});

describe('ImageCropModal – 卸载清理', () => {
  it('unmount 后 Portal 内容从 body 移除', () => {
    const { unmount } = renderCropModal({ visible: true });
    expect(document.body.querySelector('[class*="modalOverlay"]')).not.toBeNull();
    unmount();
    expect(screen.queryByText('裁剪图片')).toBeNull();
  });
});
