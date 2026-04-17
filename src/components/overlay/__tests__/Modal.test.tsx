/**
 * Modal 组件单元测试
 *
 * 覆盖范围：
 *  ─ 渲染与可见性
 *    1. visible=false 时不渲染任何内容（返回 null）
 *    2. visible=true 时通过 Portal 渲染到 document.body
 *    3. title 文本正常渲染
 *    4. children 内容正常渲染
 *    5. className 被应用到 overlay 根节点
 *  ─ 默认文案
 *    6. cancelText 默认值为「取消」
 *    7. confirmText 默认值为「确定」
 *    8. 自定义 cancelText 正常展示
 *    9. 自定义 confirmText 正常展示
 *  ─ 按钮交互
 *    10. 点击「取消」按钮触发 onCancel
 *    11. 点击「确定」按钮触发 onConfirm
 *    12. 点击遮罩层触发 onCancel
 *    13. 点击弹窗内容区域 **不** 触发 onCancel（stopPropagation 生效）
 *  ─ visible 切换
 *    14. visible 从 true 变 false 后内容从 DOM 移除
 *    15. visible 从 false 变 true 后内容重新出现
 *  ─ Portal 挂载
 *    16. 内容挂载到 document.body（而非当前容器）
 *  ─ memo 优化
 *    17. React.memo 包裹（组件引用稳定）
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Modal } from '../Modal/index';

// ─────────────────────────────────────────────────────────────────────────────
// 辅助：渲染一个 visible 的标准 Modal
// ─────────────────────────────────────────────────────────────────────────────
function renderModal(overrides: Partial<React.ComponentProps<typeof Modal>> = {}) {
  const defaults = {
    visible: true,
    title: '测试标题',
    children: <span data-testid="body-content">弹窗内容</span>,
    onCancel: vi.fn(),
    onConfirm: vi.fn(),
  };
  return render(<Modal {...defaults} {...overrides} />);
}

// ─── 1. 渲染与可见性 ─────────────────────────────────────────────────────────
describe('Modal – 渲染与可见性', () => {
  it('visible=false 时不渲染任何内容', () => {
    const { container } = renderModal({ visible: false });
    // 容器本身为空，Portal 也不渲染
    expect(container.firstChild).toBeNull();
    expect(screen.queryByText('测试标题')).toBeNull();
  });

  it('visible=true 时渲染标题', () => {
    renderModal({ visible: true });
    expect(screen.getByText('测试标题')).toBeInTheDocument();
  });

  it('visible=true 时渲染 children', () => {
    renderModal({ visible: true });
    expect(screen.getByTestId('body-content')).toBeInTheDocument();
    expect(screen.getByText('弹窗内容')).toBeInTheDocument();
  });

  it('title 支持 ReactNode（渲染 JSX 节点）', () => {
    renderModal({ title: <em data-testid="title-node">复杂标题</em> });
    expect(screen.getByTestId('title-node')).toBeInTheDocument();
  });

  it('className 被应用到 overlay 根节点', () => {
    renderModal({ className: 'custom-overlay' });
    // Portal 渲染到 body，用 document.body 查询
    const overlay = document.body.querySelector('.custom-overlay');
    expect(overlay).toBeInTheDocument();
  });
});

// ─── 2. 默认文案 ──────────────────────────────────────────────────────────────
describe('Modal – 默认文案', () => {
  it('cancelText 默认值为「取消」', () => {
    renderModal();
    expect(screen.getByRole('button', { name: '取消' })).toBeInTheDocument();
  });

  it('confirmText 默认值为「确定」', () => {
    renderModal();
    expect(screen.getByRole('button', { name: '确定' })).toBeInTheDocument();
  });

  it('自定义 cancelText 正常展示', () => {
    renderModal({ cancelText: '关闭' });
    expect(screen.getByRole('button', { name: '关闭' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '取消' })).toBeNull();
  });

  it('自定义 confirmText 正常展示', () => {
    renderModal({ confirmText: '提交' });
    expect(screen.getByRole('button', { name: '提交' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '确定' })).toBeNull();
  });
});

// ─── 3. 按钮交互 ──────────────────────────────────────────────────────────────
describe('Modal – 按钮交互', () => {
  it('点击「取消」按钮触发 onCancel', async () => {
    const user = userEvent.setup();
    const onCancel = vi.fn();
    renderModal({ onCancel });
    await user.click(screen.getByRole('button', { name: '取消' }));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('点击「确定」按钮触发 onConfirm', async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();
    renderModal({ onConfirm });
    await user.click(screen.getByRole('button', { name: '确定' }));
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it('点击「确定」不触发 onCancel', async () => {
    const user = userEvent.setup();
    const onCancel = vi.fn();
    const onConfirm = vi.fn();
    renderModal({ onCancel, onConfirm });
    await user.click(screen.getByRole('button', { name: '确定' }));
    expect(onCancel).not.toHaveBeenCalled();
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it('点击「取消」不触发 onConfirm', async () => {
    const user = userEvent.setup();
    const onCancel = vi.fn();
    const onConfirm = vi.fn();
    renderModal({ onCancel, onConfirm });
    await user.click(screen.getByRole('button', { name: '取消' }));
    expect(onConfirm).not.toHaveBeenCalled();
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('点击遮罩层触发 onCancel', () => {
    const onCancel = vi.fn();
    renderModal({ onCancel });
    // 获取 overlay（含 modalOverlay class 的容器）
    // Portal 渲染到 body，直接从 body 获取
    const overlay = document.body.querySelector('[class*="modalOverlay"]') as HTMLElement;
    expect(overlay).not.toBeNull();
    fireEvent.click(overlay);
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('点击弹窗内容区域不触发 onCancel（stopPropagation）', () => {
    const onCancel = vi.fn();
    renderModal({ onCancel });
    // 点击内容区域（modalContent）
    const content = document.body.querySelector('[class*="modalContent"]') as HTMLElement;
    expect(content).not.toBeNull();
    fireEvent.click(content);
    expect(onCancel).not.toHaveBeenCalled();
  });

  it('点击标题文本（内容区内）不触发 onCancel', () => {
    const onCancel = vi.fn();
    renderModal({ onCancel });
    fireEvent.click(screen.getByText('测试标题'));
    expect(onCancel).not.toHaveBeenCalled();
  });
});

// ─── 4. visible 切换 ──────────────────────────────────────────────────────────
describe('Modal – visible 切换', () => {
  it('visible 从 true 变 false 后内容从 DOM 移除', () => {
    const { rerender } = renderModal({ visible: true });
    expect(screen.getByText('测试标题')).toBeInTheDocument();

    rerender(
      <Modal
        visible={false}
        title="测试标题"
        onCancel={vi.fn()}
        onConfirm={vi.fn()}
      >
        <span>弹窗内容</span>
      </Modal>,
    );
    expect(screen.queryByText('测试标题')).toBeNull();
  });

  it('visible 从 false 变 true 后内容重新出现', () => {
    const { rerender } = renderModal({ visible: false });
    expect(screen.queryByText('测试标题')).toBeNull();

    rerender(
      <Modal
        visible={true}
        title="测试标题"
        onCancel={vi.fn()}
        onConfirm={vi.fn()}
      >
        <span>弹窗内容</span>
      </Modal>,
    );
    expect(screen.getByText('测试标题')).toBeInTheDocument();
  });
});

// ─── 5. Portal 挂载 ───────────────────────────────────────────────────────────
describe('Modal – Portal 挂载', () => {
  it('内容挂载到 document.body（而非渲染容器）', () => {
    const { container } = renderModal({ visible: true });
    // 渲染容器本身应该是空的（内容走 Portal 到 body）
    expect(container.firstChild).toBeNull();
    // body 里能找到标题
    expect(document.body).toContainElement(screen.getByText('测试标题'));
  });
});

// ─── 6. React.memo ────────────────────────────────────────────────────────────
describe('Modal – React.memo', () => {
  it('Modal 是 React.memo 包裹的组件', () => {
    // memo 组件的 $$typeof 为 REACT_MEMO_TYPE
    expect((Modal as unknown as { $$typeof?: symbol }).$$typeof?.toString()).toContain('memo');
  });
});

// ─── 7. 卸载清理 ──────────────────────────────────────────────────────────────
describe('Modal – 卸载清理', () => {
  it('组件卸载后 Portal 内容从 body 移除', () => {
    const { unmount } = renderModal({ visible: true });
    expect(screen.getByText('测试标题')).toBeInTheDocument();
    unmount();
    expect(screen.queryByText('测试标题')).toBeNull();
  });
});
