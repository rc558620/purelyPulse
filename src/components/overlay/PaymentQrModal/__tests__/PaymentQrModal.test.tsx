// 支付二维码弹窗测试：关闭态、出图展示、无图兜底与已支付态
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
// 必须引 vitest 版匹配器类型：全局 setup 里 import 的是 `@testing-library/jest-dom`，
// 它只扩展 jest 命名空间的 Matchers，一旦本文件被归到未加载该类型的 project，
// toBeInTheDocument 就会报 TS2339（运行时由 setup.ts 注册，这里只补类型来源）
import "@testing-library/jest-dom/vitest";
import PaymentQrModal from "../PaymentQrModal";
// 用相对路径而非 @services 别名：测试文件常被 IDE 归到未加载 paths 的 project，
// 别名会报 TS2307，相对路径在任意 project 下都能解析
import type { PaymentOrder } from "../../../../services/payment";

const buildPayment = (overrides: Partial<PaymentOrder> = {}): PaymentOrder => ({
  mode: "live",
  orderNo: "PM20260101000000ABCD",
  codeUrl: "weixin://wxpay/bizpayurl/mock",
  qrCodeImageUrl: null,
  amountFen: 39800,
  expiresAt: null,
  ...overrides,
});

describe("PaymentQrModal", () => {
  it("payment 为 null 时不渲染（关闭即停止轮询的约定）", () => {
    render(
      <PaymentQrModal
        payment={null}
        status={null}
        title="额度充值"
        icon={<span />}
        amountText="¥398"
        onClose={vi.fn()}
      />,
    );

    expect(screen.queryByText("额度充值")).not.toBeInTheDocument();
  });

  it("有二维码图时按后端下发的 data URL 展示", () => {
    render(
      <PaymentQrModal
        payment={buildPayment({ qrCodeImageUrl: "data:image/png;base64,REAL" })}
        status="pending"
        title="额度充值"
        icon={<span />}
        amountText="¥398"
        onClose={vi.fn()}
      />,
    );

    const image = screen.getByAltText("额度充值支付二维码");
    expect(image.getAttribute("src")).toBe("data:image/png;base64,REAL");
  });

  it("没有二维码图且未支付时给出可行动的失败提示", () => {
    render(
      <PaymentQrModal
        payment={buildPayment()}
        status="pending"
        title="额度充值"
        icon={<span />}
        amountText="¥398"
        onClose={vi.fn()}
      />,
    );

    expect(
      screen.getByText("二维码生成失败，请关闭后重新发起支付"),
    ).toBeInTheDocument();
  });

  it("未过期时展示二维码剩余有效期", () => {
    render(
      <PaymentQrModal
        payment={buildPayment({
          qrCodeImageUrl: "data:image/png;base64,REAL",
          expiresAt: new Date(Date.now() + 5 * 60_000).toISOString(),
        })}
        status="pending"
        title="额度充值"
        icon={<span />}
        amountText="¥398"
        onClose={vi.fn()}
      />,
    );

    expect(screen.getByText(/二维码将在/)).toBeInTheDocument();
  });

  it("二维码已过期时提示重新发起支付，不再引导继续扫码", () => {
    render(
      <PaymentQrModal
        payment={buildPayment({
          qrCodeImageUrl: "data:image/png;base64,REAL",
          expiresAt: new Date(Date.now() - 1_000).toISOString(),
        })}
        status="pending"
        title="额度充值"
        icon={<span />}
        amountText="¥398"
        onClose={vi.fn()}
      />,
    );

    expect(
      screen.getByText("二维码已过期，请关闭后重新发起支付"),
    ).toBeInTheDocument();
    expect(
      screen.queryByText("请使用微信扫码支付，支付完成后自动继续"),
    ).not.toBeInTheDocument();
  });

  it("已支付时展示成功态，不再提示二维码失败", () => {
    render(
      <PaymentQrModal
        payment={buildPayment()}
        status="paid"
        title="额度充值"
        icon={<span />}
        amountText="¥398"
        onClose={vi.fn()}
      />,
    );

    expect(screen.getByText("支付成功，正在处理…")).toBeInTheDocument();
    expect(
      screen.queryByText("二维码生成失败，请关闭后重新发起支付"),
    ).not.toBeInTheDocument();
  });
});
