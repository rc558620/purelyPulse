/**
 * ConfirmModal 组件单元测试
 *
 * 覆盖范围：
 *  ─ 渲染与可见性
 *    1. visible=false 时不渲染任何内容
 *    2. visible=true 时渲染到 document.body（Portal）
 *    3. 标题正常渲染
 *    4. description 正常渲染
 *    5. 无 description 时不渲染 <p> 节点
 *    6. children 正常渲染
 *    7. icon 正常渲染
 *    8. 无 icon 时不渲染 icon 容器
 *    9. className 被应用到 overlay 根节点
 *  ─ 默认文案
 *    10. cancelText 默认「取消」
 *    11. confirmText 默认「确定」
 *    12. 自定义 cancelText
 *    13. 自定义 confirmText
 *  ─ 按钮交互
 *    14. 点击「取消」触发 onCancel
 *    15. 点击「确认」触发 onConfirm
 *    16. 点击「取消」不触发 onConfirm
 *    17. 点击「确认」不触发 onCancel
 *  ─ variant 样式
 *    18. variant='default' 时确认按钮不含 danger/warning/primary class
 *    19. variant='danger'  时确认按钮含 danger class，图标容器含 danger class
 *    20. variant='primary' 时确认按钮含 primary class，图标容器含 primary class
 *    21. variant='warning' 时确认按钮含 warning class，图标容器含 warning class
 *    22. variant 变更时 class 正确切换
 *  ─ 无障碍属性
 *    23. overlay 具有 role="dialog"
 *    24. overlay 具有 aria-modal="true"
 *    25. overlay 具有 aria-labelledby 指向标题 id
 *    26. icon 容器具有 aria-hidden="true"
 *  ─ Portal 挂载
 *    27. 渲染容器为空，内容在 body
 *  ─ visible 切换
 *    28. visible false→true 重新出现
 *    29. visible true→false 内容消失
 *  ─ React.memo
 *    30. 组件为 memo 包裹
 *  ─ 卸载清理
 *    31. unmount 后 body 内容移除
 *  ─ ESC 键关闭（Bug 2 修复）
 *    32. 按 ESC 键触发 onCancel
 *  ─ 滚动锁定（Bug 7 修复）
 *    33. visible=true 时 body overflow 为 hidden
 *  ─ id 唯一性（Bug 11 修复）
 *    34. 多个 ConfirmModal 实例标题 id 不重复
 */

import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ConfirmModal } from '../Modal/index';
import type { ConfirmModalVariant } from '../Modal/ConfirmModal';

// ─────────────────────────────────────────────────────────────────────────────
// 辅助：渲染默认可见的 ConfirmModal
// ─────────────────────────────────────────────────────────────────────────────
function renderConfirm(overrides: Partial<React.ComponentProps<typeof ConfirmModal>> = {}) {
  const defaults = {
    visible: true,
    title: '确认操作',
    onCancel: vi.fn(),
    onConfirm: vi.fn(),
  };
  return render(<ConfirmModal {...defaults} {...overrides} />);
}

// ─── 1. 渲染与可见性 ─────────────────────────────────────────────────────────
describe('ConfirmModal – 渲染与可见性', () => {
  it('visible=false 时不渲染任何内容', () => {
    const { container } = renderConfirm({ visible: false });
    expect(container.firstChild).toBeNull();
    expect(screen.queryByText('确认操作')).toBeNull();
  });

  it('visible=true 时渲染标题', () => {
    renderConfirm({ visible: true });
    expect(screen.getByText('确认操作')).toBeInTheDocument();
  });

  it('description 正常渲染', () => {
    renderConfirm({ description: '此操作不可逆，请谨慎' });
    expect(screen.getByText('此操作不可逆，请谨慎')).toBeInTheDocument();
  });

  it('无 description 时不渲染描述段落', () => {
    const { container } = renderConfirm();
    // 不传 description，不渲染 <p class*="modalDesc">
    const desc = container.ownerDocument.body.querySelector('[class*="modalDesc"]');
    expect(desc).toBeNull();
  });

  it('description 支持 ReactNode', () => {
    renderConfirm({ description: <strong data-testid="desc-node">重要提示</strong> });
    expect(screen.getByTestId('desc-node')).toBeInTheDocument();
  });

  it('children 正常渲染', () => {
    renderConfirm({ children: <div data-testid="extra-content">额外内容</div> });
    expect(screen.getByTestId('extra-content')).toBeInTheDocument();
  });

  it('icon 正常渲染', () => {
    renderConfirm({ icon: <span data-testid="icon-node">🗑️</span> });
    expect(screen.getByTestId('icon-node')).toBeInTheDocument();
  });

  it('无 icon 时不渲染 icon 容器', () => {
    const { container } = renderConfirm();
    const iconWrapper = container.ownerDocument.body.querySelector('[class*="modalIcon"]');
    expect(iconWrapper).toBeNull();
  });

  it('className 被应用到 overlay 根节点', () => {
    renderConfirm({ className: 'test-confirm-overlay' });
    const overlay = document.body.querySelector('.test-confirm-overlay');
    expect(overlay).toBeInTheDocument();
  });
});

// ─── 2. 默认文案 ──────────────────────────────────────────────────────────────
describe('ConfirmModal – 默认文案', () => {
  it('cancelText 默认值为「取消」', () => {
    renderConfirm();
    expect(screen.getByRole('button', { name: '取消' })).toBeInTheDocument();
  });

  it('confirmText 默认值为「确定」', () => {
    renderConfirm();
    expect(screen.getByRole('button', { name: '确定' })).toBeInTheDocument();
  });

  it('自定义 cancelText 正常展示', () => {
    renderConfirm({ cancelText: '再想想' });
    expect(screen.getByRole('button', { name: '再想想' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '取消' })).toBeNull();
  });

  it('自定义 confirmText 正常展示', () => {
    renderConfirm({ confirmText: '确定删除' });
    expect(screen.getByRole('button', { name: '确定删除' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '确定' })).toBeNull();
  });
});

// ─── 3. 按钮交互 ──────────────────────────────────────────────────────────────
describe('ConfirmModal – 按钮交互', () => {
  it('点击「取消」触发 onCancel 一次', async () => {
    const user = userEvent.setup();
    const onCancel = vi.fn();
    renderConfirm({ onCancel });
    await user.click(screen.getByRole('button', { name: '取消' }));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('点击「确定」触发 onConfirm 一次', async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();
    renderConfirm({ onConfirm });
    await user.click(screen.getByRole('button', { name: '确定' }));
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it('点击「取消」不触发 onConfirm', async () => {
    const user = userEvent.setup();
    const onCancel = vi.fn();
    const onConfirm = vi.fn();
    renderConfirm({ onCancel, onConfirm });
    await user.click(screen.getByRole('button', { name: '取消' }));
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it('点击「确定」不触发 onCancel', async () => {
    const user = userEvent.setup();
    const onCancel = vi.fn();
    const onConfirm = vi.fn();
    renderConfirm({ onCancel, onConfirm });
    await user.click(screen.getByRole('button', { name: '确定' }));
    expect(onCancel).not.toHaveBeenCalled();
  });

  it('取消按钮具有 type="button"', () => {
    renderConfirm();
    expect(screen.getByRole('button', { name: '取消' })).toHaveAttribute('type', 'button');
  });

  it('确定按钮具有 type="button"', () => {
    renderConfirm();
    expect(screen.getByRole('button', { name: '确定' })).toHaveAttribute('type', 'button');
  });
});

// ─── 4. variant 样式 ──────────────────────────────────────────────────────────
describe('ConfirmModal – variant 样式', () => {
  const variants: ConfirmModalVariant[] = ['default', 'danger', 'primary', 'warning'];

  it('variant=default 时确认按钮不含 danger/warning/primary class', () => {
    renderConfirm({ variant: 'default' });
    const btn = screen.getByRole('button', { name: '确定' });
    expect(btn.className).not.toMatch(/danger/i);
    expect(btn.className).not.toMatch(/warning/i);
    expect(btn.className).not.toMatch(/primary/i);
  });

  it('variant=danger 时确认按钮含 Danger class', () => {
    renderConfirm({ variant: 'danger', icon: <span>icon</span> });
    const btn = screen.getByRole('button', { name: '确定' });
    expect(btn.className).toMatch(/[Dd]anger/);
  });

  it('variant=danger 时图标容器含 Danger class', () => {
    renderConfirm({ variant: 'danger', icon: <span data-testid="icon">icon</span> });
    const iconWrapper = screen.getByTestId('icon').parentElement!;
    expect(iconWrapper.className).toMatch(/[Dd]anger/);
  });

  it('variant=primary 时确认按钮含 Primary class', () => {
    renderConfirm({ variant: 'primary', icon: <span>icon</span> });
    const btn = screen.getByRole('button', { name: '确定' });
    expect(btn.className).toMatch(/[Pp]rimary/);
  });

  it('variant=primary 时图标容器含 Primary class', () => {
    renderConfirm({ variant: 'primary', icon: <span data-testid="icon">icon</span> });
    const iconWrapper = screen.getByTestId('icon').parentElement!;
    expect(iconWrapper.className).toMatch(/[Pp]rimary/);
  });

  it('variant=warning 时确认按钮含 Warning class', () => {
    renderConfirm({ variant: 'warning', icon: <span>icon</span> });
    const btn = screen.getByRole('button', { name: '确定' });
    expect(btn.className).toMatch(/[Ww]arning/);
  });

  it('variant=warning 时图标容器含 Warning class', () => {
    renderConfirm({ variant: 'warning', icon: <span data-testid="icon">icon</span> });
    const iconWrapper = screen.getByTestId('icon').parentElement!;
    expect(iconWrapper.className).toMatch(/[Ww]arning/);
  });

  it('variant 从 danger 切换到 default 时 danger class 消失', () => {
    const { rerender } = renderConfirm({ variant: 'danger' });
    let btn = screen.getByRole('button', { name: '确定' });
    expect(btn.className).toMatch(/[Dd]anger/);

    rerender(
      <ConfirmModal
        visible={true}
        title="确认操作"
        variant="default"
        onCancel={vi.fn()}
        onConfirm={vi.fn()}
      />,
    );
    btn = screen.getByRole('button', { name: '确定' });
    expect(btn.className).not.toMatch(/[Dd]anger/);
  });

  it('所有有效 variant 渲染时不抛出错误', () => {
    variants.forEach((v) => {
      expect(() => renderConfirm({ variant: v })).not.toThrow();
    });
  });
});

// ─── 5. 无障碍属性 ───────────────────────────────────────────────────────────
describe('ConfirmModal – 无障碍属性', () => {
  it('overlay 具有 role="dialog"', () => {
    renderConfirm();
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('overlay 具有 aria-modal="true"', () => {
    renderConfirm();
    expect(screen.getByRole('dialog')).toHaveAttribute('aria-modal', 'true');
  });

  it('overlay 具有 aria-labelledby 指向标题 id', () => {
    renderConfirm();
    const dialog = screen.getByRole('dialog');
    const labelledById = dialog.getAttribute('aria-labelledby');
    expect(labelledById).not.toBeNull();
    expect(labelledById).toMatch(/^confirm-modal-title-/);
    const titleEl = document.getElementById(labelledById!);
    expect(titleEl).not.toBeNull();
    expect(titleEl).toContainElement(screen.getByText('确认操作'));
  });

  it('标题元素具有对应 id', () => {
    renderConfirm({ title: '可读标题' });
    const title = screen.getByText('可读标题');
    expect(title.id).toBeTruthy();
    expect(title.id).toMatch(/^confirm-modal-title-/);
  });

  it('icon 容器具有 aria-hidden="true"', () => {
    renderConfirm({ icon: <span data-testid="icon">❌</span> });
    const iconWrapper = screen.getByTestId('icon').parentElement!;
    expect(iconWrapper).toHaveAttribute('aria-hidden', 'true');
  });
});

// ─── 6. Portal 挂载 ───────────────────────────────────────────────────────────
describe('ConfirmModal – Portal 挂载', () => {
  it('渲染容器为空，内容挂载在 document.body', () => {
    const { container } = renderConfirm();
    expect(container.firstChild).toBeNull();
    expect(document.body).toContainElement(screen.getByText('确认操作'));
  });
});

// ─── 7. visible 切换 ──────────────────────────────────────────────────────────
describe('ConfirmModal – visible 切换', () => {
  it('visible false→true 后内容重新出现', () => {
    const { rerender } = renderConfirm({ visible: false });
    expect(screen.queryByText('确认操作')).toBeNull();

    rerender(
      <ConfirmModal
        visible={true}
        title="确认操作"
        onCancel={vi.fn()}
        onConfirm={vi.fn()}
      />,
    );
    expect(screen.getByText('确认操作')).toBeInTheDocument();
  });

  it('visible true→false 后内容消失', () => {
    const { rerender } = renderConfirm({ visible: true });
    expect(screen.getByText('确认操作')).toBeInTheDocument();

    rerender(
      <ConfirmModal
        visible={false}
        title="确认操作"
        onCancel={vi.fn()}
        onConfirm={vi.fn()}
      />,
    );
    expect(screen.queryByText('确认操作')).toBeNull();
  });
});

// ─── 8. React.memo ────────────────────────────────────────────────────────────
describe('ConfirmModal – React.memo', () => {
  it('ConfirmModal 是 React.memo 包裹的组件', () => {
    expect((ConfirmModal as unknown as { $$typeof?: symbol }).$$typeof?.toString()).toContain('memo');
  });
});

// ─── 9. 卸载清理 ──────────────────────────────────────────────────────────────
describe('ConfirmModal – 卸载清理', () => {
  it('unmount 后 body 内容移除', () => {
    const { unmount } = renderConfirm();
    expect(screen.getByText('确认操作')).toBeInTheDocument();
    unmount();
    expect(screen.queryByText('确认操作')).toBeNull();
  });
});

// ─── 10. ESC 键关闭（Bug 2 修复） ────────────────────────────────────────────
describe('ConfirmModal – ESC 键关闭', () => {
  it('按 ESC 键触发 onCancel', () => {
    const onCancel = vi.fn();
    renderConfirm({ onCancel });
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('visible=false 时 ESC 不注册监听', () => {
    const onCancel = vi.fn();
    const { rerender } = renderConfirm({ visible: false, onCancel });
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(onCancel).not.toHaveBeenCalled();

    rerender(
      <ConfirmModal visible={true} title="确认操作" onCancel={onCancel} onConfirm={vi.fn()} />,
    );
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(onCancel).toHaveBeenCalledTimes(1);
  });
});

// ─── 11. 滚动锁定（Bug 7 修复） ──────────────────────────────────────────────
describe('ConfirmModal – 滚动锁定', () => {
  it('visible=true 时 body overflow 为 hidden', () => {
    const originalOverflow = document.body.style.overflow;
    renderConfirm({ visible: true });
    expect(document.body.style.overflow).toBe('hidden');
    document.body.style.overflow = originalOverflow;
  });

  it('卸载后恢复 overflow', () => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'auto';
    const { unmount } = renderConfirm({ visible: true });
    expect(document.body.style.overflow).toBe('hidden');
    unmount();
    expect(document.body.style.overflow).toBe('auto');
    document.body.style.overflow = originalOverflow;
  });
});

// ─── 12. id 唯一性（Bug 11 修复） ────────────────────────────────────────────
describe('ConfirmModal – id 唯一性', () => {
  it('多个 ConfirmModal 实例标题 id 不重复', () => {
    const onCancel1 = vi.fn();
    const onCancel2 = vi.fn();
    const { unmount: unmount1 } = render(
      <ConfirmModal visible={true} title="标题A" onCancel={onCancel1} onConfirm={vi.fn()} />,
    );
    const titleA = screen.getByText('标题A');
    expect(titleA.id).toBeTruthy();
    const id1 = titleA.id;
    unmount1();

    const { unmount: unmount2 } = render(
      <ConfirmModal visible={true} title="标题B" onCancel={onCancel2} onConfirm={vi.fn()} />,
    );
    const titleB = screen.getByText('标题B');
    expect(titleB.id).toBeTruthy();
    expect(titleB.id).not.toBe(id1);
    unmount2();
  });
});

// ─── 13. 严格边界测试 ─────────────────────────────────────────────────────────
describe('ConfirmModal – 严格边界', () => {
  it('children 与 description 同时存在时均正常渲染', () => {
    renderConfirm({
      description: '这是描述',
      children: <div data-testid="extra">额外内容</div>,
    });
    expect(screen.getByText('这是描述')).toBeInTheDocument();
    expect(screen.getByTestId('extra')).toBeInTheDocument();
  });

  it('title 为复杂 ReactNode 时 aria-labelledby 仍能指向标题节点', () => {
    renderConfirm({ title: <span data-testid="rich-title-span">富文本标题</span> });
    const dialog = screen.getByRole('dialog');
    const labelledById = dialog.getAttribute('aria-labelledby');
    expect(labelledById).toMatch(/^confirm-modal-title-/);
    const titleNode = document.getElementById(labelledById!);
    expect(titleNode).not.toBeNull();
    expect(titleNode).toContainElement(screen.getByTestId('rich-title-span'));
  });

  it('不同 variant 下 cancelText/confirmText 不受影响', () => {
    renderConfirm({
      variant: 'danger',
      cancelText: '我再想想',
      confirmText: '强制删除',
    });
    expect(screen.getByRole('button', { name: '我再想想' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '强制删除' })).toBeInTheDocument();
  });

  it('多次点击确认触发对应次数', async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();
    renderConfirm({ onConfirm });
    await user.click(screen.getByRole('button', { name: '确定' }));
    await user.click(screen.getByRole('button', { name: '确定' }));
    expect(onConfirm).toHaveBeenCalledTimes(2);
  });

  it('多次点击取消触发对应次数', async () => {
    const user = userEvent.setup();
    const onCancel = vi.fn();
    renderConfirm({ onCancel });
    await user.click(screen.getByRole('button', { name: '取消' }));
    await user.click(screen.getByRole('button', { name: '取消' }));
    await user.click(screen.getByRole('button', { name: '取消' }));
    expect(onCancel).toHaveBeenCalledTimes(3);
  });

  it('rerender 更换 onConfirm 后点击确定调用新回调', async () => {
    const user = userEvent.setup();
    const onConfirm1 = vi.fn();
    const onConfirm2 = vi.fn();
    const { rerender } = renderConfirm({ onConfirm: onConfirm1 });
    rerender(
      <ConfirmModal
        visible={true}
        title="确认操作"
        onCancel={vi.fn()}
        onConfirm={onConfirm2}
      />,
    );
    await user.click(screen.getByRole('button', { name: '确定' }));
    expect(onConfirm1).not.toHaveBeenCalled();
    expect(onConfirm2).toHaveBeenCalledTimes(1);
  });

  it('rerender 更换 onCancel 后点击取消调用新回调', async () => {
    const user = userEvent.setup();
    const onCancel1 = vi.fn();
    const onCancel2 = vi.fn();
    const { rerender } = renderConfirm({ onCancel: onCancel1 });
    rerender(
      <ConfirmModal
        visible={true}
        title="确认操作"
        onCancel={onCancel2}
        onConfirm={vi.fn()}
      />,
    );
    await user.click(screen.getByRole('button', { name: '取消' }));
    expect(onCancel1).not.toHaveBeenCalled();
    expect(onCancel2).toHaveBeenCalledTimes(1);
  });

  it('所有有效 variant 下标题仍可被渲染', () => {
    const variants: ConfirmModalVariant[] = ['default', 'danger', 'primary', 'warning'];
    variants.forEach((v) => {
      const { unmount } = renderConfirm({ variant: v, title: `标题-${v}` });
      expect(screen.getByText(`标题-${v}`)).toBeInTheDocument();
      unmount();
    });
  });

  it('description 为 ReactNode 时与 children 共存顺序正确（描述在前）', () => {
    const { container } = renderConfirm({
      description: <span data-testid="desc-p">描述段落</span>,
      children: <div data-testid="children-div">子内容</div>,
    });
    const card = container.ownerDocument.body.querySelector('[class*="modalCard"]') as HTMLElement;
    expect(card).not.toBeNull();
    const desc = card.querySelector('[data-testid="desc-p"]');
    const child = card.querySelector('[data-testid="children-div"]');
    expect(desc).not.toBeNull();
    expect(child).not.toBeNull();
    // desc 在 children 之前（compareDocumentPosition: FOLLOWING）
    expect(desc!.compareDocumentPosition(child!)).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
  });

  it('variant="danger" 同时有 icon、description、children 时均正常渲染', () => {
    renderConfirm({
      variant: 'danger',
      icon: <span data-testid="d-icon">❌</span>,
      description: '危险操作',
      children: <input data-testid="d-input" />,
    });
    expect(screen.getByTestId('d-icon')).toBeInTheDocument();
    expect(screen.getByText('危险操作')).toBeInTheDocument();
    expect(screen.getByTestId('d-input')).toBeInTheDocument();
  });
});
