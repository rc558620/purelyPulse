/**
 * CustomModeBtnRow 组件单元测试
 *
 * 覆盖范围：
 *  - 两个按钮都渲染
 *  - 按钮文案：extraBtnText / 日期范围
 *  - extraBtnText 正确展示
 *  - isCustomDate 激活态 class 与 aria-pressed
 *  - isCustomRange 激活态 class 与 aria-pressed
 *  - 点击自定义日期按钮触发 onToggleCustomDate
 *  - 点击日期范围按钮触发 onToggleCustomRange
 *  - 两个回调互不干扰
 *  - button type 为 "button"（防止意外 submit）
 *  - aria-label 属性：第一个按钮跟随 extraBtnText
 *  - displayName
 *  - Bug2: 互斥 disabled 态（isCustomDate 激活时日期范围按钮变淡，反之亦然）
 *  - Bug6: 互斥保护（isCustomDate + isCustomRange 同时为 true 时优先 isCustomDate）
 */

import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CustomModeBtnRow from '../CustomModeBtnRow';

// ─── 辅助：渲染默认 props ────────────────────────────────────────────────────

function renderDefault(overrides?: Partial<Parameters<typeof CustomModeBtnRow>[0]>) {
    return render(
        <CustomModeBtnRow
            isCustomDate={false}
            isCustomRange={false}
            extraBtnText="选择年月日"
            onToggleCustomDate={vi.fn()}
            onToggleCustomRange={vi.fn()}
            {...overrides}
        />,
    );
}

// ─── 1. 基本渲染 ─────────────────────────────────────────────────────────────

describe('CustomModeBtnRow – 基本渲染', () => {
    it('渲染两个按钮', () => {
        renderDefault();
        expect(screen.getAllByRole('button')).toHaveLength(2);
    });

    it('第一个按钮 aria-label 跟随 extraBtnText（Bug1 修复）', () => {
        renderDefault({ extraBtnText: '选择年月日' });
        expect(screen.getByRole('button', { name: '选择年月日' })).toBeInTheDocument();
    });

    it('extraBtnText 为"选择具体日期"时 aria-label 也为"选择具体日期"（Bug1 修复）', () => {
        renderDefault({ extraBtnText: '选择具体日期' });
        expect(screen.getByRole('button', { name: '选择具体日期' })).toBeInTheDocument();
    });

    it('「日期范围」按钮有正确 aria-label', () => {
        renderDefault();
        expect(screen.getByRole('button', { name: '选择日期范围' })).toBeInTheDocument();
    });

    it('「日期范围」按钮显示文字"日期范围"', () => {
        renderDefault();
        expect(screen.getByText('日期范围')).toBeInTheDocument();
    });

    it('displayName 为 CustomModeBtnRow', () => {
        expect(CustomModeBtnRow.displayName).toBe('CustomModeBtnRow');
    });
});

// ─── 2. extraBtnText ─────────────────────────────────────────────────────────

describe('CustomModeBtnRow – extraBtnText', () => {
    it('extraBtnText 默认文案正确展示', () => {
        renderDefault({ extraBtnText: '选择年月日' });
        expect(screen.getByText('选择年月日')).toBeInTheDocument();
    });

    it('extraBtnText 为已选日期时展示日期', () => {
        renderDefault({ extraBtnText: '2024/03/15' });
        expect(screen.getByText('2024/03/15')).toBeInTheDocument();
    });

    it('extraBtnText 变化时 aria-label 同步更新（Bug1 修复）', () => {
        renderDefault({ extraBtnText: '2024/03/15' });
        expect(screen.getByRole('button', { name: '2024/03/15' })).toBeInTheDocument();
    });
});

// ─── 3. 激活态（isCustomDate / isCustomRange） ───────────────────────────────

describe('CustomModeBtnRow – 激活态', () => {
    it('isCustomDate=true 时自定义日期按钮含 active class 且 aria-pressed=true', () => {
        renderDefault({ isCustomDate: true, extraBtnText: '选择年月日' });
        const btn = screen.getByRole('button', { name: '选择年月日' });
        expect(btn.className).toMatch(/active/i);
        expect(btn).toHaveAttribute('aria-pressed', 'true');
    });

    it('isCustomDate=false 时自定义日期按钮不含 active class 且 aria-pressed=false', () => {
        renderDefault({ isCustomDate: false, extraBtnText: '选择年月日' });
        const btn = screen.getByRole('button', { name: '选择年月日' });
        expect(btn.className).not.toMatch(/active/i);
        expect(btn).toHaveAttribute('aria-pressed', 'false');
    });

    it('isCustomRange=true 时日期范围按钮含 active class 且 aria-pressed=true', () => {
        renderDefault({ isCustomRange: true });
        const btn = screen.getByRole('button', { name: '选择日期范围' });
        expect(btn.className).toMatch(/active/i);
        expect(btn).toHaveAttribute('aria-pressed', 'true');
    });

    it('isCustomRange=false 时日期范围按钮不含 active class 且 aria-pressed=false', () => {
        renderDefault({ isCustomRange: false });
        const btn = screen.getByRole('button', { name: '选择日期范围' });
        expect(btn.className).not.toMatch(/active/i);
        expect(btn).toHaveAttribute('aria-pressed', 'false');
    });
});

// ─── 4. 点击回调 ─────────────────────────────────────────────────────────────

describe('CustomModeBtnRow – 点击回调', () => {
    it('点击自定义日期按钮触发 onToggleCustomDate', async () => {
        const user = userEvent.setup();
        const onToggleCustomDate = vi.fn();
        renderDefault({ onToggleCustomDate, extraBtnText: '选择年月日' });
        await user.click(screen.getByRole('button', { name: '选择年月日' }));
        expect(onToggleCustomDate).toHaveBeenCalledTimes(1);
    });

    it('点击日期范围按钮触发 onToggleCustomRange', async () => {
        const user = userEvent.setup();
        const onToggleCustomRange = vi.fn();
        renderDefault({ onToggleCustomRange });
        await user.click(screen.getByRole('button', { name: '选择日期范围' }));
        expect(onToggleCustomRange).toHaveBeenCalledTimes(1);
    });

    it('点击自定义日期按钮不触发 onToggleCustomRange', async () => {
        const user = userEvent.setup();
        const onToggleCustomRange = vi.fn();
        renderDefault({ onToggleCustomRange, extraBtnText: '选择年月日' });
        await user.click(screen.getByRole('button', { name: '选择年月日' }));
        expect(onToggleCustomRange).not.toHaveBeenCalled();
    });

    it('点击日期范围按钮不触发 onToggleCustomDate', async () => {
        const user = userEvent.setup();
        const onToggleCustomDate = vi.fn();
        renderDefault({ onToggleCustomDate });
        await user.click(screen.getByRole('button', { name: '选择日期范围' }));
        expect(onToggleCustomDate).not.toHaveBeenCalled();
    });
});

// ─── 5. button type ──────────────────────────────────────────────────────────

describe('CustomModeBtnRow – button type', () => {
    it('两个按钮 type 均为 "button"（防止意外触发表单提交）', () => {
        renderDefault();
        const buttons = screen.getAllByRole('button');
        buttons.forEach(btn => expect(btn).toHaveAttribute('type', 'button'));
    });
});

// ─── 6. Bug2: 互斥 disabled 态 ──────────────────────────────────────────────

describe('CustomModeBtnRow – 互斥 disabled 态（Bug2）', () => {
    it('isCustomDate=true 时日期范围按钮含 disabled class 且 aria-disabled=true', () => {
        renderDefault({ isCustomDate: true, extraBtnText: '2024/03/15' });
        const rangeBtn = screen.getByRole('button', { name: '选择日期范围' });
        expect(rangeBtn.className).toMatch(/disabled/i);
        expect(rangeBtn).toHaveAttribute('aria-disabled', 'true');
    });

    it('isCustomRange=true 时自定义日期按钮含 disabled class 且 aria-disabled=true', () => {
        renderDefault({ isCustomRange: true, extraBtnText: '选择年月日' });
        const dateBtn = screen.getByRole('button', { name: '选择年月日' });
        expect(dateBtn.className).toMatch(/disabled/i);
        expect(dateBtn).toHaveAttribute('aria-disabled', 'true');
    });

    it('两者均未激活时两个按钮均不含 disabled class', () => {
        renderDefault({ extraBtnText: '选择年月日' });
        const dateBtn = screen.getByRole('button', { name: '选择年月日' });
        const rangeBtn = screen.getByRole('button', { name: '选择日期范围' });
        expect(dateBtn.className).not.toMatch(/disabled/i);
        expect(rangeBtn.className).not.toMatch(/disabled/i);
    });
});

// ─── 7. Bug6: 互斥保护（isCustomDate + isCustomRange 同时为 true） ──────────

describe('CustomModeBtnRow – 互斥保护（Bug6）', () => {
    it('isCustomDate=true + isCustomRange=true 时优先 isCustomDate，isCustomRange 被视为 false', () => {
        renderDefault({ isCustomDate: true, isCustomRange: true, extraBtnText: '2024/03/15' });
        const dateBtn = screen.getByRole('button', { name: '2024/03/15' });
        const rangeBtn = screen.getByRole('button', { name: '选择日期范围' });

        // 自定义日期按钮应为激活态
        expect(dateBtn.className).toMatch(/active/i);
        expect(dateBtn).toHaveAttribute('aria-pressed', 'true');

        // 日期范围按钮应为 disabled（因为 isCustomDate 优先），不应为激活态
        expect(rangeBtn.className).not.toMatch(/active/i);
        expect(rangeBtn).toHaveAttribute('aria-pressed', 'false');
        expect(rangeBtn).toHaveAttribute('aria-disabled', 'true');
    });
});
