import type { TransitionType } from '@/types/transition';

/** 动画帧结构 */
interface Preset {
  from:  { opacity: number; transform: string };
  enter: { opacity: number; transform: string };
  leave: { opacity: number; transform: string };
}

/**
 * 路由切换动画预设 —— 静态二维查找表。
 *
 * 重构原因：
 *  原实现为函数形式 `transitionPresets[type](isPop)`，每次调用都实例化新的
 *  `{ from, enter, leave }` 对象，触发 GC 压力并让 react-spring 做无意义的引用比对。
 *
 *  现改为静态对象查找表，`isPop` 只有 true/false 两种值，所有组合预计算完毕。
 *  运行时只做一次属性访问（O(1)），零对象分配，零函数调用开销。
 *
 * transform 统一使用 translate3d / scale3d 写法：
 *  显式触发 GPU 合成路径，不依赖浏览器的隐式升层推断，旧机型有明显收益。
 */
export const transitionPresets: Record<
  TransitionType,
  Record<'push' | 'pop', Preset>
> = {
  /** 左右滑动（移动端默认，感知前进 / 返回方向） */
  slide: {
    push: {
      from:  { opacity: 0, transform: 'translate3d(100%, 0, 0)' },
      enter: { opacity: 1, transform: 'translate3d(0%, 0, 0)' },
      leave: { opacity: 0, transform: 'translate3d(-30%, 0, 0)' },
    },
    pop: {
      from:  { opacity: 0, transform: 'translate3d(-30%, 0, 0)' },
      enter: { opacity: 1, transform: 'translate3d(0%, 0, 0)' },
      leave: { opacity: 0, transform: 'translate3d(100%, 0, 0)' },
    },
  },

  /** 淡入上移（PC / iPad 默认，干净优雅） */
  fadeUp: {
    push: {
      from:  { opacity: 0, transform: 'translate3d(0, 12px, 0)' },
      enter: { opacity: 1, transform: 'translate3d(0, 0px, 0)' },
      leave: { opacity: 0, transform: 'translate3d(0, -8px, 0)' },
    },
    pop: {
      from:  { opacity: 0, transform: 'translate3d(0, -8px, 0)' },
      enter: { opacity: 1, transform: 'translate3d(0, 0px, 0)' },
      leave: { opacity: 0, transform: 'translate3d(0, 12px, 0)' },
    },
  },

  /** 淡入淡出（无方向感） */
  fade: {
    push: {
      from:  { opacity: 0, transform: 'translate3d(0, 0, 0)' },
      enter: { opacity: 1, transform: 'translate3d(0, 0, 0)' },
      leave: { opacity: 0, transform: 'translate3d(0, 0, 0)' },
    },
    pop: {
      from:  { opacity: 0, transform: 'translate3d(0, 0, 0)' },
      enter: { opacity: 1, transform: 'translate3d(0, 0, 0)' },
      leave: { opacity: 0, transform: 'translate3d(0, 0, 0)' },
    },
  },

  /** 缩放淡入（弹出感） */
  scale: {
    push: {
      from:  { opacity: 0, transform: 'scale3d(0.95, 0.95, 1)' },
      enter: { opacity: 1, transform: 'scale3d(1, 1, 1)' },
      leave: { opacity: 0, transform: 'scale3d(1.02, 1.02, 1)' },
    },
    pop: {
      from:  { opacity: 0, transform: 'scale3d(1.02, 1.02, 1)' },
      enter: { opacity: 1, transform: 'scale3d(1, 1, 1)' },
      leave: { opacity: 0, transform: 'scale3d(0.95, 0.95, 1)' },
    },
  },

  /** 底部滑入 */
  slideUp: {
    push: {
      from:  { opacity: 0, transform: 'translate3d(0, 40px, 0)' },
      enter: { opacity: 1, transform: 'translate3d(0, 0px, 0)' },
      leave: { opacity: 0, transform: 'translate3d(0, -20px, 0)' },
    },
    pop: {
      from:  { opacity: 0, transform: 'translate3d(0, -20px, 0)' },
      enter: { opacity: 1, transform: 'translate3d(0, 0px, 0)' },
      leave: { opacity: 0, transform: 'translate3d(0, 40px, 0)' },
    },
  },
};
