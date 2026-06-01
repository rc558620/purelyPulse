// 子账号详情区块：平台侧只读视图，展示 purelyProfit 端配置的角色分配状态。
import React from 'react';
import { cx, safeNum } from '@utils/utils';
import {
  IconCashierRole,
  IconFinanceRole,
  IconManagerRole,
  IconSlotGrid,
  IconSubAccount,
  IconLock,
  IconCheck,
} from '@pages/memberDetail/components/MemberDetailIcons/MemberDetailIcons';
import type {
  SubAccountCapability,
  SubAccountRole,
  SubAccountRoleSummary,
  SubAccountStatus,
} from '@pages/memberList/memberList.types';
import styles from './MemberDetailSubAccountSection.module.less';

interface MemberDetailSubAccountSectionProps {
  /** 子账号能力快照；后端未返回时为 undefined，组件自行降级展示。 */
  capability: SubAccountCapability | undefined;
  /** 点击标题区按钮可跳转至配额设置弹窗（可选）。 */
  onEditQuota?: () => void;
  isSubmitting?: boolean;
}

// ─── 常量映射 ────────────────────────────────────────────────────────────────

const ROLE_LABEL: Record<SubAccountRole, string> = {
  cashier: '收银员',
  finance: '财务',
  manager: '店长',
};

const ROLE_COLOR: Record<SubAccountRole, string> = {
  cashier: 'roleColorCashier',
  finance: 'roleColorFinance',
  manager: 'roleColorManager',
};

const STATUS_LABEL: Record<SubAccountStatus, string> = {
  active: '正常',
  inactive: '未激活',
  disabled: '已禁用',
};

// ─── 子组件 ──────────────────────────────────────────────────────────────────

const RoleIcon: React.FC<{ role: SubAccountRole }> = ({ role }) => {
  if (role === 'finance') {
    return <IconFinanceRole width={12} height={12} strokeWidth={2.2} />;
  }
  if (role === 'manager') {
    return <IconManagerRole width={12} height={12} strokeWidth={2.2} />;
  }
  return <IconCashierRole width={12} height={12} strokeWidth={2.2} />;
};

interface SlotCardProps {
  item: SubAccountRoleSummary;
}

const SlotCard: React.FC<SlotCardProps> = ({ item }) => {
  const isActive = item.status === 'active' && item.isAssigned;
  const isDisabled = item.status === 'disabled';
  const roleColorClass = ROLE_COLOR[item.role];

  return (
    <div
      className={cx(
        styles.slotCard,
        isActive && styles.slotCardActive,
        isDisabled && styles.slotCardDisabled,
        !item.isAssigned && !isDisabled && styles.slotCardEmpty,
      )}
      aria-label={`槽位 ${safeNum(item.slot)}${item.isAssigned ? `，${ROLE_LABEL[item.role]}，${STATUS_LABEL[item.status]}` : '，未分配'}`}
    >
      {/* 槽位序号 */}
      <div className={styles.slotIndex}>{safeNum(item.slot)}</div>

      {item.isAssigned ? (
        <>
          {/* 角色图标与标签 */}
          <div className={cx(styles.roleChip, styles[roleColorClass])}>
            <RoleIcon role={item.role} />
            <span className={styles.roleChipLabel}>{ROLE_LABEL[item.role]}</span>
          </div>

          {/* 状态标记 */}
          <div className={cx(
            styles.slotStatus,
            isActive && styles.slotStatusActive,
            item.status === 'inactive' && styles.slotStatusInactive,
            isDisabled && styles.slotStatusDisabled,
          )}>
            {isActive ? (
              <span className={styles.slotStatusDot} />
            ) : null}
            {STATUS_LABEL[item.status]}
          </div>
        </>
      ) : (
        <div className={styles.slotEmpty}>
          <span className={styles.slotEmptyDash}>—</span>
          <span className={styles.slotEmptyLabel}>未分配</span>
        </div>
      )}
    </div>
  );
};

// ─── 使用统计迷你条 ──────────────────────────────────────────────────────────

interface UsageBarProps {
  used: number;
  total: number;
}

// 将使用率映射至 10 个离散百分比档位（0/10/20/.../100）
const PCT_STEPS = [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100] as const;
type PctStep = typeof PCT_STEPS[number];

function snapToPctStep(pct: number): PctStep {
  const clamped = Math.min(100, Math.max(0, pct));
  // 向上取整至最近档位，让视觉上进度不落后于实际
  const stepped = Math.ceil(clamped / 10) * 10;
  return (stepped > 100 ? 100 : stepped) as PctStep;
}

const UsageBar: React.FC<UsageBarProps> = ({ used, total }) => {
  const rawPct = total > 0 ? Math.round((used / total) * 100) : 0;
  const pct = rawPct;
  const isNearFull = pct >= 80;
  const isFull = pct >= 100;
  const stepClass = `usageBarFillPct${snapToPctStep(pct)}` as keyof typeof styles;

  return (
    <div className={styles.usageBar} aria-label={`已使用 ${used} / ${total} 个槽位`}>
      <div className={styles.usageBarTrack}>
        <div
          className={cx(
            styles.usageBarFill,
            styles[stepClass],
            isNearFull && !isFull && styles.usageBarFillWarn,
            isFull && styles.usageBarFillFull,
          )}
        />
      </div>
      <span className={cx(
        styles.usageBarText,
        isFull && styles.usageBarTextFull,
      )}>
        {safeNum(used)} / {safeNum(total)} 已用
      </span>
    </div>
  );
};

// ─── 主组件 ──────────────────────────────────────────────────────────────────

const MemberDetailSubAccountSection: React.FC<MemberDetailSubAccountSectionProps> = React.memo(({
  capability,
  onEditQuota,
  isSubmitting = false,
}) => {
  // ── capability 未返回（后端未下发子账号字段）——显示配置入口卡 ──
  if (!capability) {
    return (
      <div className={styles.root}>
        <div className={styles.disabledCard}>
          <div className={styles.disabledIcon} aria-hidden="true">
            <IconSubAccount width={20} height={20} strokeWidth={2} />
          </div>
          <div className={styles.disabledText}>
            <div className={styles.disabledTitle}>子账号角色分配</div>
            <div className={styles.disabledDesc}>
              点击「配置子账号」按钮设置配额后，商家即可在 purelyProfit 端分配员工角色，详情将在此展示。
            </div>
          </div>
          {onEditQuota ? (
            <button
              type="button"
              className={styles.disabledEditBtn}
              onClick={onEditQuota}
              disabled={isSubmitting}
              aria-label="前往配置子账号配额"
            >
              配置
            </button>
          ) : null}
        </div>
      </div>
    );
  }

  const {
    subAccountQuota,
    subAccountCapabilityEnabled,
    subAccountsUsedCount,
    subAccountsAvailableCount,
    subAccountRoleSummary,
  } = capability;

  const isEnabled = subAccountCapabilityEnabled && subAccountQuota > 0;
  const hasRoles = subAccountRoleSummary.length > 0;

  // 若子账号功能已关闭（quota=0 或未启用），渲染精简提示卡
  if (!isEnabled) {
    return (
      <div className={styles.root}>
        <div className={styles.disabledCard}>
          <div className={styles.disabledIcon} aria-hidden="true">
            <IconLock width={20} height={20} strokeWidth={2} />
          </div>
          <div className={styles.disabledText}>
            <div className={styles.disabledTitle}>子账号功能未开启</div>
            <div className={styles.disabledDesc}>
              当前门店尚未启用子账号，角色分配数据暂无。
              {onEditQuota ? '可点击右侧按钮配置子账号配额。' : ''}
            </div>
          </div>
          {onEditQuota ? (
            <button
              type="button"
              className={styles.disabledEditBtn}
              onClick={onEditQuota}
              disabled={isSubmitting}
              aria-label="前往配置子账号配额"
            >
              配置
            </button>
          ) : null}
        </div>
      </div>
    );
  }

  return (
    <div className={styles.root}>
      {/* ── 区块头部 ── */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.headerIcon} aria-hidden="true">
            <IconSubAccount width={15} height={15} strokeWidth={2.2} />
          </div>
          <div className={styles.headerTitle}>子账号角色分配</div>
          <div className={styles.headerBadge}>
            由 purelyProfit 配置
          </div>
        </div>
        {onEditQuota ? (
          <button
            type="button"
            className={styles.editQuotaBtn}
            onClick={onEditQuota}
            disabled={isSubmitting}
            aria-label="调整子账号配额"
          >
            <IconSlotGrid width={11} height={11} />
            调整配额
          </button>
        ) : null}
      </div>

      {/* ── 概览统计行 ── */}
      <div className={styles.statsRow}>
        <div className={styles.statItem}>
          <span className={styles.statValue}>{safeNum(subAccountQuota)}</span>
          <span className={styles.statLabel}>总配额</span>
        </div>
        <div className={styles.statDivider} aria-hidden="true" />
        <div className={styles.statItem}>
          <span className={cx(styles.statValue, styles.statValueUsed)}>{safeNum(subAccountsUsedCount)}</span>
          <span className={styles.statLabel}>已分配</span>
        </div>
        <div className={styles.statDivider} aria-hidden="true" />
        <div className={styles.statItem}>
          <span className={cx(
            styles.statValue,
            subAccountsAvailableCount === 0 ? styles.statValueFull : styles.statValueAvail,
          )}>
            {safeNum(subAccountsAvailableCount)}
          </span>
          <span className={styles.statLabel}>剩余</span>
        </div>

        {/* 使用率条 */}
        <div className={styles.statUsageWrap}>
          <UsageBar used={subAccountsUsedCount} total={subAccountQuota} />
        </div>
      </div>

      {/* ── 槽位列表 ── */}
      {hasRoles ? (
        <div className={styles.slotGrid} role="list" aria-label="子账号槽位列表">
          {subAccountRoleSummary.map((item) => (
            <SlotCard key={item.slot} item={item} />
          ))}
        </div>
      ) : (
        /* 有配额但商家尚未在 Profit 端分配任何角色 */
        <div className={styles.noRolesHint}>
          <div className={styles.noRolesIcon} aria-hidden="true">
            <IconSlotGrid width={28} height={28} strokeWidth={1.8} />
          </div>
          <div className={styles.noRolesTitle}>暂无角色分配记录</div>
          <div className={styles.noRolesDesc}>
            商家可在 <strong>purelyProfit</strong> 端为子账号槽位分配员工与角色
          </div>
        </div>
      )}

      {/* ── 角色图例 ── */}
      {hasRoles ? (
        <div className={styles.legend} aria-label="角色图例">
          {(Object.entries(ROLE_LABEL) as [SubAccountRole, string][]).map(([role, label]) => (
            <div key={role} className={styles.legendItem}>
              <div className={cx(styles.legendDot, styles[ROLE_COLOR[role]])} aria-hidden="true" />
              <span className={styles.legendLabel}>{label}</span>
            </div>
          ))}
          <div className={styles.legendItem}>
            <div className={cx(styles.legendDot, styles.legendDotActive)} aria-hidden="true">
              <IconCheck width={7} height={7} strokeWidth={3} />
            </div>
            <span className={styles.legendLabel}>正常运行</span>
          </div>
        </div>
      ) : null}
    </div>
  );
});

MemberDetailSubAccountSection.displayName = 'MemberDetailSubAccountSection';

export default MemberDetailSubAccountSection;
