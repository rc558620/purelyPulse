import { useState, useEffect } from 'react';
import { useDebounceFn } from 'ahooks';

/**
 * 监听窗口宽度，返回是否为移动端。
 *
 * @param breakpoint - 移动端断点（默认 768px）
 * @param wait       - 防抖等待时间（默认 150ms）
 *
 * 为什么用防抖而不是节流：
 *  - isMobile 是布尔值，只有跨越断点时才有意义，中间过渡宽度无需响应。
 *  - 防抖：用户停止拖拽后触发一次 → 精准、低开销。
 *  - 节流：拖拽过程中每隔 N ms 触发 → 大量无效 setState（值可能根本没变）。
 */
export function useIsMobile(breakpoint = 768, wait = 150): boolean {
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < breakpoint);

  const { run: handleResize } = useDebounceFn(
    () => setIsMobile(window.innerWidth < breakpoint),
    { wait },
  );

  useEffect(() => {
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [handleResize]);

  return isMobile;
}
