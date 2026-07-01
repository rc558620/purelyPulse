/// <reference types="vitest" />
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'node:path'
import type { Plugin } from 'vite'

const resolvePath = (relativePath: string) => path.resolve(__dirname, relativePath)

const alias = [
  [
    '@components/ui/data-display/ChartRenderer',
    './src/components/ui/data-display/ChartRenderer/ChartRenderer',
  ],
  ['@components', './src/components'],
  ['@', './src'],
  ['@utils', './src/utils'],
  ['@assets', './src/assets'],
  ['@constants', './src/constants'],
  ['@contexts', './src/contexts'],
  ['@hooks', './src/hooks'],
  ['@pages', './src/pages'],
  ['@router', './src/router'],
  ['@stores', './src/stores'],
  ['@styles', './src/styles'],
].map(([find, replacement]) => ({
  find,
  replacement: resolvePath(replacement),
}))

function manualChunks(id: string) {
  if (!id.includes('node_modules')) {
    return undefined
  }

  if (
    id.includes('/node_modules/echarts/') ||
    id.includes('/node_modules/zrender/') ||
    id.includes('/node_modules/tslib/')
  ) {
    return 'vendor-echarts'
  }

  if (
    id.includes('/node_modules/react/') ||
    id.includes('/node_modules/react-dom/') ||
    id.includes('/node_modules/scheduler/')
  ) {
    return 'vendor-react'
  }

  if (id.includes('/node_modules/react-router/') || id.includes('/node_modules/react-router-dom/')) {
    return 'vendor-router'
  }

  if (
    id.includes('/node_modules/@react-spring/') ||
    id.includes('/node_modules/@use-gesture/')
  ) {
    return 'vendor-motion'
  }

  if (id.includes('/node_modules/ahooks/')) {
    return 'vendor-ahooks'
  }

  if (id.includes('/node_modules/react-easy-crop/')) {
    return 'vendor-crop'
  }

  return 'vendor-misc'
}

// https://vite.dev/config/
// VITE_BASE_URL 由 GitHub Actions 的 configure-pages 步骤注入，例如 /purelyPulse/
// 本地开发时不设置该变量，base 默认为 /
const base = process.env.VITE_BASE_URL ? new URL(process.env.VITE_BASE_URL).pathname : '/'

const securityHeadersPlugin: Plugin = {
  name: 'security-headers',
  configureServer(server) {
    server.middlewares.use((_req, res, next) => {
      res.setHeader('X-Frame-Options', 'DENY')
      res.setHeader(
        'Content-Security-Policy',
        "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self'; connect-src 'self' ws: wss:; frame-ancestors 'none'; base-uri 'self'; form-action 'self'",
      )
      next()
    })
  },
}

export default defineConfig({
  plugins: [securityHeadersPlugin, react()],
  base,
  server: {
    // 仅监听 localhost，防止公共网络暴露开发服务器
    host: 'localhost',

    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
  resolve: {
    alias,
  },
  esbuild: {
    // 生产构建移除 console 和 debugger（esbuild Build API 选项，Vite 类型定义未包含）
    drop: ['console', 'debugger'],
  } as import('vite').ESBuildOptions & { drop: string[] },
  build: {
    modulePreload: {
      resolveDependencies: (_filename, deps, context) => {
        if (context.hostType !== 'html') return deps
        return deps.filter((dep) => !dep.includes('vendor-echarts'))
      },
    },
    rollupOptions: {
      output: {
        hoistTransitiveImports: false,
        manualChunks,
      },
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    css: true,
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'json-summary', 'lcov'],
      exclude: [
        'node_modules/',
        'src/test/setup.ts',
        'src/**/*.d.ts',
        'src/**/mockData/**',
        'src/**/*.{test,spec}.{ts,tsx}',
        '**/*.config.*',
      ],
      thresholds: {
        statements: 100,
        branches: 100,
        functions: 100,
        lines: 100,
      },
    },
  },
})
