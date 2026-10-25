// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

/**
 * 变动记录列表渲染用例：加载 / 失败 / 空 / 正常四态与金额展示口径。
 *
 * 金额是 S0 相关项：变动值只能来自后端 changeFen，前端只负责符号与格式化，
 * 不允许出现前端算出来的金额（例如用 balanceAfter 反推变动值）。
 */

import SmsBroadcastWalletLogList from '../components/SmsBroadcastWalletLogList/SmsBroadcastWalletLogList';
import type { SmsWalletLog } from '../smsBroadcast.types';

const buildLog = (overrides: Partial<SmsWalletLog> = {}): SmsWalletLog => ({
  id: '1',
  storeId: '12',
  type: 'grant',
  changeFen: 10000,
  balanceAfterFen: 16000,
  description: '客服补偿短信额度',
  createdAt: Date.parse('2026-09-29T08:56:00.000Z'),
  ...overrides,
});

const renderList = (logs: SmsWalletLog[], overrides: Record<string, unknown> = {}) =>
  render(
    <SmsBroadcastWalletLogList
      logs={logs}
      totalCount={logs.length}
      isInitialLoading={false}
      isLoadingMore={false}
      errorMessage=""
      onRetry={vi.fn()}
      {...overrides}
    />,
  );

describe('SmsBroadcastWalletLogList', () => {
  it('首屏加载中显示加载态与占位条数', () => {
    renderList([], { isInitialLoading: true });

    expect(screen.getByText('加载中...')).toBeTruthy();
    expect(screen.getByText(/短信变动记录加载中/)).toBeTruthy();
  });

  it('失败态展示错误文案并提供重试入口', async () => {
    const onRetry = vi.fn();
    renderList([], { errorMessage: '获取短信变动记录失败，请稍后重试', onRetry });

    expect(screen.getByRole('alert')).toBeTruthy();
    await userEvent.click(screen.getByText('重新加载'));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('空态展示空文案而非空白卡片', () => {
    renderList([]);

    expect(screen.getByText('暂无符合条件的短信变动记录')).toBeTruthy();
  });

  it('正常态展示类型标签、时间、余额与带符号的变动金额', () => {
    renderList([buildLog()]);

    expect(screen.getByText('客服补偿短信额度')).toBeTruthy();
    expect(screen.getByText('平台赠送')).toBeTruthy();
    expect(screen.getByText('¥160.00')).toBeTruthy();
    expect(screen.getByText('+¥100.00')).toBeTruthy();
    expect(screen.getByText('共 1 条')).toBeTruthy();
  });

  it('出账流水用减号与出账色展示', () => {
    renderList([buildLog({ type: 'consume', changeFen: -250 })]);

    expect(screen.getByText('群发扣费')).toBeTruthy();
    expect(screen.getByText('−¥2.50')).toBeTruthy();
  });

  it('未知类型归一为「其他变动」，不会渲染成空标签', () => {
    renderList([buildLog({ type: 'unknown' })]);

    expect(screen.getByText('其他变动')).toBeTruthy();
  });

  it('说明缺失时回落到默认文案，不渲染空白行', () => {
    renderList([buildLog({ description: '' })]);

    expect(screen.getByText('短信余额变动')).toBeTruthy();
  });
});
