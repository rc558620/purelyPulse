// 测试支付角标测试：只在测试态渲染，且区分「支付测试」与「短信 mock 演示」
import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const storeState: { mode: 'test' | 'live' } = { mode: 'test' };

vi.mock('@stores/paymentModeStore', () => ({
  usePaymentModeStore: (
    selector: (state: { mode: 'test' | 'live' }) => unknown,
  ) => selector(storeState),
}));

const { default: TestPayBadge } = await import('../TestPayBadge');

describe('TestPayBadge', () => {
  beforeEach(() => {
    storeState.mode = 'test';
  });

  it('真实模式且非强制时不渲染', () => {
    storeState.mode = 'live';

    const { container } = render(<TestPayBadge />);

    expect(container).toBeEmptyDOMElement();
  });

  it('测试模式下渲染「测试」角标', () => {
    render(<TestPayBadge />);

    expect(screen.getByText('测试')).toBeInTheDocument();
  });

  it('强制显示时用「演示」区分短信 mock：它不是不真实扣款', () => {
    storeState.mode = 'live';

    render(<TestPayBadge force />);

    expect(screen.getByText('演示')).toBeInTheDocument();
    expect(screen.queryByText('测试')).toBeNull();
  });
});
