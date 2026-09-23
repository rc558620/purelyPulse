/**
 * 图表默认高度（px）
 *
 * 被两处共用，必须保持一致，否则 lazy-load 完成瞬间会出现高度跳变：
 *  - Echarts：未显式传 height 时的兜底内联高度
 *  - ChartRenderer：Suspense fallback（骨架屏）与图表共享的尺寸
 *
 * 注意：Echarts 组件本体是 React.lazy 懒加载的，所以这个常量必须放在独立模块，
 * 否则 ChartRenderer 静态 import 时会把整个 echarts bundle 拖进主包。
 */
export const DEFAULT_CHART_HEIGHT = 300;
