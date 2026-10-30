// 图片查看器：跟手拖拽、收尾过渡与索引落地行为的回归用例
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import ImageViewer from '../ImageViewer';
import type { ImageViewerProps } from '../ImageViewer.types';

const IMAGES = ['https://cdn.test/care-1.jpg', 'https://cdn.test/care-2.jpg', 'https://cdn.test/care-3.jpg'];

/** 入场图根节点（过渡监听与 transitionend 派发都挂在它上面） */
const getSlideHostOf = (imageElement: HTMLElement): HTMLElement => imageElement.parentElement as HTMLElement;

/** 舞台（figure）：手势事件的目标 */
const getStage = (): HTMLElement => (
  screen.getByRole('dialog').querySelector('figure') as HTMLElement
);

/**
 * 模拟真实用法：浮层先隐藏、再由业务状态打开。
 * 初始索引只在「不可见 → 可见」时生效，所以不能直接以 visible 挂载。
 */
const renderOpenedViewer = (props: Partial<ImageViewerProps> = {}) => {
  const onClose = vi.fn();
  const baseProps: ImageViewerProps = { images: IMAGES, onClose, visible: false, ...props };
  const view = render(<ImageViewer {...baseProps} visible={false} />);
  view.rerender(<ImageViewer {...baseProps} visible />);
  return { ...view, onClose, baseProps };
};

/** 收尾过渡走 transitionend（原生监听，直接派发原生事件即可） */
const finishSlideTransition = (host: HTMLElement): void => {
  act(() => {
    host.dispatchEvent(new Event('transitionend', { bubbles: true }));
  });
};

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('ImageViewer 滑动切换', () => {
  it('默认展示入口图并渲染计数', () => {
    renderOpenedViewer();

    expect(screen.getByAltText('第 1 张')).toBeInTheDocument();
    expect(screen.getByText('1 / 3')).toBeInTheDocument();
  });

  it('点击下一张先播放滑出 / 滑入过渡，过渡结束才落地索引', () => {
    renderOpenedViewer();

    fireEvent.click(screen.getByRole('button', { name: '下一张' }));

    // 滑动态：新旧两张同时存在，索引与计数尚未提交
    expect(screen.getByAltText('第 1 张')).toBeInTheDocument();
    const incomingImage = screen.getByAltText('第 2 张');
    expect(screen.getByText('1 / 3')).toBeInTheDocument();

    finishSlideTransition(getSlideHostOf(incomingImage));

    expect(screen.getByText('2 / 3')).toBeInTheDocument();
    expect(screen.getByAltText('第 2 张')).toBeInTheDocument();
    expect(screen.queryByAltText('第 1 张')).not.toBeInTheDocument();
  });

  it('子元素冒泡的 transitionend 不落地索引', () => {
    renderOpenedViewer();

    fireEvent.click(screen.getByRole('button', { name: '下一张' }));
    const incomingImage = screen.getByAltText('第 2 张');

    // 事件目标是 img 而非过渡宿主，应被忽略
    finishSlideTransition(incomingImage);

    expect(screen.getByText('1 / 3')).toBeInTheDocument();
  });

  it('过渡进行中忽略重复切换，不会叠出第三张', () => {
    renderOpenedViewer();

    fireEvent.click(screen.getByRole('button', { name: '下一张' }));
    fireEvent.click(screen.getByRole('button', { name: '下一张' }));

    expect(screen.queryByAltText('第 3 张')).not.toBeInTheDocument();
    expect(screen.getByText('1 / 3')).toBeInTheDocument();

    finishSlideTransition(getSlideHostOf(screen.getByAltText('第 2 张')));
    expect(screen.getByText('2 / 3')).toBeInTheDocument();
  });

  it('transitionend 未触发时由兜底计时器落地索引', () => {
    vi.useFakeTimers();
    renderOpenedViewer();

    fireEvent.click(screen.getByRole('button', { name: '下一张' }));
    expect(screen.getByText('1 / 3')).toBeInTheDocument();

    // 兜底时长须大于最长收尾时长（400ms），否则会把过渡切半造成跳变
    act(() => {
      vi.advanceTimersByTime(600);
    });

    expect(screen.getByText('2 / 3')).toBeInTheDocument();
  });

  it('上一张按钮反向滑动，且点击不冒泡关闭浮层', () => {
    const { onClose } = renderOpenedViewer({ initialIndex: 1 });

    fireEvent.click(screen.getByRole('button', { name: '上一张' }));

    const incomingImage = screen.getByAltText('第 1 张');
    expect(onClose).not.toHaveBeenCalled();
    expect(screen.getByText('2 / 3')).toBeInTheDocument();

    finishSlideTransition(getSlideHostOf(incomingImage));
    expect(screen.getByText('1 / 3')).toBeInTheDocument();
  });

  it('方向键切换同样播放过渡并在结束后落地', () => {
    renderOpenedViewer({ initialIndex: 1 });

    fireEvent.keyDown(window, { key: 'ArrowRight' });
    const incomingImage = screen.getByAltText('第 3 张');
    expect(screen.getByText('2 / 3')).toBeInTheDocument();

    finishSlideTransition(getSlideHostOf(incomingImage));
    expect(screen.getByText('3 / 3')).toBeInTheDocument();
  });

  it('首尾越界时方向键不触发切换', () => {
    renderOpenedViewer({ initialIndex: 2 });

    // 末张右切应被忽略：不进入滑动态
    fireEvent.keyDown(window, { key: 'ArrowRight' });
    expect(screen.queryByAltText('第 4 张')).not.toBeInTheDocument();
    expect(screen.getAllByAltText(/第 \d 张/)).toHaveLength(1);

    // 左切可正常进入滑动态（目标为第 2 张）
    fireEvent.keyDown(window, { key: 'ArrowLeft' });
    expect(screen.getByAltText('第 2 张')).toBeInTheDocument();
    expect(screen.getByText('3 / 3')).toBeInTheDocument();
  });

  it('单张图片时不响应方向键、不渲染切换按钮', () => {
    renderOpenedViewer({ images: ['https://cdn.test/only.jpg'] });

    fireEvent.keyDown(window, { key: 'ArrowRight' });

    expect(screen.getByText('1 / 1')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '下一张' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '上一张' })).not.toBeInTheDocument();
  });

  it('多张图片时按钮常驻，越界的一侧置灰禁用而非消失', () => {
    renderOpenedViewer();

    // 首张：上一张禁用，下一张可用
    expect(screen.getByRole('button', { name: '上一张' })).toBeDisabled();
    expect(screen.getByRole('button', { name: '下一张' })).not.toBeDisabled();

    // 切到末张：轮换为下一张禁用，按钮仍留在 DOM 中
    fireEvent.click(screen.getByRole('button', { name: '下一张' }));
    finishSlideTransition(getSlideHostOf(screen.getByAltText('第 2 张')));
    fireEvent.click(screen.getByRole('button', { name: '下一张' }));
    finishSlideTransition(getSlideHostOf(screen.getByAltText('第 3 张')));

    expect(screen.getByText('3 / 3')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '下一张' })).toBeDisabled();
    expect(screen.getByRole('button', { name: '上一张' })).not.toBeDisabled();
  });

  it('开启减少动态效果时直接切换，不挂过渡', () => {
    vi.stubGlobal('matchMedia', () => ({
      matches: true,
      media: '(prefers-reduced-motion: reduce)',
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }));
    renderOpenedViewer();

    fireEvent.click(screen.getByRole('button', { name: '下一张' }));

    expect(screen.getByText('2 / 3')).toBeInTheDocument();
    expect(screen.queryByAltText('第 1 张')).not.toBeInTheDocument();
  });

  it('左滑轻扫触发下一张的滑动过渡', () => {
    renderOpenedViewer();
    const stage = getStage();

    fireEvent.touchStart(stage, { touches: [{ clientX: 220, clientY: 160 }] });
    fireEvent.touchEnd(stage, { changedTouches: [{ clientX: 120, clientY: 160 }] });

    expect(screen.getByAltText('第 2 张')).toBeInTheDocument();
    expect(screen.getByText('1 / 3')).toBeInTheDocument();
  });

  it('右滑轻扫切上一张', () => {
    renderOpenedViewer({ initialIndex: 1 });
    const stage = getStage();

    fireEvent.touchStart(stage, { touches: [{ clientX: 120, clientY: 160 }] });
    fireEvent.touchEnd(stage, { changedTouches: [{ clientX: 220, clientY: 160 }] });

    expect(screen.getByAltText('第 1 张')).toBeInTheDocument();
    expect(screen.getByText('2 / 3')).toBeInTheDocument();
  });

  it('拖拽跟手：松手超过阈值切到下一张，过渡结束落地', () => {
    renderOpenedViewer();
    const stage = getStage();

    fireEvent.touchStart(stage, { touches: [{ clientX: 300, clientY: 200 }] });
    // 首个有效位移锁定横向方向，邻图入场待命
    fireEvent.touchMove(stage, { touches: [{ clientX: 260, clientY: 202 }] });
    fireEvent.touchMove(stage, { touches: [{ clientX: 120, clientY: 205 }] });
    fireEvent.touchEnd(stage, { changedTouches: [{ clientX: 120, clientY: 205 }] });

    // 跟手期间邻图已挂载，索引尚未提交
    expect(screen.getByAltText('第 2 张')).toBeInTheDocument();
    expect(screen.getByText('1 / 3')).toBeInTheDocument();

    finishSlideTransition(getSlideHostOf(screen.getByAltText('第 2 张')));
    expect(screen.getByText('2 / 3')).toBeInTheDocument();
  });

  it('拖拽未超过阈值松手回弹，不切换且邻图最终卸载', () => {
    renderOpenedViewer();
    const stage = getStage();

    fireEvent.touchStart(stage, { touches: [{ clientX: 300, clientY: 200 }] });
    fireEvent.touchMove(stage, { touches: [{ clientX: 288, clientY: 200 }] });
    fireEvent.touchEnd(stage, { changedTouches: [{ clientX: 288, clientY: 200 }] });

    // 回弹过渡进行中：索引不提交
    expect(screen.getByText('1 / 3')).toBeInTheDocument();

    finishSlideTransition(getSlideHostOf(screen.getByAltText('第 2 张')));
    expect(screen.queryByAltText('第 2 张')).not.toBeInTheDocument();
    expect(screen.getByText('1 / 3')).toBeInTheDocument();
  });

  it('跟手松手的收尾时长按剩余距离缩放，与按钮切换同速', async () => {
    // jsdom 不做布局，mock 舞台宽度以验证时长按「剩余距离 ÷ 参考速度」计算
    const offsetWidthSpy = vi
      .spyOn(HTMLElement.prototype, 'offsetWidth', 'get')
      .mockReturnValue(400);

    try {
      renderOpenedViewer();
      const stage = getStage();

      // 按钮切换：整屏 400px → 参考时长 300ms
      fireEvent.click(screen.getByRole('button', { name: '下一张' }));
      const buttonIncoming = getSlideHostOf(screen.getByAltText('第 2 张'));
      expect(buttonIncoming.style.transitionDuration).toBe('300ms');

      finishSlideTransition(buttonIncoming);

      // 跟手松手：已拖 300px，剩余 100px → 75ms，低于下限 160ms 被钳制
      fireEvent.touchStart(stage, { touches: [{ clientX: 300, clientY: 200 }] });
      fireEvent.touchMove(stage, { touches: [{ clientX: 260, clientY: 202 }] });
      fireEvent.touchMove(stage, { touches: [{ clientX: 0, clientY: 205 }] });
      // 等一帧，让跟手位移经 rAF 合帧真正落盘（松手以此为起点）
      await act(async () => {
        await new Promise((resolve) => requestAnimationFrame(resolve));
      });
      fireEvent.touchEnd(stage, { changedTouches: [{ clientX: 0, clientY: 205 }] });

      const dragIncoming = getSlideHostOf(screen.getByAltText('第 3 张'));
      expect(dragIncoming.style.transitionDuration).toBe('160ms');

      finishSlideTransition(dragIncoming);
      expect(screen.getByText('3 / 3')).toBeInTheDocument();
    } finally {
      offsetWidthSpy.mockRestore();
    }
  });

  it('纵向拖动不触发切换', () => {
    renderOpenedViewer();
    const stage = getStage();

    fireEvent.touchStart(stage, { touches: [{ clientX: 300, clientY: 200 }] });
    fireEvent.touchMove(stage, { touches: [{ clientX: 302, clientY: 260 }] });
    fireEvent.touchEnd(stage, { changedTouches: [{ clientX: 302, clientY: 260 }] });

    expect(screen.getAllByAltText(/第 \d 张/)).toHaveLength(1);
    expect(screen.getByText('1 / 3')).toBeInTheDocument();
  });

  it('鼠标拖拽同样可以跟手切换', () => {
    renderOpenedViewer();
    const stage = getStage();

    fireEvent.mouseDown(stage, { button: 0, clientX: 300, clientY: 200 });
    fireEvent.mouseMove(window, { clientX: 200, clientY: 205 });
    fireEvent.mouseUp(window, { clientX: 200, clientY: 205 });

    expect(screen.getByAltText('第 2 张')).toBeInTheDocument();
    expect(screen.getByText('1 / 3')).toBeInTheDocument();

    finishSlideTransition(getSlideHostOf(screen.getByAltText('第 2 张')));
    expect(screen.getByText('2 / 3')).toBeInTheDocument();
  });

  it('拖拽后补发的 click 不关闭浮层', () => {
    const { onClose } = renderOpenedViewer();
    const stage = getStage();

    fireEvent.mouseDown(stage, { button: 0, clientX: 300, clientY: 200 });
    fireEvent.mouseMove(window, { clientX: 290, clientY: 200 });
    fireEvent.mouseUp(window, { clientX: 290, clientY: 200 });
    // 浏览器在鼠标拖拽结束后仍会向共同祖先派发 click
    fireEvent.click(stage);

    expect(onClose).not.toHaveBeenCalled();
    expect(screen.getByText('1 / 3')).toBeInTheDocument();
  });

  it('按 Esc 关闭浮层', () => {
    const { onClose } = renderOpenedViewer();

    fireEvent.keyDown(window, { key: 'Escape' });

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('点击图片不关闭浮层，点击遮罩关闭', () => {
    const { onClose } = renderOpenedViewer();

    fireEvent.click(screen.getByAltText('第 1 张'));
    expect(onClose).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('dialog'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('关闭时清空滑动态，重新打开仍从入口图开始', () => {
    const { rerender, baseProps } = renderOpenedViewer();

    fireEvent.click(screen.getByRole('button', { name: '下一张' }));
    rerender(<ImageViewer {...baseProps} visible={false} />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    rerender(<ImageViewer {...baseProps} visible />);
    expect(screen.getByAltText('第 1 张')).toBeInTheDocument();
    expect(screen.getByText('1 / 3')).toBeInTheDocument();
  });
});
