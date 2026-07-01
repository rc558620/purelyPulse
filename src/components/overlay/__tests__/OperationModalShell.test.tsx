/**
 * OperationModalShell 组件单元测试
 *
 * 覆盖范围：
 *  ─ 基础渲染
 *    1.  渲染 role="dialog"
 *    2.  aria-modal="true"
 *    3.  aria-label 使用传入值
 *    4.  标题文字渲染
 *    5.  标题左侧 icon 渲染
 *    6.  children 渲染
 *    7.  默认 confirmText='确认'
 *    8.  默认 cancelText='取消'
 *    9.  自定义 confirmText
 *    10. 自定义 cancelText
 *    11. confirmIcon 渲染
 *    12. 不传 confirmIcon 时确认按钮内无图标
 *  ─ 按钮交互
 *    13. 点击关闭按钮触发 onClose
 *    14. 点击取消按钮触发 onClose
 *    15. 点击确认按钮触发 onConfirm
 *    16. 点击 backdrop 触发 onClose
 *    17. 点击卡片内部不触发 onClose（stopPropagation）
 *    18. 点击 children 内容不触发 backdrop 关闭
 *  ─ 键盘事件
 *    19. 按 Escape 触发 onClose
 *    20. 非 Escape 按键不触发 onClose
 *    21. unmount 后移除 keydown 监听
 *    22. rerender 更换 onClose 后，Escape 调用最新回调
 *  ─ variant 分支
 *    23. 默认 variant='sheet'，卡片无 center class
 *    24. variant='center' 时卡片含 center class
 *    25. variant 从 sheet 切换到 center 时 class 更新
 *  ─ maxWidth
 *    26. 不传 maxWidth 时根节点无 style
 *    27. 传 maxWidth 时写入 --modal-max-width CSS 变量
 *    28. rerender 更换 maxWidth 时 CSS 变量正确更新
 *  ─ 按钮结构与无障碍
 *    29. 关闭按钮 aria-label="关闭"
 *    30. 取消按钮 type="button"
 *    31. 确认按钮 type="button"
 *    32. 关闭按钮 type="button"
 *    33. confirmIcon 与文本同时存在时都渲染
 *  ─ 清理
 *    34. unmount 后 DOM 清理
 *    35. unmount 后 Escape 不再触发 onClose
 */

import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import OperationModalShell from '../OperationModalShell/OperationModalShell';

// ─────────────────────────────────────────────────────────────────────────────
// 辅助：渲染标准 OperationModalShell
// ─────────────────────────────────────────────────────────────────────────────
function renderShell(overrides: Partial<React.ComponentProps<typeof OperationModalShell>> = {}) {
  const defaults = {
    ariaLabel: '测试弹窗',
    icon: <span data-testid="shell-icon">📦</span>,
    title: '弹窗标题',
    onClose: vi.fn(),
    onConfirm: vi.fn(),
    children: <div data-testid="shell-body">内容区</div>,
  };
  return render(<OperationModalShell {...defaults} {...overrides} />);
}

// ─── 1. 基础渲染 ──────────────────────────────────────────────────────────────
describe('OperationModalShell – 基础渲染', () => {
  it('渲染 role="dialog"', () => {
    renderShell();
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('aria-modal="true"', () => {
    renderShell();
    expect(screen.getByRole('dialog')).toHaveAttribute('aria-modal', 'true');
  });

  it('aria-label 使用传入值', () => {
    renderShell({ ariaLabel: '新增进货单' });
    expect(screen.getByRole('dialog')).toHaveAttribute('aria-label', '新增进货单');
  });

  it('标题文字正常渲染', () => {
    renderShell({ title: '自定义标题' });
    expect(screen.getByText('自定义标题')).toBeInTheDocument();
  });

  it('标题左侧 icon 正常渲染', () => {
    renderShell();
    expect(screen.getByTestId('shell-icon')).toBeInTheDocument();
  });

  it('children 正常渲染', () => {
    renderShell();
    expect(screen.getByTestId('shell-body')).toBeInTheDocument();
    expect(screen.getByText('内容区')).toBeInTheDocument();
  });

  it('默认 confirmText="确认"', () => {
    renderShell();
    expect(screen.getByRole('button', { name: /^确认$/ })).toBeInTheDocument();
  });

  it('默认 cancelText="取消"', () => {
    renderShell();
    expect(screen.getByRole('button', { name: '取消' })).toBeInTheDocument();
  });

  it('自定义 confirmText', () => {
    renderShell({ confirmText: '确认进货' });
    expect(screen.getByRole('button', { name: /确认进货/ })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /^确认$/ })).toBeNull();
  });

  it('自定义 cancelText', () => {
    renderShell({ cancelText: '返回' });
    expect(screen.getByRole('button', { name: '返回' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '取消' })).toBeNull();
  });

  it('confirmIcon 正常渲染', () => {
    renderShell({ confirmIcon: <span data-testid="confirm-icon">✓</span> });
    expect(screen.getByTestId('confirm-icon')).toBeInTheDocument();
  });

  it('不传 confirmIcon 时确认按钮内无额外图标节点', () => {
    renderShell({ confirmIcon: undefined });
    // 确认按钮存在，没有额外测试 id
    expect(screen.queryByTestId('confirm-icon')).toBeNull();
  });
});

// ─── 2. 按钮交互 ──────────────────────────────────────────────────────────────
describe('OperationModalShell – 按钮交互', () => {
  it('点击关闭按钮触发 onClose', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    renderShell({ onClose });
    await user.click(screen.getByRole('button', { name: '关闭' }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('点击取消按钮触发 onClose', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    renderShell({ onClose });
    await user.click(screen.getByRole('button', { name: '取消' }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('点击确认按钮触发 onConfirm', async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();
    renderShell({ onConfirm });
    await user.click(screen.getByRole('button', { name: /^确认$/ }));
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it('点击确认按钮不触发 onClose', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    const onConfirm = vi.fn();
    renderShell({ onClose, onConfirm });
    await user.click(screen.getByRole('button', { name: /^确认$/ }));
    expect(onClose).not.toHaveBeenCalled();
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it('点击取消按钮不触发 onConfirm', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    const onConfirm = vi.fn();
    renderShell({ onClose, onConfirm });
    await user.click(screen.getByRole('button', { name: '取消' }));
    expect(onConfirm).not.toHaveBeenCalled();
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('点击 backdrop（overlay 根节点）触发 onClose', () => {
    const onClose = vi.fn();
    renderShell({ onClose });
    const overlay = screen.getByRole('dialog');
    fireEvent.click(overlay);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('点击卡片内部不触发 onClose（stopPropagation 生效）', () => {
    const onClose = vi.fn();
    renderShell({ onClose });
    // 点击标题文字（位于卡片内）
    fireEvent.click(screen.getByText('弹窗标题'));
    expect(onClose).not.toHaveBeenCalled();
  });

  it('点击 children 内容不触发 onClose', () => {
    const onClose = vi.fn();
    renderShell({ onClose });
    fireEvent.click(screen.getByTestId('shell-body'));
    expect(onClose).not.toHaveBeenCalled();
  });
});

// ─── 3. 键盘事件 ──────────────────────────────────────────────────────────────
describe('OperationModalShell – 键盘事件', () => {
  it('按 Escape 触发 onClose', () => {
    const onClose = vi.fn();
    renderShell({ onClose });
    act(() => {
      fireEvent.keyDown(window, { key: 'Escape' });
    });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('按其他键不触发 onClose', () => {
    const onClose = vi.fn();
    renderShell({ onClose });
    act(() => {
      fireEvent.keyDown(window, { key: 'Enter' });
      fireEvent.keyDown(window, { key: 'Tab' });
      fireEvent.keyDown(window, { key: ' ' });
      fireEvent.keyDown(window, { key: 'ArrowDown' });
    });
    expect(onClose).not.toHaveBeenCalled();
  });

  it('unmount 后 Escape 不再触发 onClose', () => {
    const onClose = vi.fn();
    const { unmount } = renderShell({ onClose });
    unmount();
    act(() => {
      fireEvent.keyDown(window, { key: 'Escape' });
    });
    expect(onClose).not.toHaveBeenCalled();
  });

  it('rerender 更换 onClose 后 Escape 调用最新回调', () => {
    const onClose1 = vi.fn();
    const onClose2 = vi.fn();
    const { rerender } = renderShell({ onClose: onClose1 });
    rerender(
      <OperationModalShell
        ariaLabel="测试弹窗"
        icon={<span>图标</span>}
        title="弹窗标题"
        onClose={onClose2}
        onConfirm={vi.fn()}
      >
        <div>内容</div>
      </OperationModalShell>,
    );
    act(() => {
      fireEvent.keyDown(window, { key: 'Escape' });
    });
    expect(onClose1).not.toHaveBeenCalled();
    expect(onClose2).toHaveBeenCalledTimes(1);
  });

  it('多次按 Escape 触发对应次数 onClose', () => {
    const onClose = vi.fn();
    renderShell({ onClose });
    act(() => {
      fireEvent.keyDown(window, { key: 'Escape' });
      fireEvent.keyDown(window, { key: 'Escape' });
      fireEvent.keyDown(window, { key: 'Escape' });
    });
    expect(onClose).toHaveBeenCalledTimes(3);
  });
});

// ─── 4. variant 分支 ──────────────────────────────────────────────────────────
describe('OperationModalShell – variant 分支', () => {
  it('默认 variant="sheet"，overlay 不含 center class', () => {
    renderShell();
    const overlay = screen.getByRole('dialog');
    expect(overlay.className).not.toMatch(/[Cc]enter/);
  });

  it('默认 variant="sheet"，卡片不含 center class', () => {
    renderShell();
    const overlay = screen.getByRole('dialog');
    // 卡片是 overlay 的第一个子元素
    const card = overlay.firstElementChild as HTMLElement;
    expect(card).not.toBeNull();
    expect(card.className).not.toMatch(/[Cc]enter/);
  });

  it('variant="center" 时 overlay 含 center/Center class', () => {
    renderShell({ variant: 'center' });
    const overlay = screen.getByRole('dialog');
    expect(overlay.className).toMatch(/[Cc]enter/);
  });

  it('variant="center" 时 body 含 center/Center class', () => {
    renderShell({ variant: 'center' });
    const overlay = screen.getByRole('dialog');
    const card = overlay.firstElementChild as HTMLElement;
    expect(card).not.toBeNull();
    expect(card.className).toMatch(/[Cc]enter/);
  });

  it('variant 从 sheet 切换到 center 时 class 正确更新', () => {
    const { rerender } = renderShell({ variant: 'sheet' });
    expect(screen.getByRole('dialog').className).not.toMatch(/[Cc]enter/);

    rerender(
      <OperationModalShell
        ariaLabel="测试弹窗"
        icon={<span>图标</span>}
        title="弹窗标题"
        onClose={vi.fn()}
        onConfirm={vi.fn()}
        variant="center"
      >
        <div>内容</div>
      </OperationModalShell>,
    );
    expect(screen.getByRole('dialog').className).toMatch(/[Cc]enter/);
  });

  it('variant 从 center 切换到 sheet 时 center class 消失', () => {
    const { rerender } = renderShell({ variant: 'center' });
    expect(screen.getByRole('dialog').className).toMatch(/[Cc]enter/);

    rerender(
      <OperationModalShell
        ariaLabel="测试弹窗"
        icon={<span>图标</span>}
        title="弹窗标题"
        onClose={vi.fn()}
        onConfirm={vi.fn()}
        variant="sheet"
      >
        <div>内容</div>
      </OperationModalShell>,
    );
    expect(screen.getByRole('dialog').className).not.toMatch(/[Cc]enter/);
  });
});

// ─── 5. maxWidth ──────────────────────────────────────────────────────────────
describe('OperationModalShell – maxWidth', () => {
  it('不传 maxWidth 时根节点无内联 style', () => {
    renderShell();
    const overlay = screen.getByRole('dialog') as HTMLElement;
    expect(overlay.style.getPropertyValue('--modal-max-width')).toBe('');
  });

  it('传入 maxWidth 时根节点写入 --modal-max-width CSS 变量', () => {
    renderShell({ maxWidth: '40rem' });
    const overlay = screen.getByRole('dialog') as HTMLElement;
    expect(overlay.style.getPropertyValue('--modal-max-width')).toBe('40rem');
  });

  it('传不同 maxWidth 值时 CSS 变量正确设置', () => {
    renderShell({ maxWidth: '600px' });
    const overlay = screen.getByRole('dialog') as HTMLElement;
    expect(overlay.style.getPropertyValue('--modal-max-width')).toBe('600px');
  });

  it('rerender 更换 maxWidth 时 CSS 变量正确更新', () => {
    const { rerender } = renderShell({ maxWidth: '30rem' });
    expect((screen.getByRole('dialog') as HTMLElement).style.getPropertyValue('--modal-max-width')).toBe('30rem');

    rerender(
      <OperationModalShell
        ariaLabel="测试弹窗"
        icon={<span>图标</span>}
        title="弹窗标题"
        onClose={vi.fn()}
        onConfirm={vi.fn()}
        maxWidth="60rem"
      >
        <div>内容</div>
      </OperationModalShell>,
    );
    expect((screen.getByRole('dialog') as HTMLElement).style.getPropertyValue('--modal-max-width')).toBe('60rem');
  });

  it('maxWidth 从有值变为无值时 CSS 变量被清除', () => {
    const { rerender } = renderShell({ maxWidth: '40rem' });
    expect((screen.getByRole('dialog') as HTMLElement).style.getPropertyValue('--modal-max-width')).toBe('40rem');

    rerender(
      <OperationModalShell
        ariaLabel="测试弹窗"
        icon={<span>图标</span>}
        title="弹窗标题"
        onClose={vi.fn()}
        onConfirm={vi.fn()}
      >
        <div>内容</div>
      </OperationModalShell>,
    );
    expect((screen.getByRole('dialog') as HTMLElement).style.getPropertyValue('--modal-max-width')).toBe('');
  });
});

// ─── 6. 按钮结构与无障碍 ──────────────────────────────────────────────────────
describe('OperationModalShell – 按钮结构与无障碍', () => {
  it('关闭按钮 aria-label="关闭"', () => {
    renderShell();
    expect(screen.getByRole('button', { name: '关闭' })).toBeInTheDocument();
  });

  it('取消按钮 type="button"', () => {
    renderShell();
    expect(screen.getByRole('button', { name: '取消' })).toHaveAttribute('type', 'button');
  });

  it('确认按钮 type="button"', () => {
    renderShell();
    expect(screen.getByRole('button', { name: /^确认$/ })).toHaveAttribute('type', 'button');
  });

  it('关闭按钮 type="button"', () => {
    renderShell();
    expect(screen.getByRole('button', { name: '关闭' })).toHaveAttribute('type', 'button');
  });

  it('confirmIcon 与 confirmText 同时存在时都渲染', () => {
    renderShell({
      confirmText: '保存',
      confirmIcon: <span data-testid="save-icon">💾</span>,
    });
    const confirmBtn = screen.getByRole('button', { name: /保存/ });
    expect(confirmBtn).toBeInTheDocument();
    expect(screen.getByTestId('save-icon')).toBeInTheDocument();
    expect(confirmBtn).toContainElement(screen.getByTestId('save-icon'));
  });

  it('标题渲染为 h2 元素', () => {
    renderShell({ title: '标题测试' });
    const heading = screen.getByRole('heading', { level: 2 });
    expect(heading.textContent).toBe('标题测试');
  });
});

// ─── 7. 清理 ──────────────────────────────────────────────────────────────────
describe('OperationModalShell – 清理', () => {
  it('unmount 后 DOM 中无弹窗节点', () => {
    const { unmount } = renderShell();
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    unmount();
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('unmount 后标题文本从 DOM 移除', () => {
    const { unmount } = renderShell({ title: '要清理的标题' });
    expect(screen.getByText('要清理的标题')).toBeInTheDocument();
    unmount();
    expect(screen.queryByText('要清理的标题')).toBeNull();
  });

  it('unmount 后 Escape 不再响应', () => {
    const onClose = vi.fn();
    const { unmount } = renderShell({ onClose });
    unmount();
    act(() => {
      fireEvent.keyDown(window, { key: 'Escape' });
    });
    expect(onClose).not.toHaveBeenCalled();
  });
});

// ─── 8. 完整 props 组合 ───────────────────────────────────────────────────────
describe('OperationModalShell – 完整 props 组合', () => {
  it('所有可选 props 同时传入时不抛出错误', () => {
    expect(() =>
      renderShell({
        confirmText: '确认新增',
        confirmIcon: <span>+</span>,
        cancelText: '放弃',
        variant: 'center',
        maxWidth: '480px',
      }),
    ).not.toThrow();
  });

  it('children 为复杂 JSX 时正常渲染', () => {
    renderShell({
      children: (
        <form>
          <input data-testid="form-input" />
          <label data-testid="form-label">字段</label>
        </form>
      ),
    });
    expect(screen.getByTestId('form-input')).toBeInTheDocument();
    expect(screen.getByTestId('form-label')).toBeInTheDocument();
  });

  it('icon 为复杂 ReactNode 时正常渲染', () => {
    renderShell({
      icon: (
        <svg data-testid="svg-icon" aria-hidden="true">
          <circle r="5" />
        </svg>
      ),
    });
    expect(screen.getByTestId('svg-icon')).toBeInTheDocument();
  });
});

// ─── 9. BUG 修复验证 ──────────────────────────────────────────────────────────
describe('OperationModalShell – BUG 修复验证', () => {
  // BUG-2: body scroll lock
  it('挂载时设置 body overflow 为 hidden', () => {
    const prevOverflow = document.body.style.overflow;
    renderShell();
    expect(document.body.style.overflow).toBe('hidden');
    // 恢复
    document.body.style.overflow = prevOverflow;
  });

  it('卸载时恢复 body overflow', () => {
    const prevOverflow = document.body.style.overflow;
    const { unmount } = renderShell();
    expect(document.body.style.overflow).toBe('hidden');
    unmount();
    expect(document.body.style.overflow).toBe(prevOverflow);
  });

  // BUG-3: 确认按钮 disabled 时不触发 onConfirm
  it('confirmDisabled=true 时确认按钮为 disabled 且 onClick 不执行', () => {
    const onConfirm = vi.fn();
    renderShell({ confirmDisabled: true, onConfirm });
    const btn = screen.getByRole('button', { name: /^确认$/ });
    expect(btn).toBeDisabled();
    // disabled 按钮通过 fireEvent.click 模拟绕过 pointer-events: none
    // 但 disabled 状态下 onClick 也不应被触发
    fireEvent.click(btn);
    expect(onConfirm).not.toHaveBeenCalled();
  });

  // BUG-7: focus trap
  it('overlay 元素有 tabIndex=-1 可接收焦点', () => {
    renderShell();
    const overlay = screen.getByRole('dialog');
    expect(overlay).toHaveAttribute('tabindex', '-1');
  });

  // BUG-8: 打开时自动聚焦
  it('挂载后焦点在弹窗内', () => {
    renderShell();
    const overlay = screen.getByRole('dialog');
    // 焦点应该在 overlay 内部（某个按钮或 overlay 自身）
    expect(overlay.contains(document.activeElement)).toBe(true);
  });

  // BUG-10: variant=center 时 desktopAlign=top 无效
  it('variant=center 且 desktopAlign=top 时 overlay 不含 desktopTop class', () => {
    renderShell({ variant: 'center', desktopAlign: 'top' });
    const overlay = screen.getByRole('dialog');
    // center 模式下 desktopAlign 应被忽略，不应出现 DesktopTop class
    expect(overlay.className).not.toMatch(/[Dd]esktop[Tt]op/);
  });

  it('variant=sheet 且 desktopAlign=top 时 overlay 含 desktopTop class', () => {
    renderShell({ variant: 'sheet', desktopAlign: 'top' });
    const overlay = screen.getByRole('dialog');
    expect(overlay.className).toMatch(/[Dd]esktop[Tt]op/);
  });

  // BUG-1: 多实例 ESC 栈式管理（基础验证）
  it('两个实例同时存在时按 ESC 只触发最后一个的 onClose', () => {
    const onClose1 = vi.fn();
    const onClose2 = vi.fn();

    // 先渲染第一个弹窗
    const { rerender: rerender1 } = renderShell({ onClose: onClose1, ariaLabel: '弹窗1' });

    // 再渲染第二个弹窗（在已有弹窗之上）
    const { unmount: unmount2 } = renderShell({ onClose: onClose2, ariaLabel: '弹窗2' });

    // 按 ESC：只有最顶层的弹窗2应该响应
    act(() => {
      fireEvent.keyDown(window, { key: 'Escape' });
    });

    expect(onClose2).toHaveBeenCalledTimes(1);
    // 弹窗1不应该被 ESC 关闭
    expect(onClose1).not.toHaveBeenCalled();

    unmount2();
  });

  // BUG-5: onClose 引用变化后 ESC 仍调用最新回调
  it('onClose 内联函数变化后 ESC 调用最新回调', () => {
    const onClose1 = vi.fn();
    const onClose2 = vi.fn();
    const { rerender } = renderShell({ onClose: onClose1 });

    rerender(
      <OperationModalShell
        ariaLabel="测试弹窗"
        icon={<span>图标</span>}
        title="弹窗标题"
        onClose={onClose2}
        onConfirm={vi.fn()}
      >
        <div>内容</div>
      </OperationModalShell>,
    );

    act(() => {
      fireEvent.keyDown(window, { key: 'Escape' });
    });

    expect(onClose1).not.toHaveBeenCalled();
    expect(onClose2).toHaveBeenCalledTimes(1);
  });

  // BUG-6: SSR 兼容性（验证 typeof document 守卫不破坏正常渲染）
  it('正常浏览器环境下弹窗正常渲染', () => {
    expect(() => renderShell()).not.toThrow();
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  // closeOnBackdropClick=false 时点击遮罩不关闭
  it('closeOnBackdropClick=false 时点击遮罩不触发 onClose', () => {
    const onClose = vi.fn();
    renderShell({ closeOnBackdropClick: false, onClose });
    const overlay = screen.getByRole('dialog');
    fireEvent.click(overlay);
    expect(onClose).not.toHaveBeenCalled();
  });
});
