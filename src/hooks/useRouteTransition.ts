/**
 * useRouteTransition —— 路由切换动画核心 Hook。
 *
 * 职责（单一）：
 *  1. 读取当前 location.state 中的动画意图（transitionType）。
 *  2. 根据设备类型 fallback 到默认动画（移动端 slide / PC fadeUp）。
 *  3. 计算对应 preset，驱动 @react-spring/web 的 useTransition。
 *  4. 跨断点时自动 replace location，清除旧设备的 transition state。
 */

import { useRef, useEffect } from 'react';
import { useLocation, useNavigationType, useNavigate } from 'react-router-dom';
import { useTransition } from '@react-spring/web';
import type { TransitionType, LocationState } from '@/types/transition';
import { transitionPresets } from '@constants/transitionPresets';
import { useIsMobile } from './useIsMobile';

/**
 * 统一的弹簧动画物理参数。
 * 集中在此处定义，未来差异化配置时只需在 hook 内部扩展，不影响渲染层。
 *
 * 参数调优说明（对标 iOS UINavigationController 原生曲线）：
 *  - tension: 220（原 280）→ 降低弹力，前段不再冲太快，入场更顺滑
 *  - friction: 26（原 30） → 适度降低阻尼，结尾收得更自然，无回弹感
 *  - clamp: true           → 禁止弹簧物理过冲，动画值严格在 from→enter 范围内运动
 *                            快速连续跳转时弹力不叠加，消除抖动感
 */
const SPRING_CONFIG = { tension: 220, friction: 26, clamp: true } as const;

export function useRouteTransition() {
  const location = useLocation();
  const navType  = useNavigationType(); // 'PUSH' | 'POP' | 'REPLACE'
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  // ── 1. 跨断点时自动清除 history state 中的 transition ──────────────────────
  const prevIsMobileRef = useRef(isMobile);

  useEffect(() => {
    if (prevIsMobileRef.current === isMobile) return;
    prevIsMobileRef.current = isMobile;

    // 精准清除 transition，保留其余业务 state（如 fromRegister 等）
    const currentState = location.state as Record<string, unknown> | null;
    const merged = { ...currentState };
    delete merged['transition'];
    navigate(location.pathname + location.search + location.hash, {
      replace: true,
      state: Object.keys(merged).length > 0 ? merged : null,
    });
  }, [isMobile]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── 2. 解析动画意图 ────────────────────────────────────────────────────────
  const isPop = navType === 'POP';
  const defaultTransition: TransitionType = isMobile ? 'slide' : 'fadeUp';
  const transitionType: TransitionType =
    (location.state as LocationState)?.transition ?? defaultTransition;

  // ── 3. 读取 preset（静态查找表，O(1) 属性访问，零对象分配）─────────────
  // transitionPresets 已预计算所有 type × direction 组合，无需 useMemo。
  const preset = transitionPresets[transitionType][isPop ? 'pop' : 'push'];

  // ── 4. 驱动 @react-spring/web 动画 ────────────────────────────────────────
  return useTransition(location, {
    key: location.pathname,
    ...preset,
    config: SPRING_CONFIG,
  });
}
