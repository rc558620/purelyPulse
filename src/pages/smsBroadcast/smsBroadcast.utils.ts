// 群发短信管理金额工具：**元 ↔ 分** 换算的唯一入口。
//
// 为什么必须收敛到一个文件：
// 后端 `sms.prisma` 全表金额字段都是 Int 分，前端表单却按「元」输入。
// 一旦各处手写 `* 100` / `/ 100`，浮点误差与口径漂移就不可避免，
// 且 `parseFloat` 产生的中间态（如 0.30000000000000004）会直接写进请求体。
import { safeNum } from '@utils/utils';

/** 分 → 元（number）。不格式化，供数值比较与输入回填使用 */
export const fenToYuan = (fen: number | null | undefined): number =>
  safeNum(fen) / 100;

/**
 * 格式化金额展示：`¥12.34`。
 *
 * 与 `Intl` 无关、手写是因为要固定两位小数 + 千分位 + 人民币符号，
 * 且金额永远由「分」推导，不存在浮点尾差。
 */
export const formatFen = (fen: number | null | undefined): string => {
  const yuan = fenToYuan(fen);
  return `¥${yuan.toLocaleString('zh-CN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

/**
 * 表单输入的「元」→ 请求体的「分」。
 *
 * 先 `Math.round` 再返回整数，杜绝 `10.1 * 100 = 1010.0000000000001` 这类尾差；
 * 负数（回收方向）由调用方取反后传入。
 */
export const yuanToFen = (yuan: number): number => Math.round(safeNum(yuan) * 100);
