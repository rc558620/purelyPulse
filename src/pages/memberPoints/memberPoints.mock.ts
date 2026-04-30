// ─── 积分管理页 Mock 数据 ─────────────────────────────────────────────
import type { PointsRecord, UserSnapshot } from './memberPoints.types';

const now = Date.now();
const DAY = 86_400_000;

// ─── Mock 用户列表 ────────────────────────────────────────────────────
export const MOCK_USERS: UserSnapshot[] = [
  { id: 'u001', name: '刘梅',   phone: '138****9021', availablePoints: 1280, beanBalance: 0,    isPartner: false },
  { id: 'u002', name: '陈建国', phone: '139****5566', availablePoints: 540,  beanBalance: 3200, isPartner: true  },
  { id: 'u003', name: '王雅婷', phone: '156****8830', availablePoints: 2100, beanBalance: 1800, isPartner: true  },
  { id: 'u004', name: '周浩然', phone: '187****4412', availablePoints: 320,  beanBalance: 0,    isPartner: false },
  { id: 'u005', name: '林晓燕', phone: '135****7701', availablePoints: 880,  beanBalance: 600,  isPartner: true  },
  { id: 'u006', name: '张宇',   phone: '177****2233', availablePoints: 0,    beanBalance: 0,    isPartner: false },
];

// ─── Mock 积分记录 ─────────────────────────────────────────────────────
export const MOCK_POINTS_RECORDS: PointsRecord[] = [
  {
    id: 'pts-001', userId: 'u001', userName: '刘梅',   userPhone: '138****9021',
    amount: 300, type: 'earn',   source: 'admin_adjust',   description: '管理员手动补发积分',     createdAt: now - DAY *  2,
  },
  {
    id: 'pts-002', userId: 'u002', userName: '陈建国', userPhone: '139****5566',
    amount: 200, type: 'earn',   source: 'purchase_bonus', description: '购买季度会员奖励',       createdAt: now - DAY *  3,
  },
  {
    id: 'pts-003', userId: 'u003', userName: '王雅婷', userPhone: '156****8830',
    amount: -500, type: 'spend', source: 'deduct_payment',  description: '积分抵扣续费',          createdAt: now - DAY *  4,
  },
  {
    id: 'pts-004', userId: 'u001', userName: '刘梅',   userPhone: '138****9021',
    amount: 500, type: 'earn',   source: 'purchase_bonus', description: '购买年度会员奖励',       createdAt: now - DAY *  7,
  },
  {
    id: 'pts-005', userId: 'u004', userName: '周浩然', userPhone: '187****4412',
    amount: 100, type: 'earn',   source: 'admin_adjust',   description: '活动奖励积分',           createdAt: now - DAY * 10,
  },
  {
    id: 'pts-006', userId: 'u005', userName: '林晓燕', userPhone: '135****7701',
    amount: -200, type: 'spend', source: 'deduct_payment',  description: '积分抵扣充值费用',      createdAt: now - DAY * 12,
  },
  {
    id: 'pts-007', userId: 'u003', userName: '王雅婷', userPhone: '156****8830',
    amount: 800, type: 'earn',   source: 'purchase_bonus', description: '购买年度会员奖励',       createdAt: now - DAY * 15,
  },
  {
    id: 'pts-008', userId: 'u002', userName: '陈建国', userPhone: '139****5566',
    amount: -100, type: 'spend', source: 'admin_adjust',   description: '管理员手动扣减积分',     createdAt: now - DAY * 18,
  },
  {
    id: 'pts-009', userId: 'u006', userName: '张宇',   userPhone: '177****2233',
    amount: 150, type: 'earn',   source: 'admin_adjust',   description: '老会员回馈积分',         createdAt: now - DAY * 20,
  },
  {
    id: 'pts-010', userId: 'u005', userName: '林晓燕', userPhone: '135****7701',
    amount: -150, type: 'expire', source: 'expire',         description: '积分过期作废',           createdAt: now - DAY * 30,
    expireAt: now - DAY * 30,
  },
];
