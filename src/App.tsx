import { Suspense, useMemo } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { animated } from '@react-spring/web';

// ─── 路由配置 ────────────────────────────────────────────────────────────────
import { routeConfig } from '@/router';

// ─── 动画 Hook ───────────────────────────────────────────────────────────────
import { useRouteTransition } from '@hooks/useRouteTransition';

// ─── 全局 UI ─────────────────────────────────────────────────────────────────
// 全局 Toast 提示容器，挂载一次即可响应所有页面的 showToast 调用。
import { ToastContainer } from '@components/ui/feedback/Toast';
// 全局用户信息上下文，提供头像等用户数据的跨页面共享与持久化。
import { UserProvider } from '@contexts';

import styles from './App.module.less';

// ─── 动画路由（纯渲染层）─────────────────────────────────────────────────────

/**
 * AnimatedRoutes —— 纯渲染层，无业务逻辑。
 *
 * Suspense 放在动画容器【外层】是关键：
 *  - chunk 未就绪时，Suspense 拦截整个动画层，旧页面保持可见（无 fallback 渲染）
 *  - chunk 就绪后，动画才开始播放，用户看到的始终是：旧页面 → 动画 → 新页面
 *  - 若 Suspense 在动画容器【内层】，空白 fallback 会随动画一起播放出来 → 白屏
 */
function AnimatedRoutes() {
  const transitions = useRouteTransition();

  // routeConfig 是模块级常量，永远不变。
  // 用 useMemo(空依赖) 缓存 map 结果，整个应用生命周期只计算一次，
  // 避免每次路由切换（location 变化 → AnimatedRoutes 重渲染）重新分配 JSX 数组对象。
  const routeElements = useMemo(
    () => routeConfig.map((route) => (
      <Route key={route.path} path={route.path} element={route.element} />
    )),
    [],
  );

  return (
    <Suspense fallback={null}>
      <div className={styles.routerContainer}>
        {transitions((style, loc) => (
          <animated.div className={styles.animatedPage} style={style}>
            {/* Routes 透传动画帧的 loc，确保路由与动画状态严格同步。 */}
            <Routes location={loc}>
              {routeElements}
            </Routes>
          </animated.div>
        ))}
      </div>
    </Suspense>
  );
}

// ─── 根组件 ───────────────────────────────────────────────────────────────────

function App() {
  return (
    <UserProvider>
      <BrowserRouter>
        <AnimatedRoutes />
        {/* 全局 Toast，渲染在路由树外层，不随页面切换卸载。 */}
        <ToastContainer />
      </BrowserRouter>
    </UserProvider>
  );
}

export default App;
