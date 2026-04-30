/**
 * Modal/index.tsx 导出契约测试
 *
 * 覆盖范围：
 *  1.  Modal 从 index 默认导出并可渲染
 *  2.  ConfirmModal 从 index 导出并可渲染
 *  3.  Modal 导出的是 React.memo 包裹的组件
 *  4.  ConfirmModal 导出的是 React.memo 包裹的组件
 *  5.  ModalProps 类型导出（编译期检查）
 *  6.  ConfirmModalProps 类型导出（编译期检查）
 *  7.  ConfirmModalVariant 类型导出（编译期检查）
 *  8.  从 index 导入的 Modal 与从 Modal.tsx 直接导入的是同一个引用
 *  9.  从 index 导入的 ConfirmModal 与从 ConfirmModal.tsx 直接导入的是同一个引用
 */

import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

// ─── 通过 index 聚合导入 ─────────────────────────────────────────────────────
import { Modal, ConfirmModal } from '../Modal/index';
import type { ModalProps, ConfirmModalProps, ConfirmModalVariant } from '../Modal/index';

// ─── 直接导入用于引用相等性比较 ───────────────────────────────────────────────
import ModalDirect from '../Modal/Modal';
import ConfirmModalDirect from '../Modal/ConfirmModal';

// ─── 1. Modal 从 index 导出可渲染 ────────────────────────────────────────────
describe('Modal/index – Modal 导出', () => {
  it('Modal 从 index 导出后可正常渲染', () => {
    render(
      <Modal
        visible={true}
        title="导出测试"
        onCancel={vi.fn()}
        onConfirm={vi.fn()}
      >
        <span>内容</span>
      </Modal>,
    );
    expect(screen.getByText('导出测试')).toBeInTheDocument();
  });

  it('Modal 是 memo 包裹的组件', () => {
    expect((Modal as unknown as { $$typeof?: symbol }).$$typeof?.toString()).toContain('memo');
  });

  it('Modal index 导出与 Modal.tsx 直接导出是同一引用', () => {
    expect(Modal).toBe(ModalDirect);
  });

  it('visible=false 时 Modal 不渲染内容', () => {
    render(
      <Modal visible={false} title="隐藏" onCancel={vi.fn()} onConfirm={vi.fn()}>
        <span>不显示</span>
      </Modal>,
    );
    expect(screen.queryByText('隐藏')).toBeNull();
  });
});

// ─── 2. ConfirmModal 从 index 导出可渲染 ─────────────────────────────────────
describe('Modal/index – ConfirmModal 导出', () => {
  it('ConfirmModal 从 index 导出后可正常渲染', () => {
    render(
      <ConfirmModal
        visible={true}
        title="确认导出测试"
        onCancel={vi.fn()}
        onConfirm={vi.fn()}
      />,
    );
    expect(screen.getByText('确认导出测试')).toBeInTheDocument();
  });

  it('ConfirmModal 是 memo 包裹的组件', () => {
    expect((ConfirmModal as unknown as { $$typeof?: symbol }).$$typeof?.toString()).toContain('memo');
  });

  it('ConfirmModal index 导出与 ConfirmModal.tsx 直接导出是同一引用', () => {
    expect(ConfirmModal).toBe(ConfirmModalDirect);
  });

  it('visible=false 时 ConfirmModal 不渲染内容', () => {
    render(
      <ConfirmModal visible={false} title="隐藏确认" onCancel={vi.fn()} onConfirm={vi.fn()} />,
    );
    expect(screen.queryByText('隐藏确认')).toBeNull();
  });
});

// ─── 3. 类型导出契约（编译期验证） ────────────────────────────────────────────
describe('Modal/index – 类型导出契约', () => {
  it('ModalProps 类型可用于构造合法 props 对象', () => {
    const props: ModalProps = {
      visible: true,
      title: '标题',
      children: React.createElement('div'),
      onCancel: vi.fn(),
      onConfirm: vi.fn(),
    };
    expect(props.visible).toBe(true);
    expect(props.title).toBe('标题');
  });

  it('ConfirmModalProps 类型可用于构造合法 props 对象', () => {
    const props: ConfirmModalProps = {
      visible: false,
      title: '确认',
      onCancel: vi.fn(),
      onConfirm: vi.fn(),
    };
    expect(props.visible).toBe(false);
  });

  it('ConfirmModalVariant 包含所有合法取值', () => {
    const values: ConfirmModalVariant[] = ['default', 'danger', 'primary', 'warning'];
    expect(values).toHaveLength(4);
    values.forEach((v) => expect(typeof v).toBe('string'));
  });
});

// ─── 4. 完整 props 通过 index 导入后渲染 ─────────────────────────────────────
describe('Modal/index – 完整渲染组合', () => {
  it('Modal 带 className 通过 index 导入渲染正确', () => {
    render(
      <Modal
        visible={true}
        title="带样式"
        className="test-class"
        cancelText="关闭"
        confirmText="保存"
        onCancel={vi.fn()}
        onConfirm={vi.fn()}
      >
        <p>段落</p>
      </Modal>,
    );
    expect(screen.getByText('带样式')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '关闭' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '保存' })).toBeInTheDocument();
  });

  it('ConfirmModal 带 variant/icon/description 通过 index 导入渲染正确', () => {
    render(
      <ConfirmModal
        visible={true}
        title="危险操作"
        variant="danger"
        icon={<span data-testid="idx-icon">⚠️</span>}
        description="此操作不可撤销"
        onCancel={vi.fn()}
        onConfirm={vi.fn()}
      />,
    );
    expect(screen.getByText('危险操作')).toBeInTheDocument();
    expect(screen.getByTestId('idx-icon')).toBeInTheDocument();
    expect(screen.getByText('此操作不可撤销')).toBeInTheDocument();
    const confirmBtn = screen.getByRole('button', { name: '确定' });
    expect(confirmBtn.className).toMatch(/[Dd]anger/);
  });
});
