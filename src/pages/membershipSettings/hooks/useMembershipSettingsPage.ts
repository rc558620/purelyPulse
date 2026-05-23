// 会员设置页面 Hook：负责请求时机、错误状态与单卡保存后的页面数据同步。
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  createDefaultMembershipTierValues,
  fetchMembershipSettings,
  updateMembershipTierSetting,
} from '../membershipSettings.service';
import type {
  MembershipTierValuesMap,
  TierId,
  TierValue,
  UseMembershipSettingsPageResult,
} from '../membershipSettings.types';

export const useMembershipSettingsPage = (): UseMembershipSettingsPageResult => {
  const [tierValues, setTierValues] = useState<MembershipTierValuesMap>(() => createDefaultMembershipTierValues());
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const requestIdRef = useRef<number>(0);

  const loadMembershipSettings = useCallback(async (): Promise<void> => {
    requestIdRef.current += 1;
    const currentRequestId = requestIdRef.current;
    setIsLoading(true);

    try {
      const response = await fetchMembershipSettings();
      if (currentRequestId !== requestIdRef.current) {
        return;
      }

      setTierValues(response);
      setErrorMessage('');
    } catch (error) {
      if (currentRequestId !== requestIdRef.current) {
        return;
      }

      setTierValues(createDefaultMembershipTierValues());
      setErrorMessage(error instanceof Error ? error.message : '获取会员套餐配置失败');
    } finally {
      if (currentRequestId === requestIdRef.current) {
        setIsLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    void loadMembershipSettings();
  }, [loadMembershipSettings]);

  const handleSaveTierValue = useCallback(async (tierId: TierId, value: TierValue): Promise<TierValue> => {
    const nextValue = await updateMembershipTierSetting(tierId, value);
    setTierValues((previousValues) => ({
      ...previousValues,
      [tierId]: nextValue,
    }));
    return nextValue;
  }, []);

  const retryLoad = useCallback((): void => {
    void loadMembershipSettings();
  }, [loadMembershipSettings]);

  return {
    tierValues,
    isLoading,
    errorMessage,
    retryLoad,
    handleSaveTierValue,
  };
};
