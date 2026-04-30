// ─── 纯利豆管理页 Mock 数据 ────────────────────────────────────────
import type { BeanRecord, UserSnapshot } from '../memberPoints/memberPoints.types';

const now = Date.now();
const DAY = 86_400_000;

// ─── Mock 合伙人用户列表（纯利豆只有合伙人才有）─────────────────────
export const MOCK_PARTNER_USERS: UserSnapshot[] = [
  { id: 'u002', name: '陈建国', phone: '139****5566', availablePoints: 540,  beanBalance: 3200, isPartner: true  },
  { id: 'u003', name: '王雅婷', phone: '156****8830', availablePoints: 2100, beanBalance: 1800, isPartner: true  },
  { id: 'u005', name: '林晓燕', phone: '135****7701', availablePoints: 880,  beanBalance: 600,  isPartner: true  },
];

// ─── Mock 纯利豆记录 ──────────────────────────────────────────────
export const MOCK_BEAN_RECORDS: BeanRecord[] = [
  {
    id: 'bean-001', userId: 'u002', userName: '陈建国', userPhone: '139****5566',
    amount: 100, type: 'earn',   source: 'promo_reward',  description: '推广奖励（张宇 / 年度会员）',     createdAt: now - DAY *  1,
    relatedUser: '张宇',
  },
  {
    id: 'bean-002', userId: 'u003', userName: '王雅婷', userPhone: '156****8830',
    amount: 50,  type: 'earn',   source: 'promo_reward',  description: '推广奖励（周浩然 / 季度会员）',   createdAt: now - DAY *  2,
    relatedUser: '周浩然',
  },
  {
    id: 'bean-003', userId: 'u002', userName: '陈建国', userPhone: '139****5566',
    amount: 200, type: 'earn',   source: 'admin_adjust',  description: '管理员手动补发纯利豆',           createdAt: now - DAY *  3,
  },
  {
    id: 'bean-004', userId: 'u005', userName: '林晓燕', userPhone: '135****7701',
    amount: -500, type: 'withdraw', source: 'withdrawal', description: '提现扣除（申请 #WD-2024-005）', createdAt: now - DAY *  5,
  },
  {
    id: 'bean-005', userId: 'u003', userName: '王雅婷', userPhone: '156****8830',
    amount: -200, type: 'spend',  source: 'deduct_payment', description: '抵扣续费消耗',                createdAt: now - DAY *  7,
  },
  {
    id: 'bean-006', userId: 'u002', userName: '陈建国', userPhone: '139****5566',
    amount: 100, type: 'earn',   source: 'promo_reward',  description: '推广奖励（林晓燕 / 月度会员）', createdAt: now - DAY *  9,
    relatedUser: '林晓燕',
  },
  {
    id: 'bean-007', userId: 'u005', userName: '林晓燕', userPhone: '135****7701',
    amount: -100, type: 'spend',  source: 'admin_adjust',  description: '管理员手动扣减纯利豆',          createdAt: now - DAY * 12,
  },
  {
    id: 'bean-008', userId: 'u003', userName: '王雅婷', userPhone: '156****8830',
    amount: 100, type: 'earn',   source: 'promo_reward',  description: '推广奖励（张宇 / 月度会员）',   createdAt: now - DAY * 14,
    relatedUser: '张宇',
  },
];
