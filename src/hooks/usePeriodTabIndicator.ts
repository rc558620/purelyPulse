// 周期 Tab 滑动指示器 hook：监听激活项变化并返回指示器的 transform 样式
//
// 性能说明：
//   指示器使用 transform: translateX() scaleX() 而非 left + width。
//   transform 属于 compositor-only 属性，动画完全运行在 GPU 合成线程，
//   不触发 Layout / Paint，在低端设备和高刷屏上均能保持 60fps。
//
//   实现原理：
//     - 指示器通过 CSS 固定为第 0 个 tab 的初始宽度（由 .less 设置 width: var(--tab-w0)）
//     - 切换时只通过 translateX 偏移、scaleX 缩放来模拟 left/width 变化
//     - anchorLeft / anchorWidth 均通过 CSS 变量注入容器，避免额外 DOM 节点
import { useRef, useState, useLayoutEffect, useCallback, useEffect } from 'react';
import type React from 'react';

export interface UsePeriodTabIndicatorResult {
  /** 各 tab 按钮的 ref setter，按索引存储 */
  setTabRef: (index: number) => (el: HTMLButtonElement | null) => void;
  /** 指示器的内联样式（transform: translateX scaleX，compositor-only，不触发 Layout/Paint） */
  indicatorStyle: React.CSSProperties;
  /** 容器内联样式（注入 CSS 变量 --ind-x / --ind-sx，供指示器 CSS 读取初始值） */
  containerStyle: React.CSSProperties;
}

/**
 * 根据当前激活的业务值，在 options 中定位并计算滑动指示器的 transform 样式。
 *
 * - tab 切换：useLayoutEffect 同步测量，保证指示器即时跟随，无延迟感。
 * - 容器尺寸变化：ResizeObserver 观察 tab 容器，宽度真正改变时触发重新测量。
 * - 条件渲染重挂载：setTabRef 在最后一个 tab 挂载时重注册 observer 并立即测量。
 *
 * @param options      - 与渲染 tab 列表完全对应的选项数组
 * @param activePeriod - 当前激活选项的 value（业务语义，而非 index）
 */
export function usePeriodTabIndicator<T>(
  options: readonly { value: T }[],
  activePeriod: T,
): UsePeriodTabIndicatorResult {
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const roRef   = useRef<ResizeObserver | null>(null);

  const [indicatorStyle, setIndicatorStyle] = useState<React.CSSProperties>({});
  const [containerStyle, setContainerStyle] = useState<React.CSSProperties>({});

  // 用 ref 保存最新的 measure，让 ResizeObserver 回调始终能拿到最新闭包
  const measureRef = useRef<() => void>(() => {});

  const measure = useCallback(() => {
    const anchor = tabRefs.current[0];              // 第 0 个 tab 作为 transform 基准
    if (anchor == null) return;

    const activeIndex = options.findIndex(o => o.value === activePeriod);
    const activeTab   = tabRefs.current[activeIndex];
    if (activeTab == null) return;

    const anchorLeft  = anchor.offsetLeft;
    const anchorW     = anchor.clientWidth;         // 基准宽度（指示器初始宽度）
    const targetLeft  = activeTab.offsetLeft;
    const targetW     = activeTab.clientWidth;

    // scaleX 以 left 边缘为基准（transform-origin: left center）
    const tx = targetLeft - anchorLeft;
    const sx = anchorW > 0 ? targetW / anchorW : 1;

    setIndicatorStyle({
      transform: `translateX(${tx}px) scaleX(${sx})`,
    });

    // 将初始宽度作为 CSS 变量注入容器，让 .less 里的指示器初始宽度与第 0 个 tab 对齐
    setContainerStyle({
      '--_ind-w': `${anchorW}px`,
      '--_ind-x': `${anchorLeft}px`,
    } as React.CSSProperties);
  }, [options, activePeriod]);

  // 每次 measure 更新时同步到 ref，ResizeObserver 回调通过 ref 调用
  useEffect(() => {
    measureRef.current = measure;
  }, [measure]);

  // 激活项变化时同步测量，保证指示器即时跟随
  useLayoutEffect(() => {
    measure();
  }, [measure]);

  // 注册 / 重注册 ResizeObserver
  const attachObserver = useCallback(() => {
    const container = tabRefs.current[0]?.parentElement;
    if (container == null) return;

    roRef.current?.disconnect();
    const ro = new ResizeObserver(() => measureRef.current());
    ro.observe(container);
    roRef.current = ro;
  }, []);

  // 组件卸载时断开 observer
  useEffect(() => {
    return () => roRef.current?.disconnect();
  }, []);

  const setTabRef = useCallback((index: number) => (el: HTMLButtonElement | null) => {
    tabRefs.current[index] = el;

    // 当最后一个 tab 挂载完成时，重新注册 observer 并立即测量
    if (el !== null && index === options.length - 1) {
      attachObserver();
      // rAF 确保浏览器已完成布局，offsetLeft 已是最新值
      requestAnimationFrame(() => measureRef.current());
    }
  }, [options.length, attachObserver]);

  return { setTabRef, indicatorStyle, containerStyle };
}
