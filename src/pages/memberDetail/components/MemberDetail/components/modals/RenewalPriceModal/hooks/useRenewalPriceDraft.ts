// 「调整续费价格」弹窗的草稿状态：拉取现状、维护输入草稿、算出待提交的改动。
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { fetchMemberRenewalPrices } from '@pages/memberList/memberList.service';
import type { MemberRenewalPrice, MemberRenewalPriceUpdateItem, RenewalPricePlanId } from '@pages/memberList/memberList.pricing.types';
import {
  isPriceInputValid,
  isRowChanged,
  resolveRenewalInputValue,
} from '../renewalPriceModal.utils';

interface UseRenewalPriceDraftParams {
  /** 目标会员 id。 */
  memberId: string;
}

export interface UseRenewalPriceDraftReturn {
  /** 各档位续费价现状（后端下发，含最终价与可编辑性）。 */
  items: MemberRenewalPrice[];
  /** 是否正在拉取现状。 */
  isLoading: boolean;
  /** 拉取失败文案；空串表示无错误。 */
  errorMessage: string;
  /** 重新拉取（失败重试用）。 */
  reload: () => void;
  /** 各档位的输入草稿，key 为档位标识。 */
  draftValues: Record<string, string>;
  /** 更新某个档位的输入草稿。 */
  handleInputChange: (planId: RenewalPricePlanId, value: string) => void;
  /** 清空某个档位的覆盖价，恢复按配置价续费。 */
  handleClearRow: (planId: RenewalPricePlanId) => void;
  /** 待提交的改动项（只含真正改过的行）。 */
  changedItems: MemberRenewalPriceUpdateItem[];
  /** 格式非法的档位，用于行内报错与禁用提交。 */
  invalidPlanIds: readonly RenewalPricePlanId[];
  /** 是否可提交：有改动且全部合法。 */
  canSubmit: boolean;
  /** 提交成功后用后端回包刷新列表与草稿。 */
  applyUpdatedItems: (items: MemberRenewalPrice[]) => void;
}

/** 稳定的空列表引用：未加载完成时复用同一个值，避免下游 useMemo 无谓重算。 */
const EMPTY_RENEWAL_PRICE_ITEMS: MemberRenewalPrice[] = [];

/**
 * 草稿初值：回显**当前生效的定价基数**（配置价与议定价取高者），未议定留空
 * （占位符会提示按配置价续费）。
 *
 * 不能直接抄 `overridePriceDisplay`：配置价涨过议定价后，库里那个旧议定价已不生效，
 * 回显它会让运营看到「输入框 499 / 现续费价 599」这种自相矛盾的现状。
 */
const buildDraftValues = (items: MemberRenewalPrice[]): Record<string, string> =>
  items.reduce<Record<string, string>>((draft, item) => {
    draft[item.planId] = resolveRenewalInputValue(item);
    return draft;
  }, {});

/**
 * 续费价草稿 hook。
 *
 * 打开弹窗即拉一次现状；提交成功后用回包直接刷新，避免「先关弹窗再回读」的竞态。
 */
export const useRenewalPriceDraft = ({
  memberId,
}: UseRenewalPriceDraftParams): UseRenewalPriceDraftReturn => {
  const [draftValues, setDraftValues] = useState<Record<string, string>>({});
  const [reloadToken, setReloadToken] = useState(0);
  /**
   * 已落地的结果与产生它的请求指纹绑定。
   *
   * 参数一变旧结果立刻失效，「加载中」由 `key !== 当前指纹` 直接派生——
   * 这样 effect 里不需要同步 setState 去重置 loading / error，
   * 既避开级联渲染，也不会出现「改了会员还显示上一个会员的价」。
   */
  const [loadedState, setLoadedState] = useState<{
    key: string;
    items: MemberRenewalPrice[];
    error: string;
  } | null>(null);

  const requestKey = `${memberId}#${reloadToken}`;

  // 快速重试时旧响应可能后到，用序号丢弃过期结果
  const requestSeqRef = useRef(0);

  useEffect(() => {
    const requestSeq = requestSeqRef.current + 1;
    requestSeqRef.current = requestSeq;
    let cancelled = false;

    fetchMemberRenewalPrices(memberId)
      .then((result) => {
        if (cancelled || requestSeqRef.current !== requestSeq) {
          return;
        }
        setLoadedState({ key: requestKey, items: result, error: '' });
        setDraftValues(buildDraftValues(result));
      })
      .catch((error: unknown) => {
        if (cancelled || requestSeqRef.current !== requestSeq) {
          return;
        }
        setLoadedState({
          key: requestKey,
          items: EMPTY_RENEWAL_PRICE_ITEMS,
          error: error instanceof Error ? error.message : '获取续费价格失败',
        });
      });

    return () => {
      cancelled = true;
    };
  }, [memberId, requestKey]);

  const isLoaded = loadedState?.key === requestKey;
  const items = isLoaded ? loadedState.items : EMPTY_RENEWAL_PRICE_ITEMS;
  const errorMessage = isLoaded ? loadedState.error : '';

  const reload = useCallback((): void => {
    setReloadToken((token) => token + 1);
  }, []);

  const handleInputChange = useCallback((planId: RenewalPricePlanId, value: string): void => {
    setDraftValues((prev) => ({ ...prev, [planId]: value }));
  }, []);

  const handleClearRow = useCallback((planId: RenewalPricePlanId): void => {
    setDraftValues((prev) => ({ ...prev, [planId]: '' }));
  }, []);

  const invalidPlanIds = useMemo(
    () => items
      .filter((item) => item.editable && !isPriceInputValid(draftValues[item.planId] ?? ''))
      .map((item) => item.planId),
    [draftValues, items],
  );

  const changedItems = useMemo(
    () => items.reduce<MemberRenewalPriceUpdateItem[]>((changed, item) => {
      // 不可编辑档位（含子账号的月 / 季）后端会拒绝，绝不提交
      if (!item.editable) {
        return changed;
      }

      const draftValue = draftValues[item.planId] ?? '';
      if (!isRowChanged(item, draftValue)) {
        return changed;
      }

      changed.push({ planId: item.planId, priceDisplay: draftValue.trim() });
      return changed;
    }, []),
    [draftValues, items],
  );

  const applyUpdatedItems = useCallback((nextItems: MemberRenewalPrice[]): void => {
    setLoadedState((prev) => (
      prev ? { ...prev, items: nextItems } : { key: requestKey, items: nextItems, error: '' }
    ));
    setDraftValues(buildDraftValues(nextItems));
  }, [requestKey]);

  return {
    items,
    isLoading: !isLoaded,
    errorMessage,
    reload,
    draftValues,
    handleInputChange,
    handleClearRow,
    changedItems,
    invalidPlanIds,
    canSubmit: changedItems.length > 0 && invalidPlanIds.length === 0,
    applyUpdatedItems,
  };
};
