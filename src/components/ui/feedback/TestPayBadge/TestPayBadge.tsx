// 测试模式支付角标：贴在具体支付按钮上，标明这一下不会真实扣款
//
// 与全局横幅的分工：横幅管「当前处于什么模式」，角标管「这个按钮按下去会怎样」。
// 用户可能从任意入口直接进到支付页，横幅在页面顶部、按钮在页面底部，
// 只靠横幅时视线未必能连起来，因此按钮上必须再钉一次。
//
// 生产构建下整棵子树被静态消除；即便保留，store 在生产恒为 live，角标也不渲染。
import React, { memo } from 'react';
import { usePaymentModeStore } from '@stores/paymentModeStore';
import styles from './TestPayBadge.module.less';

interface TestPayBadgeProps {
  /**
   * 强制显示。
   *
   * 用于「构建期假数据」这类不由支付模式 store 驱动的测试态
   * （如短信链路的 VITE_SMS_API_MOCK）：它同样不会真实扣款，
   * 按钮上也必须钉一次，否则两套机制会给出互相矛盾的暗示。
   *
   * 此时角标文案与支付模式的「测试」区分开：短信 mock 是「不真发短信」，
   * 不是「不真实扣款」，两者混用同一个词会让人误判自己在哪种测试里。
   */
  force?: boolean;
}

const TestPayBadge: React.FC<TestPayBadgeProps> = memo(({ force = false }) => {
  const mode = usePaymentModeStore((state) => state.mode);

  if (!import.meta.env.DEV || (!force && mode !== 'test')) {
    return null;
  }

  return <span className={styles.badge}>{force ? '演示' : '测试'}</span>;
});

TestPayBadge.displayName = 'TestPayBadge';

export default TestPayBadge;
