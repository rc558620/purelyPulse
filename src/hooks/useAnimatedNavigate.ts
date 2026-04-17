import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import type { TransitionType } from '@/types/transition';
import { getRoutePreload } from '@/router';

/** NavigateOptions 类型定义（react-router-dom 未直接导出此类型）。 */
type NavigateOptions = { state?: unknown; replace?: boolean };

/**
 * 带动画类型注入的 navigate 封装。
 *
 * 设计原则：
 *  - 不再在此 hook 里读取 isMobile / 判断默认动画类型。
 *  - 默认动画的设备适配逻辑统一收归 useRouteTransition，单一数据源，无重复。
 *  - 此 hook 只负责两件事：① preload 目标 chunk；② 可选地写入手动指定的动画类型。
 *  - useCallback 依赖只剩 navigate（稳定引用），不随设备状态变化重建函数。
 *
 * 用法：
 *   const navigate = useAnimatedNavigate();
 *   navigate('/home');            // 不写 transition，由 useRouteTransition 按设备自动选
 *   navigate('/home', 'fade');    // 手动强制指定动画类型
 *   navigate(-1);                 // 返回，同原生 navigate(-1)
 */
export function useAnimatedNavigate() {
  const navigate = useNavigate();

  return useCallback(
    (
      to: string | number,
      transitionOrOptions?: TransitionType | NavigateOptions,
      options?: NavigateOptions,
    ) => {
      // navigate(-1) 等数字跳转，直接透传
      if (typeof to === 'number') {
        navigate(to);
        return;
      }

      // 立即触发目标路由的 chunk preload，与后续动画并行加载
      // import() 有浏览器原生缓存，重复调用安全，不会重复请求
      getRoutePreload(to)?.();

      if (typeof transitionOrOptions === 'string') {
        // 手动指定动画类型：写入 state，useRouteTransition 读取并执行
        navigate(to, {
          ...options,
          state: {
            ...(options?.state as object | undefined),
            transition: transitionOrOptions,
          },
        });
      } else {
        // 未指定动画类型：不写 transition，useRouteTransition 按设备自动 fallback
        // 这样 navigate 调用路径最短，无任何额外计算
        navigate(to, transitionOrOptions);
      }
    },
    [navigate], // isMobile 已移除，依赖稳定，useCallback 永远不重建
  );
}
