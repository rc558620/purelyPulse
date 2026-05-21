// 会员详情页积分调整弹窗：薄壳，仅注入积分语义配置。
import React from 'react';
import type { MemberPointsAdjustDir as AdjustDir } from '../../../../../../memberPoints/memberPoints.types';
import { IconStarBadge } from '@pages/memberDetail/components/MemberDetailIcons/MemberDetailIcons';
import MemberAssetAdjustModal from '../MemberAssetAdjustModal/MemberAssetAdjustModal';
import type { MemberDetail } from '@pages/memberList/memberList.types';

export interface AdjustPointsModalProps {
  member: MemberDetail;
  currentPoints: number;
  onClose: () => void;
  onConfirm: (delta: number, reason: string) => Promise<void> | void;
}

const DIR_OPTIONS: Array<{ value: AdjustDir; label: string; sign: string }> = [
  { value: 'add', label: '增加积分', sign: '+' },
  { value: 'subtract', label: '减少积分', sign: '-' },
];

const PRESET_AMOUNTS = [50, 100, 200, 500, 1000];

const REASON_PRESETS = [
  '活动奖励积分',
  '老会员回馈积分',
  '补偿用户积分',
  '购买奖励补发',
  '管理员手动扣减',
  '系统错误修正',
];

const AdjustPointsModal: React.FC<AdjustPointsModalProps> = ({
  member,
  currentPoints,
  onClose,
  onConfirm,
}) => (
  <MemberAssetAdjustModal
    member={member}
    currentValue={currentPoints}
    title="调整积分"
    amountPlaceholder="输入积分数量"
    amountAriaLabel="积分调整数量"
    reasonAriaLabel="积分调整原因"
    balanceLabel="当前积分"
    unitLabel="积分"
    confirmVerbLabel="调整"
    icon={<IconStarBadge width={16} height={16} strokeWidth={2.2} />}
    reasonPresets={REASON_PRESETS}
    presetAmounts={PRESET_AMOUNTS}
    dirOptions={DIR_OPTIONS}
    onClose={onClose}
    onConfirm={onConfirm}
  />
);

export default AdjustPointsModal;
