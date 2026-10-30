// 通用支付二维码弹窗：展示后端出图的支付码并反映当前支付状态（三条支付链路共用）
//
// 二维码一律展示后端下发的 `qrCodeImageUrl`（由微信 code_url 渲染的 PNG）：
// weixin:// 协议串无法被 <img> 加载，前端也不该为了出图把支付链接交给第三方服务。
// 关闭弹窗即由调用方置空 payment，轮询随之停止。
import React, { memo } from "react";
import OperationModalShell from "@components/overlay/OperationModalShell/OperationModalShell";
import {
  formatCountdownClock,
  useExpiryCountdown,
} from "@hooks/useExpiryCountdown";
import { cx } from "@utils/utils";
import type { PaymentQrModalProps } from "./PaymentQrModal.types";
import styles from "./PaymentQrModal.module.less";

const PaymentQrModal: React.FC<PaymentQrModalProps> = memo(
  ({ payment, status, title, icon, amountText, onClose, successHint }) => {
    // 必须在 payment 判空之前调用：提前返回后再调 hook 会破坏 hooks 调用顺序
    const remainingSeconds = useExpiryCountdown(payment?.expiresAt ?? null);
    if (!payment) return null;

    const isPaid = status === "paid";
    // 只有服务端明确下发了过期时间、且倒计时已归零才算过期：
    // 测试模式没有 expiresAt，不能因为取不到时间就误判成过期挡住支付
    const isExpired =
      Boolean(payment.expiresAt) && remainingSeconds <= 0 && !isPaid;
    // 已支付时不再展示「二维码加载失败」：弹窗会在轮询到 paid 后自动关闭，
    // 此时的空图只是过渡态，提示反而误导。
    const showQrFallback = !payment.qrCodeImageUrl && !isPaid && !isExpired;

    return (
      <OperationModalShell
        ariaLabel={title}
        icon={icon}
        title={title}
        confirmText="关闭"
        confirmDisabled={isPaid}
        cancelText=""
        variant="center"
        maxWidth="36rem"
        onClose={onClose}
        onConfirm={onClose}
      >
        <div className={styles.body}>
          <p className={styles.amount}>
            需支付 <strong>{amountText}</strong>
          </p>

          <div className={cx(styles.qrBox, isPaid && styles.qrBoxPaid)}>
            {isExpired ? (
              <span className={styles.qrFallback}>二维码已过期</span>
            ) : payment.qrCodeImageUrl ? (
              <img
                className={styles.qr}
                src={payment.qrCodeImageUrl}
                alt={`${title}支付二维码`}
              />
            ) : (
              showQrFallback && (
                <span className={styles.qrFallback}>
                  二维码生成失败，请关闭后重新发起支付
                </span>
              )
            )}
          </div>

          {!isPaid && !isExpired && remainingSeconds > 0 ? (
            <p className={styles.countdown}>
              二维码将在{" "}
              <strong>{formatCountdownClock(remainingSeconds)}</strong> 后过期
            </p>
          ) : null}

          <p className={styles.status} role="status">
            {isPaid
              ? "支付成功，正在处理…"
              : isExpired
                ? "二维码已过期，请关闭后重新发起支付"
                : "请使用微信扫码支付，支付完成后自动继续"}
          </p>

          {successHint ? <p className={styles.tip}>{successHint}</p> : null}
        </div>
      </OperationModalShell>
    );
  },
);

PaymentQrModal.displayName = "PaymentQrModal";

export default PaymentQrModal;
