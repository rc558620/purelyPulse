/// <reference types="vitest" />
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'node:path'

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

export default defineConfig({
  plugins: [react()],
  base,
  server: {
    host: true,
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
