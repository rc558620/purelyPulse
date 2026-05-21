// 会员详情页纯利豆调整弹窗：薄壳，仅注入纯利豆语义配置。
import React from 'react';
import type { AdjustDir } from '../../../../../../partnerBeans/partnerBeans.shared.types';
import { IconBeanCoin } from '@pages/memberDetail/components/MemberDetailIcons/MemberDetailIcons';
import MemberAssetAdjustModal from '../MemberAssetAdjustModal/MemberAssetAdjustModal';
import type { MemberDetail } from '@pages/memberList/memberList.types';

export interface AdjustBeanModalProps {
  member: MemberDetail;
  currentBeans: number;
  onClose: () => void;
  onConfirm: (delta: number, reason: string) => Promise<void> | void;
}

const DIR_OPTIONS: Array<{ value: AdjustDir; label: string; sign: string }> = [
  { value: 'add', label: '增加纯利豆', sign: '+' },
  { value: 'subtract', label: '减少纯利豆', sign: '-' },
];

const PRESET_AMOUNTS = [50, 100, 200, 500, 1000];

const REASON_PRESETS = [
  '推广奖励补发',
  '活动奖励纯利豆',
  '合伙人回馈纯利豆',
  '管理员手动扣减',
  '提现扣除修正',
  '系统错误修正',
];

const AdjustBeanModal: React.FC<AdjustBeanModalProps> = ({
  member,
  currentBeans,
  onClose,
  onConfirm,
}) => (
  <MemberAssetAdjustModal
    member={member}
    currentValue={currentBeans}
    title="调整纯利豆"
    amountPlaceholder="输入纯利豆数量"
    amountAriaLabel="纯利豆调整数量"
    reasonAriaLabel="纯利豆调整原因"
    balanceLabel="纯利豆余额"
    unitLabel="纯利豆"
    confirmVerbLabel="调整"
    icon={<IconBeanCoin width={16} height={16} strokeWidth={2.2} />}
    reasonPresets={REASON_PRESETS}
    presetAmounts={PRESET_AMOUNTS}
    dirOptions={DIR_OPTIONS}
    onClose={onClose}
    onConfirm={onConfirm}
  />
);

export default AdjustBeanModal;
