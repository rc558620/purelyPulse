// 会员详情弹窗状态机：收敛「当前打开哪个弹窗」以及需要等待结果才能关闭的确认流程。
import { useCallback, useState } from 'react';
import type { MemberDetailActiveModal } from '../MemberDetail.types';

export interface UseMemberDetailModalsParams {
  /** 当前会员是否处于封禁状态：决定状态弹窗走「解封」还是「封禁」。 */
  isBannedMember: boolean;
  /** 是否正在提交封禁 / 解封：提交中不允许关闭弹窗。 */
  isSubmittingBan: boolean;
  /** 封禁会员。 */
  handleBanMember: (reason: string) => Promise<boolean>;
  /** 解封会员。 */
  handleUnbanMember: () => Promise<boolean>;
  /** 注销会员账号（不可逆）。 */
  handleCancelAccount: () => Promise<boolean>;
}

export interface UseMemberDetailModalsReturn {
  /** 当前打开的弹窗。 */
  activeModal: MemberDetailActiveModal;
  /** 封禁原因输入值。 */
  banReason: string;
  /** 更新封禁原因输入值。 */
  handleBanReasonChange: (reason: string) => void;
  /** 打开调整积分弹窗。 */
  handleOpenPointsModal: () => void;
  /** 打开调整纯利豆弹窗。 */
  handleOpenBeanModal: () => void;
  /** 打开设置会员等级弹窗。 */
  handleOpenMembershipModal: () => void;
  /** 打开调整续费价格弹窗。 */
  handleOpenRenewalPriceModal: () => void;
  /** 打开封禁 / 解封弹窗（先清空上一次填写的原因）。 */
  handleOpenStatusModal: () => void;
  /** 打开子账号配置弹窗。 */
  handleOpenSubAccountModal: () => void;
  /** 打开子账号详情弹窗。 */
  handleOpenSubAccountDetailModal: () => void;
  /** 打开会员运营情况弹窗。 */
  handleOpenClubStatsModal: () => void;
  /** 打开营业详情弹窗。 */
  handleOpenSalesStatsModal: () => void;
  /** 打开注销账号弹窗。 */
  handleOpenCancelAccountModal: () => void;
  /** 关闭当前弹窗。 */
  handleCloseModal: () => void;
  /** 关闭封禁 / 解封弹窗；提交中忽略。 */
  handleCloseStatusModal: () => void;
  /** 提交封禁 / 解封，成功后关闭弹窗。 */
  handleStatusConfirm: () => Promise<void>;
  /** 提交注销账号，成功后关闭弹窗。 */
  handleCancelAccountConfirm: () => Promise<void>;
}

/** 会员详情弹窗状态机。 */
export const useMemberDetailModals = ({
  isBannedMember,
  isSubmittingBan,
  handleBanMember,
  handleUnbanMember,
  handleCancelAccount,
}: UseMemberDetailModalsParams): UseMemberDetailModalsReturn => {
  const [activeModal, setActiveModal] = useState<MemberDetailActiveModal>(null);
  const [banReason, setBanReason] = useState<string>('');

  const handleCloseModal = useCallback((): void => {
    setActiveModal(null);
  }, []);

  const handleOpenPointsModal = useCallback((): void => {
    setActiveModal('points');
  }, []);

  const handleOpenBeanModal = useCallback((): void => {
    setActiveModal('beans');
  }, []);

  const handleOpenMembershipModal = useCallback((): void => {
    setActiveModal('membership');
  }, []);

  const handleOpenRenewalPriceModal = useCallback((): void => {
    setActiveModal('renewalPrice');
  }, []);

  const handleOpenStatusModal = useCallback((): void => {
    setBanReason('');
    setActiveModal('status');
  }, []);

  const handleOpenSubAccountModal = useCallback((): void => {
    setActiveModal('subAccount');
  }, []);

  const handleOpenSubAccountDetailModal = useCallback((): void => {
    setActiveModal('subAccountDetail');
  }, []);

  const handleOpenClubStatsModal = useCallback((): void => {
    setActiveModal('clubStats');
  }, []);

  const handleOpenSalesStatsModal = useCallback((): void => {
    setActiveModal('salesStats');
  }, []);

  const handleOpenCancelAccountModal = useCallback((): void => {
    setActiveModal('cancelAccount');
  }, []);

  const handleBanReasonChange = useCallback((reason: string): void => {
    setBanReason(reason);
  }, []);

  const handleCancelAccountConfirm = useCallback(async (): Promise<void> => {
    const didCancel = await handleCancelAccount();
    if (didCancel) {
      setActiveModal(null);
    }
  }, [handleCancelAccount]);

  const handleCloseStatusModal = useCallback((): void => {
    if (isSubmittingBan) {
      return;
    }

    setActiveModal(null);
    setBanReason('');
  }, [isSubmittingBan]);

  const handleStatusConfirm = useCallback(async (): Promise<void> => {
    if (isBannedMember) {
      const didUnban = await handleUnbanMember();
      if (didUnban) {
        setActiveModal(null);
      }
      return;
    }

    const didBan = await handleBanMember(banReason);
    if (didBan) {
      setActiveModal(null);
    }
  }, [banReason, handleBanMember, handleUnbanMember, isBannedMember]);

  return {
    activeModal,
    banReason,
    handleBanReasonChange,
    handleOpenPointsModal,
    handleOpenBeanModal,
    handleOpenMembershipModal,
    handleOpenRenewalPriceModal,
    handleOpenStatusModal,
    handleOpenSubAccountModal,
    handleOpenSubAccountDetailModal,
    handleOpenClubStatsModal,
    handleOpenSalesStatsModal,
    handleOpenCancelAccountModal,
    handleCloseModal,
    handleCloseStatusModal,
    handleStatusConfirm,
    handleCancelAccountConfirm,
  };
};
