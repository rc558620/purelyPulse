import { Suspense, useEffect, useMemo } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { animated } from '@react-spring/web';

import { idlePreloadRoutePaths, preloadRoutes, routeConfig } from '@/router';
import { useRouteTransition } from '@hooks/useRouteTransition';
import { ToastContainer } from '@components/ui/feedback/Toast';
import { UserProvider } from '@contexts';
import { configureHttpClient } from '@utils/http';
import { ROUTE_PATHS } from '@/router/paths';
import { clearAuthSession, getPersistedAccessToken } from '@pages/login/shared/authSession';

import styles from './App.module.less';

function AnimatedRoutes() {
  const transitions = useRouteTransition();

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
            <Routes location={loc}>
              {routeElements}
            </Routes>
          </animated.div>
        ))}
      </div>
    </Suspense>
  );
}

type IdleCallbackHandle = number;
type IdleCallbackOptions = { timeout?: number };
type IdleDeadline = { didTimeout: boolean; timeRemaining: () => number };
type IdleCallback = (deadline: IdleDeadline) => void;

type IdleCapableWindow = Window & typeof globalThis & {
  requestIdleCallback?: (callback: IdleCallback, options?: IdleCallbackOptions) => IdleCallbackHandle;
  cancelIdleCallback?: (handle: IdleCallbackHandle) => void;
};

function RouteIdlePreloader() {
  const location = useLocation();

  useEffect(() => {
    const currentWindow = window as IdleCapableWindow;
    const preload = () => {
      preloadRoutes(idlePreloadRoutePaths, location.pathname);
    };

    if (currentWindow.requestIdleCallback) {
      const idleHandle = currentWindow.requestIdleCallback(() => {
        preload();
      }, { timeout: 1200 });

      return () => {
        currentWindow.cancelIdleCallback?.(idleHandle);
      };
    }

    const timeoutId = window.setTimeout(preload, 500);
    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [location.pathname]);

  return null;
}

function App() {
  useEffect(() => {
    configureHttpClient({
      getAccessToken: getPersistedAccessToken,
      onUnauthorized: () => {
        clearAuthSession();

        if (window.location.pathname === ROUTE_PATHS.login) {
          return;
        }

        const redirectUrl = new URL(ROUTE_PATHS.login, window.location.origin);
        redirectUrl.searchParams.set(
          'redirect',
          `${window.location.pathname}${window.location.search}${window.location.hash}`,
        );
        window.location.replace(redirectUrl.toString());
      },
    });
  }, []);

  return (
    <UserProvider>
      <BrowserRouter>
        <RouteIdlePreloader />
        <AnimatedRoutes />
        <ToastContainer />
      </BrowserRouter>
    </UserProvider>
  );
}

export default App;
