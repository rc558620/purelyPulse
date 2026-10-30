// 基于绝对过期时间的倒计时：从后端下发的 expiresAt 反推剩余秒数
//
// 与 useCountdown 的分工：
// - useCountdown 是「启动 N 秒」的验证码模型，带持久化，刷新后接着走完；
// - 本 hook 面向服务端给定的过期时间点（如支付二维码有效期），以服务端时间为准，
//   前端既不持久化也不自己定义时长，刷新后按当前真实剩余时间继续显示。
import { useEffect, useState } from 'react';
import { safeNum } from '@utils/utils';

/**
 * 把剩余秒数格式化为 mm:ss，超过 1 小时补出小时位。
 * @param seconds - 剩余秒数
 * @returns 形如 `04:59` / `1:04:59` 的展示文案
 */
export const formatCountdownClock = (seconds: number): string => {
  // 入参可能来自接口解析结果：先用 safeNum 兜底空值，
  // 再显式排掉 Infinity（safeNum 只挡 NaN），最后夹到非负区间
  const normalized = safeNum(seconds);
  const safe = Number.isFinite(normalized)
    ? Math.max(0, Math.floor(normalized))
    : 0;
  const hours = Math.floor(safe / 3600);
  const minutes = Math.floor((safe % 3600) / 60);
  const remainder = safe % 60;
  const pad = (value: number): string => String(value).padStart(2, '0');

  return hours > 0
    ? `${hours}:${pad(minutes)}:${pad(remainder)}`
    : `${pad(minutes)}:${pad(remainder)}`;
};

/**
 * 计算到过期时间点还有多少秒；无过期时间或已过期统一返回 0。
 * @param expiresAt - 过期时间（ISO 字符串），null 表示服务端未下发
 */
const computeRemainingSeconds = (expiresAt: string | null): number => {
  if (!expiresAt) {
    return 0;
  }

  const target = new Date(expiresAt).getTime();
  if (Number.isNaN(target)) {
    return 0;
  }

  const remaining = Math.ceil((target - Date.now()) / 1000);
  return remaining > 0 ? remaining : 0;
};

/**
 * 按过期时间点倒计时，每秒回读一次剩余秒数。
 * @param expiresAt - 过期时间（ISO 字符串）；null / 已过期时返回 0
 * @returns 剩余秒数，0 表示未下发过期时间或已过期
 */
export const useExpiryCountdown = (expiresAt: string | null): number => {
  const [remainingSeconds, setRemainingSeconds] = useState<number>(
    () => computeRemainingSeconds(expiresAt),
  );

  useEffect(() => {
    // 每次 tick 都按 expiresAt 重算，而不是对上一秒做减法：
    // 递减会因定时器漂移、后台标签页节流而落后于真实过期时间，
    // 让用户拿着已经失效的二维码继续扫。
    const sync = (): number => {
      const next = computeRemainingSeconds(expiresAt);
      setRemainingSeconds(next);
      return next;
    };

    if (sync() <= 0) {
      return undefined;
    }

    const timer = window.setInterval(sync, 1000);
    return () => {
      window.clearInterval(timer);
    };
  }, [expiresAt]);

  return remainingSeconds;
};
