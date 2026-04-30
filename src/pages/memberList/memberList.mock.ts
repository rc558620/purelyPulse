// ─── 会员列表 Mock 数据 ──────────────────────────────────────────────
import type { MemberDetail, MemberListItem } from './memberList.types';

const now = Date.now();
const DAY = 86_400_000;

// ─── 完整会员详情数据 ────────────────────────────────────────────────
export const MOCK_MEMBER_DETAILS: MemberDetail[] = [
  {
    id: 'm001',
    name: '刘梅',
    phone: '138****9021',
    avatarChar: '刘',
    avatarColorIdx: 0,
    status: 'active',
    level: 'annual',
    registeredAt: now - DAY * 180,
    lastActiveAt: now - DAY * 1,
    availablePoints: 1280,
    totalPointsEarned: 2800,
    beanBalance: 0,
    isPartner: false,
    totalRecharged: 59800,
    rechargeCount: 3,
    invitedCount: 2,
    rechargeHistory: [
      { id: 'rc-001', planName: '年卡会员', amount: 29800, pointsAwarded: 500, channel: 'wechat', createdAt: now - DAY * 10 },
      { id: 'rc-002', planName: '年卡会员', amount: 29800, pointsAwarded: 500, channel: 'alipay', createdAt: now - DAY * 180 },
      { id: 'rc-003', planName: '月卡会员', amount: 200,   pointsAwarded: 50,  channel: 'wechat', createdAt: now - DAY * 365 },
    ],
    remark: '老会员，优先服务',
  },
  {
    id: 'm002',
    name: '陈建国',
    phone: '139****5566',
    avatarChar: '陈',
    avatarColorIdx: 1,
    status: 'active',
    level: 'quarterly',
    registeredAt: now - DAY * 120,
    lastActiveAt: now - DAY * 2,
    availablePoints: 540,
    totalPointsEarned: 940,
    beanBalance: 3200,
    isPartner: true,
    partnerLevel: 'P2',
    totalRecharged: 28800,
    rechargeCount: 2,
    invitedCount: 15,
    rechargeHistory: [
      { id: 'rc-011', planName: '季度会员', amount: 9800, pointsAwarded: 200, channel: 'wechat', createdAt: now - DAY * 5 },
      { id: 'rc-012', planName: '季度会员', amount: 9800, pointsAwarded: 200, channel: 'wechat', createdAt: now - DAY * 95 },
    ],
  },
  {
    id: 'm003',
    name: '王雅婷',
    phone: '156****8830',
    avatarChar: '王',
    avatarColorIdx: 2,
    status: 'active',
    level: 'annual',
    registeredAt: now - DAY * 240,
    lastActiveAt: now - DAY * 0,
    availablePoints: 2100,
    totalPointsEarned: 3800,
    beanBalance: 1800,
    isPartner: true,
    partnerLevel: 'P3',
    totalRecharged: 89400,
    rechargeCount: 5,
    invitedCount: 32,
    rechargeHistory: [
      { id: 'rc-021', planName: '年卡会员', amount: 29800, pointsAwarded: 500, channel: 'alipay', createdAt: now - DAY * 3 },
      { id: 'rc-022', planName: '年卡会员', amount: 29800, pointsAwarded: 500, channel: 'alipay', createdAt: now - DAY * 120 },
      { id: 'rc-023', planName: '季度会员', amount: 9800,  pointsAwarded: 200, channel: 'wechat', createdAt: now - DAY * 210 },
    ],
    remark: '博主合伙人，优先级高',
  },
  {
    id: 'm004',
    name: '周浩然',
    phone: '187****4412',
    avatarChar: '周',
    avatarColorIdx: 3,
    status: 'active',
    level: 'monthly',
    registeredAt: now - DAY * 60,
    lastActiveAt: now - DAY * 5,
    availablePoints: 320,
    totalPointsEarned: 420,
    beanBalance: 0,
    isPartner: false,
    totalRecharged: 5800,
    rechargeCount: 2,
    invitedCount: 0,
    rechargeHistory: [
      { id: 'rc-031', planName: '月卡会员', amount: 2900, pointsAwarded: 50, channel: 'wechat', createdAt: now - DAY * 8 },
      { id: 'rc-032', planName: '月卡会员', amount: 2900, pointsAwarded: 50, channel: 'card',   createdAt: now - DAY * 38 },
    ],
  },
  {
    id: 'm005',
    name: '林晓燕',
    phone: '135****7701',
    avatarChar: '林',
    avatarColorIdx: 4,
    status: 'active',
    level: 'quarterly',
    registeredAt: now - DAY * 150,
    lastActiveAt: now - DAY * 3,
    availablePoints: 880,
    totalPointsEarned: 1380,
    beanBalance: 600,
    isPartner: true,
    partnerLevel: 'P1',
    totalRecharged: 19600,
    rechargeCount: 2,
    invitedCount: 8,
    rechargeHistory: [
      { id: 'rc-041', planName: '季度会员', amount: 9800, pointsAwarded: 200, channel: 'alipay', createdAt: now - DAY * 12 },
      { id: 'rc-042', planName: '季度会员', amount: 9800, pointsAwarded: 200, channel: 'alipay', createdAt: now - DAY * 102 },
    ],
  },
  {
    id: 'm006',
    name: '张宇',
    phone: '177****2233',
    avatarChar: '张',
    avatarColorIdx: 5,
    status: 'inactive',
    level: 'free',
    registeredAt: now - DAY * 90,
    lastActiveAt: now - DAY * 45,
    availablePoints: 0,
    totalPointsEarned: 150,
    beanBalance: 0,
    isPartner: false,
    totalRecharged: 0,
    rechargeCount: 0,
    invitedCount: 0,
    rechargeHistory: [],
  },
  {
    id: 'm007',
    name: '赵小红',
    phone: '186****3344',
    avatarChar: '赵',
    avatarColorIdx: 0,
    status: 'active',
    level: 'monthly',
    registeredAt: now - DAY * 45,
    lastActiveAt: now - DAY * 1,
    availablePoints: 450,
    totalPointsEarned: 450,
    beanBalance: 0,
    isPartner: false,
    totalRecharged: 5800,
    rechargeCount: 1,
    invitedCount: 1,
    rechargeHistory: [
      { id: 'rc-071', planName: '月卡会员', amount: 2900, pointsAwarded: 50, channel: 'wechat', createdAt: now - DAY * 8 },
    ],
  },
  {
    id: 'm008',
    name: '孙鑫',
    phone: '150****8877',
    avatarChar: '孙',
    avatarColorIdx: 1,
    status: 'banned',
    level: 'free',
    registeredAt: now - DAY * 200,
    lastActiveAt: now - DAY * 60,
    availablePoints: 0,
    totalPointsEarned: 100,
    beanBalance: 0,
    isPartner: false,
    totalRecharged: 2900,
    rechargeCount: 1,
    invitedCount: 0,
    rechargeHistory: [
      { id: 'rc-081', planName: '月卡会员', amount: 2900, pointsAwarded: 50, channel: 'wechat', createdAt: now - DAY * 180 },
    ],
    remark: '违规操作，已封禁',
  },
];

// ─── 会员列表轻量数据（从详情映射） ─────────────────────────────────────
export const MOCK_MEMBER_LIST: MemberListItem[] = MOCK_MEMBER_DETAILS.map(d => ({
  id: d.id,
  name: d.name,
  phone: d.phone,
  avatarChar: d.avatarChar,
  avatarColorIdx: d.avatarColorIdx,
  status: d.status,
  level: d.level,
  availablePoints: d.availablePoints,
  beanBalance: d.beanBalance,
  isPartner: d.isPartner,
  totalRecharged: d.totalRecharged,
  registeredAt: d.registeredAt,
  lastActiveAt: d.lastActiveAt,
}));

// ─── 等级显示映射 ────────────────────────────────────────────────────
export const LEVEL_LABEL: Record<string, string> = {
  free:      '免费',
  monthly:   '月卡',
  quarterly: '季卡',
  annual:    '年卡',
};

// ─── 状态显示映射 ────────────────────────────────────────────────────
export const STATUS_LABEL: Record<string, string> = {
  active:   '正常',
  inactive: '未活跃',
  banned:   '已封禁',
};

// ─── 头像背景色表 ────────────────────────────────────────────────────
export const AVATAR_COLORS = [
  'linear-gradient(135deg, #84cc16, #4ade80)',   // 绿
  'linear-gradient(135deg, #3b82f6, #60a5fa)',   // 蓝
  'linear-gradient(135deg, #a855f7, #c084fc)',   // 紫
  'linear-gradient(135deg, #f59e0b, #fbbf24)',   // 琥珀
  'linear-gradient(135deg, #10b981, #34d399)',   // 翠
  'linear-gradient(135deg, #f43f5e, #fb7185)',   // 玫红
];
