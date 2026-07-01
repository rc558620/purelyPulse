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
 *  ─ 无障碍属性（Bug 3 修复）
 *    18. overlay 具有 role="dialog"
 *    19. overlay 具有 aria-modal="true"
 *    20. overlay 具有 aria-labelledby 指向标题
 *    21. 标题元素具有对应 id
 *  ─ 按钮类型（Bug 1 修复）
 *    22. 取消按钮具有 type="button"
 *    23. 确定按钮具有 type="button"
 *  ─ ESC 键关闭（Bug 2 修复）
 *    24. 按 ESC 键触发 onCancel
 *    25. visible=false 时 ESC 不注册监听
 *  ─ 滚动锁定（Bug 7 修复）
 *    26. visible=true 时 body overflow 为 hidden
 *    27. visible 变 false 或卸载后恢复 overflow
 *  ─ id 唯一性（Bug 11 修复）
 *    28. 多个 Modal 实例标题 id 不重复
 */

import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
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

// ─── 8. 无障碍属性（Bug 3 修复） ──────────────────────────────────────────────
describe('Modal – 无障碍属性', () => {
  it('overlay 具有 role="dialog"', () => {
    renderModal();
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('overlay 具有 aria-modal="true"', () => {
    renderModal();
    expect(screen.getByRole('dialog')).toHaveAttribute('aria-modal', 'true');
  });

  it('overlay 具有 aria-labelledby 指向标题 id', () => {
    renderModal();
    const dialog = screen.getByRole('dialog');
    const labelledById = dialog.getAttribute('aria-labelledby');
    expect(labelledById).not.toBeNull();
    // 标题元素存在且 id 匹配
    const titleEl = document.getElementById(labelledById!);
    expect(titleEl).not.toBeNull();
    expect(titleEl).toContainElement(screen.getByText('测试标题'));
  });

  it('标题元素具有对应 id', () => {
    renderModal();
    const titleEl = screen.getByText('测试标题');
    expect(titleEl.id).toBeTruthy();
    expect(titleEl.id).toMatch(/^modal-title-/);
  });
});

// ─── 9. 按钮类型（Bug 1 修复） ────────────────────────────────────────────────
describe('Modal – 按钮类型', () => {
  it('取消按钮具有 type="button"', () => {
    renderModal();
    expect(screen.getByRole('button', { name: '取消' })).toHaveAttribute('type', 'button');
  });

  it('确定按钮具有 type="button"', () => {
    renderModal();
    expect(screen.getByRole('button', { name: '确定' })).toHaveAttribute('type', 'button');
  });
});

// ─── 10. ESC 键关闭（Bug 2 修复） ─────────────────────────────────────────────
describe('Modal – ESC 键关闭', () => {
  it('按 ESC 键触发 onCancel', () => {
    const onCancel = vi.fn();
    renderModal({ onCancel });
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('visible=false 时 ESC 不注册监听', () => {
    const onCancel = vi.fn();
    const { rerender } = renderModal({ visible: false, onCancel });
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(onCancel).not.toHaveBeenCalled();

    // 变为 true 后 ESC 生效
    rerender(
      <Modal visible={true} title="测试标题" onCancel={onCancel} onConfirm={vi.fn()}>
        <span>弹窗内容</span>
      </Modal>,
    );
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(onCancel).toHaveBeenCalledTimes(1);
  });
});

// ─── 11. 滚动锁定（Bug 7 修复） ──────────────────────────────────────────────
describe('Modal – 滚动锁定', () => {
  it('visible=true 时 body overflow 为 hidden', () => {
    const originalOverflow = document.body.style.overflow;
    renderModal({ visible: true });
    expect(document.body.style.overflow).toBe('hidden');
    // 还原
    document.body.style.overflow = originalOverflow;
  });

  it('visible 变 false 后恢复 overflow', () => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'auto';
    const { rerender } = renderModal({ visible: true });
    expect(document.body.style.overflow).toBe('hidden');

    rerender(
      <Modal visible={false} title="测试标题" onCancel={vi.fn()} onConfirm={vi.fn()}>
        <span>弹窗内容</span>
      </Modal>,
    );
    expect(document.body.style.overflow).toBe('auto');
    // 还原
    document.body.style.overflow = originalOverflow;
  });

  it('卸载后恢复 overflow', () => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'auto';
    const { unmount } = renderModal({ visible: true });
    expect(document.body.style.overflow).toBe('hidden');
    unmount();
    expect(document.body.style.overflow).toBe('auto');
    // 还原
    document.body.style.overflow = originalOverflow;
  });
});

// ─── 12. id 唯一性（Bug 11 修复） ─────────────────────────────────────────────
describe('Modal – id 唯一性', () => {
  it('多个 Modal 实例标题 id 不重复', () => {
    const onCancel1 = vi.fn();
    const onCancel2 = vi.fn();
    const { unmount: unmount1 } = render(
      <Modal visible={true} title="标题A" onCancel={onCancel1} onConfirm={vi.fn()}>
        <span>内容A</span>
      </Modal>,
    );
    const titleA = screen.getByText('标题A');
    expect(titleA.id).toBeTruthy();

    const id1 = titleA.id;
    unmount1();

    const { unmount: unmount2 } = render(
      <Modal visible={true} title="标题B" onCancel={onCancel2} onConfirm={vi.fn()}>
        <span>内容B</span>
      </Modal>,
    );
    const titleB = screen.getByText('标题B');
    expect(titleB.id).toBeTruthy();
    expect(titleB.id).not.toBe(id1);
    unmount2();
  });
});

// ─── 13. 严格边界测试 ──────────────────────────────────────────────────────────
describe('Modal – 严格边界', () => {
  it('多次点击「取消」回调被调用对应次数', async () => {
    const user = userEvent.setup();
    const onCancel = vi.fn();
    renderModal({ onCancel });
    await user.click(screen.getByRole('button', { name: '取消' }));
    await user.click(screen.getByRole('button', { name: '取消' }));
    await user.click(screen.getByRole('button', { name: '取消' }));
    expect(onCancel).toHaveBeenCalledTimes(3);
  });

  it('多次点击「确定」回调被调用对应次数', async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();
    renderModal({ onConfirm });
    await user.click(screen.getByRole('button', { name: '确定' }));
    await user.click(screen.getByRole('button', { name: '确定' }));
    expect(onConfirm).toHaveBeenCalledTimes(2);
  });

  it('多次点击遮罩 onCancel 被调用对应次数', () => {
    const onCancel = vi.fn();
    renderModal({ onCancel });
    const overlay = document.body.querySelector('[class*="modalOverlay"]') as HTMLElement;
    fireEvent.click(overlay);
    fireEvent.click(overlay);
    expect(onCancel).toHaveBeenCalledTimes(2);
  });

  it('children 为 null 时不渲染 body 内容但弹窗正常出现', () => {
    renderModal({ children: null });
    expect(screen.getByText('测试标题')).toBeInTheDocument();
  });

  it('cancelText 与 confirmText 相同时两个按钮都渲染', () => {
    renderModal({ cancelText: '关闭', confirmText: '关闭' });
    const buttons = screen.getAllByRole('button', { name: '关闭' });
    expect(buttons).toHaveLength(2);
  });

  it('rerender 更换 onConfirm 后点击确定调用新回调', async () => {
    const user = userEvent.setup();
    const onConfirm1 = vi.fn();
    const onConfirm2 = vi.fn();
    const { rerender } = renderModal({ onConfirm: onConfirm1 });
    rerender(
      <Modal
        visible={true}
        title="测试标题"
        onCancel={vi.fn()}
        onConfirm={onConfirm2}
      >
        <span>内容</span>
      </Modal>,
    );
    await user.click(screen.getByRole('button', { name: '确定' }));
    expect(onConfirm1).not.toHaveBeenCalled();
    expect(onConfirm2).toHaveBeenCalledTimes(1);
  });

  it('rerender 更换 onCancel 后点击取消调用新回调', async () => {
    const user = userEvent.setup();
    const onCancel1 = vi.fn();
    const onCancel2 = vi.fn();
    const { rerender } = renderModal({ onCancel: onCancel1 });
    rerender(
      <Modal
        visible={true}
        title="测试标题"
        onCancel={onCancel2}
        onConfirm={vi.fn()}
      >
        <span>内容</span>
      </Modal>,
    );
    await user.click(screen.getByRole('button', { name: '取消' }));
    expect(onCancel1).not.toHaveBeenCalled();
    expect(onCancel2).toHaveBeenCalledTimes(1);
  });

  it('title 为复杂 ReactNode + children 同时存在时均正常渲染', () => {
    renderModal({
      title: <em data-testid="complex-title">复杂标题</em>,
      children: <strong data-testid="complex-body">复杂内容</strong>,
    });
    expect(screen.getByTestId('complex-title')).toBeInTheDocument();
    expect(screen.getByTestId('complex-body')).toBeInTheDocument();
  });

  it('空 cancelText 渲染按钮但文案为空', () => {
    renderModal({ cancelText: '' });
    // 按钮仍然存在（DOM 节点保留），只是文字为空
    const footer = document.body.querySelector('[class*="modalFooter"]') as HTMLElement;
    expect(footer).not.toBeNull();
    expect(footer.querySelectorAll('button').length).toBe(2);
  });

  it('title 为 ReactNode 时 aria-labelledby 仍能指向标题节点', () => {
    renderModal({ title: <span data-testid="rich-title">富文本标题</span> });
    const dialog = screen.getByRole('dialog');
    const labelledById = dialog.getAttribute('aria-labelledby');
    expect(labelledById).not.toBeNull();
    const titleNode = document.getElementById(labelledById!);
    expect(titleNode).not.toBeNull();
    expect(titleNode).toContainElement(screen.getByTestId('rich-title'));
  });
});
