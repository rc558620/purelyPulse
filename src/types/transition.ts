/**
 * 路由切换动画相关类型定义。
 * 集中管理，避免 App.tsx 与 useAnimatedNavigate 之间产生循环依赖。
 */

/** 支持的路由切换动画类型。 */
export type TransitionType = 'slide' | 'fade' | 'scale' | 'slideUp' | 'fadeUp';

/** 路由 location.state 结构。 */
export interface LocationState {
  transition?: TransitionType;
}
