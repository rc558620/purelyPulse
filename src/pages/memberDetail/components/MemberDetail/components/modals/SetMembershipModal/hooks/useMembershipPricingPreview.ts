// 「设置会员等级」弹窗的成交价预览：输入变化后防抖请求后端，金额一律由后端算好下发。
import { useEffect, useState } from 'react';
import {
  fetchMembershipPricingPreview,
  type MemberPricingPreview,
} from '@pages/memberList/memberList.service';
import type { ModalMembershipSelection } from '../SetMembershipModal.types';
import { buildPreviewRequestKey } from '../setMembershipModal.utils';

/** 防抖时长：运营连续输入时不打断，停下来再算一次 */
const PREVIEW_DEBOUNCE_MS = 300;

interface UseMembershipPricingPreviewParams {
  memberId: string;
  selectedDuration: ModalMembershipSelection;
  amountInput: string;
  subAccountCountInput: string;
  subAccountAmountInput: string;
  /** 仅年度 / 永久会员需要自定义价格，其它档位不必请求预览 */
  enabled: boolean;
}

export interface UseMembershipPricingPreviewReturn {
  /** 后端算好的成交价预览；参数已变或尚未算出时为 null */
  pricingPreview: MemberPricingPreview | null;
  /** 预览请求是否在途（防抖等待中或请求中） */
  isPreviewPending: boolean;
}

/**
 * 成交价预览 hook。
 *
 * 结果与产生它的请求参数（requestKey）绑定：参数一变旧结果立刻失效，
 * 因此不必在 effect 里 setState(null) 清空——既避免级联渲染，
 * 也不会出现「改了输入还显示上一次价格」的脏展示。
 */
export const useMembershipPricingPreview = ({
  memberId,
  selectedDuration,
  amountInput,
  subAccountCountInput,
  subAccountAmountInput,
  enabled,
}: UseMembershipPricingPreviewParams): UseMembershipPricingPreviewReturn => {
  const [
    pricingPreviewState,
    setPricingPreviewState,
  ] = useState<{ requestKey: string; data: MemberPricingPreview } | null>(null);
  /** 预览请求失败时的参数指纹；与当前 key 一致才认为「这一次失败了」 */
  const [previewFailureKey, setPreviewFailureKey] = useState<string | null>(null);

  const previewRequestKey = buildPreviewRequestKey({
    memberId,
    selectedDuration,
    amountInput,
    subAccountCountInput,
    subAccountAmountInput,
  });

  useEffect(() => {
    if (!enabled) {
      return undefined;
    }

    let cancelled = false;
    const parsedCount = Number.parseInt(subAccountCountInput, 10);

    const timer = setTimeout(() => {
      fetchMembershipPricingPreview(memberId, {
        level: selectedDuration,
        priceDisplay: amountInput.trim() || undefined,
        subAccountCount: Number.isFinite(parsedCount) ? parsedCount : undefined,
        subAccountAmountDisplay: subAccountAmountInput.trim() || undefined,
      })
        .then((result) => {
          if (!cancelled) {
            setPricingPreviewState({
              requestKey: previewRequestKey,
              data: result,
            });
          }
        })
        .catch(() => {
          // 预览失败保留上一次结果，不打断运营填写；只记下「这一次失败了」，
          // 让确认步骤把空白区分成「计算中」与「算不出来」
          if (!cancelled) {
            setPreviewFailureKey(previewRequestKey);
          }
        });
    }, PREVIEW_DEBOUNCE_MS);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [
    amountInput,
    enabled,
    memberId,
    previewRequestKey,
    selectedDuration,
    subAccountAmountInput,
    subAccountCountInput,
  ]);

  // 只有参数与当前输入完全一致时才认这份预览，否则视为尚未算出
  const pricingPreview = enabled && pricingPreviewState?.requestKey === previewRequestKey
    ? pricingPreviewState.data
    : null;

  /**
   * 预览是否在途：还没算出结果、且这一次也没失败。
   *
   * 与结果一样按 requestKey 判定，因此不需要在 effect 里同步 setState 去维护
   * pending 标记——参数一变旧结果自然失效，pending 也随之恢复。
   */
  const isPreviewPending = enabled && pricingPreview === null && previewFailureKey !== previewRequestKey;

  return { pricingPreview, isPreviewPending };
};
