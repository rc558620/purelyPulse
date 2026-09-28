// useSubAccountQuotaEditor：管理子账号数量的输入框显示值、有效值与「关闭 / 恢复」切换。
import { useCallback, useRef, useState } from 'react';
import type { ChangeEvent } from 'react';
import { safeNum } from '@utils/utils';
import { QUOTA_MAX } from '../SetSubAccountModal.constants';

interface UseSubAccountQuotaEditorParams {
  /** 进入弹窗时的配额快照，用于判定本次是否发生变更 */
  initialQuota: number;
  /** 只有年 / 永久会员允许编辑配额 */
  isEligible: boolean;
}

interface UseSubAccountQuotaEditorResult {
  /** 当前生效的配额；0 表示子账号已关闭 */
  selectedQuota: number;
  /** 输入框原始字符串，允许出现空串与中间态输入 */
  inputValue: string;
  isZeroSelected: boolean;
  isQuotaChanged: boolean;
  /** 关闭 / 恢复子账号 */
  handleToggleEnabled: () => void;
  handleInputChange: (event: ChangeEvent<HTMLInputElement>) => void;
  handleInputBlur: () => void;
  handleInputFocus: () => void;
}

/** 解析失败时的兜底值：落在 [1, QUOTA_MAX] 之外，天然被判定为无效输入。 */
const INVALID_QUOTA = -1;

const parseQuota = (rawValue: string): number => safeNum(Number.parseInt(rawValue, 10), INVALID_QUOTA);

export const useSubAccountQuotaEditor = ({
  initialQuota,
  isEligible,
}: UseSubAccountQuotaEditorParams): UseSubAccountQuotaEditorResult => {
  const [selectedQuota, setSelectedQuota] = useState<number>(initialQuota);
  const [inputValue, setInputValue] = useState<string>(initialQuota > 0 ? String(initialQuota) : '');
  // 最近一次有效配额：从「关闭」恢复时直接回填，不让运营重新输一遍
  const lastValidQuotaRef = useRef<number>(initialQuota > 0 ? initialQuota : 1);

  const handleToggleEnabled = useCallback((): void => {
    if (!isEligible) {
      return;
    }

    if (selectedQuota === 0) {
      const restoreQuota = lastValidQuotaRef.current;
      setSelectedQuota(restoreQuota);
      setInputValue(String(restoreQuota));
      return;
    }

    lastValidQuotaRef.current = selectedQuota;
    setSelectedQuota(0);
    setInputValue('');
  }, [isEligible, selectedQuota]);

  const handleInputChange = useCallback((event: ChangeEvent<HTMLInputElement>): void => {
    const rawValue = event.target.value;
    setInputValue(rawValue);

    if (rawValue === '') {
      return;
    }

    const parsedValue = parseQuota(rawValue);
    if (parsedValue >= 1 && parsedValue <= QUOTA_MAX) {
      setSelectedQuota(parsedValue);
      lastValidQuotaRef.current = parsedValue;
    }
  }, []);

  const handleInputBlur = useCallback((): void => {
    const parsedValue = parseQuota(inputValue);
    if (parsedValue < 1) {
      setInputValue(selectedQuota > 0 ? String(selectedQuota) : '');
      return;
    }

    const nextQuota = Math.min(QUOTA_MAX, parsedValue);
    setSelectedQuota(nextQuota);
    setInputValue(String(nextQuota));
    lastValidQuotaRef.current = nextQuota;
  }, [inputValue, selectedQuota]);

  const handleInputFocus = useCallback((): void => {
    if (!isEligible || selectedQuota !== 0) {
      return;
    }

    const restoreQuota = lastValidQuotaRef.current;
    setSelectedQuota(restoreQuota);
    setInputValue(String(restoreQuota));
  }, [isEligible, selectedQuota]);

  return {
    selectedQuota,
    inputValue,
    isZeroSelected: selectedQuota === 0,
    isQuotaChanged: selectedQuota !== initialQuota,
    handleToggleEnabled,
    handleInputChange,
    handleInputBlur,
    handleInputFocus,
  };
};
