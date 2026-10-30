// 支付模式 Store（客户端）：只回答「当前是不是测试支付模式」，不参与任何下单决策
//
// 三个必须说清楚的边界：
// 1. **不参与下单决策**：是否真实扣款由后端独家裁决，本 store 只负责展示；
// 2. **生产构建结构性不可达**：IS_PROD_BUILD 分支会被 vite 静态折叠，mode 恒为 live；
// 3. **不做本地持久化**：展示值一旦与真实状态漂移，就会出现「界面说测试、实际真实扣款」，
//    这种错配无法自愈，因此每次启动都按安全侧默认值兜底。
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { PaymentMode } from '@services/payment';

/** 生产构建标记：`import.meta.env.DEV` 会被 vite 静态替换为常量。 */
const IS_PROD_BUILD = !import.meta.env.DEV;

export interface PaymentModeState {
  /** 当前支付模式；生产构建恒为 live */
  mode: PaymentMode;
  /** 切换支付模式；生产构建下直接忽略 */
  setMode: (mode: PaymentMode) => void;
  /** 回到安全侧（退出登录 / 切换账号时调用） */
  reset: () => void;
}

const INITIAL_STATE: Pick<PaymentModeState, 'mode'> = {
  // 默认按真实模式兜底：猜错方向的代价（把真实扣款显示成不用付钱）远高于反向
  mode: 'live',
};

export const usePaymentModeStore = create<PaymentModeState>()(
  devtools(
    (set) => ({
      ...INITIAL_STATE,

      setMode: (mode: PaymentMode): void => {
        if (IS_PROD_BUILD) {
          return;
        }

        set({ mode });
      },

      reset: (): void => {
        set({ ...INITIAL_STATE });
      },
    }),
    { name: 'PaymentModeStore' },
  ),
);

/** 供登出 / 账号切换等外部时机清空，避免上一个账号的模式带到下一个账号。 */
export const resetPaymentModeStore = (): void => {
  usePaymentModeStore.setState({ ...INITIAL_STATE });
};
