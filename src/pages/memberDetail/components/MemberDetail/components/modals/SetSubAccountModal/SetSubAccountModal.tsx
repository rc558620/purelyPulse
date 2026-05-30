/**
 * SetSubAccountModal —— 子账号配置弹窗（平台侧）
 *
 * 功能：
 *  - 仅对年会员/永久会员开放 1~7 个子账号配额
 *  - 免费/月/季会员只能为 0，接口亦会拦截
 *  - 可为每个子账号槽位分配角色：cashier（收银员）/ finance（财务）
 *  - 展示各角色可见的首页模块说明
 *  - 提交时带完整 quota + roleSummary 配置
 */
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { cx, isNonEmptyArray, safeNum, safeStr } from '@utils/utils';
import {
  IconCashierRole,
  IconCheck,
  IconClose,
  IconEye,
  IconEyeOff,
  IconFinanceRole,
  IconInfoCircle,
  IconLock,
  IconSlotGrid,
  IconSubAccount,
  IconWarningTriangle,
} from '@pages/memberDetail/components/MemberDetailIcons/MemberDetailIcons';
import { LEVEL_LABEL } from '@pages/memberList/memberList.constants';
import type {
  MemberDetail,
  MemberLevel,
  SubAccountCapability,
  SubAccountRole,
  SubAccountRoleSummary,
} from '@pages/memberList/memberList.types';
import styles from './SetSubAccountModal.module.less';

export interface SetSubAccountModalProps {
  member: MemberDetail;
  currentLevel: MemberLevel;
  currentCapability: SubAccountCapability | undefined;
  isSubmitting: boolean;
  onClose: () => void;
  onConfirm: (quota: number, roleSummary: SubAccountRoleSummary[]) => Promise<void> | void;
}

// 有资格的等级（后端校验，前端同步呈现）
const ELIGIBLE_LEVELS: MemberLevel[] = ['annual', 'lifetime'];
// 子账号角色配置
const ROLE_OPTIONS: { value: SubAccountRole; label: string; shortLabel: string; color: string }[] = [
  { value: 'cashier', label: '收银员', shortLabel: '收银', color: '#059669' },
  { value: 'finance', label: '财务', shortLabel: '财务', color: '#2563eb' },
];
const QUOTA_MAX = 7;
const QUOTA_OPTIONS = Array.from({ length: QUOTA_MAX + 1 }, (_, idx) => idx);

// 各角色对应首页模块可见范围（用于界面说明）
const CASHIER_VISIBLE_MODULES = ['additional（附加收入）', 'space-management（空间管理）', 'handover-management（交班管理）'];
const FINANCE_HIDDEN_MODULES = ['member-center（会员中心）', 'marketing-center（营销中心）', 'handover-management（交班管理）', 'store-settings（门店设置）'];

function getAvatarColorClass(colorIdx: number, moduleStyles: Record<string, string>): string {
  return moduleStyles[`avatarColor_${colorIdx % 6}`] ?? '';
}

function buildInitialRoleSummary(
  quota: number,
  existing: SubAccountRoleSummary[] | undefined,
): SubAccountRoleSummary[] {
  return Array.from({ length: quota }, (_, idx) => {
    const slot = idx + 1;
    const found = existing?.find((item) => item.slot === slot);
    // 已有记录保留 role/status/isAssigned/username，密码每次开弹窗从空白开始，避免回填明文
    return found
      ? { slot, role: found.role, status: found.status, isAssigned: found.isAssigned, username: found.username ?? '', password: '' }
      : { slot, role: 'cashier' as SubAccountRole, status: 'active' as const, isAssigned: false, username: '', password: '' };
  });
}

/** 简单密码强度判断。 */
function getPasswordStrength(pwd: string): 'empty' | 'weak' | 'medium' | 'strong' {
  if (!pwd) return 'empty';
  if (pwd.length < 6) return 'weak';
  const hasLetter = /[a-zA-Z]/.test(pwd);
  const hasNumber = /\d/.test(pwd);
  const hasSymbol = /[^a-zA-Z\d]/.test(pwd);
  const conditionsMet = [hasLetter, hasNumber, hasSymbol].filter(Boolean).length;
  if (conditionsMet >= 2 && pwd.length >= 8) return 'strong';
  return 'medium';
}

const SetSubAccountModal: React.FC<SetSubAccountModalProps> = ({
  member,
  currentLevel,
  currentCapability,
  isSubmitting,
  onClose,
  onConfirm,
}) => {
  const isEligible = ELIGIBLE_LEVELS.includes(currentLevel);
  const initialQuota = isEligible ? (currentCapability?.subAccountQuota ?? 0) : 0;

  const [selectedQuota, setSelectedQuota] = useState<number>(initialQuota);
  const [roleSummary, setRoleSummary] = useState<SubAccountRoleSummary[]>(() =>
    buildInitialRoleSummary(initialQuota, currentCapability?.subAccountRoleSummary),
  );

  // 当 quota 变化时，同步调整 roleSummary 长度
  useEffect(() => {
    setRoleSummary((prev) => buildInitialRoleSummary(selectedQuota, prev));
  }, [selectedQuota]);

  // Escape 关闭
  useEffect(() => {
    const handler = (event: KeyboardEvent): void => {
      if (event.key === 'Escape' && !isSubmitting) {
        onClose();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isSubmitting, onClose]);

  const handleQuotaSelect = useCallback((quota: number): void => {
    if (!isEligible && quota > 0) {
      return;
    }
    setSelectedQuota(quota);
  }, [isEligible]);

  const handleRoleChange = useCallback((slot: number, role: SubAccountRole): void => {
    setRoleSummary((prev) => prev.map((item) =>
      item.slot === slot ? { ...item, role } : item,
    ));
  }, []);

  const handleUsernameChange = useCallback((slot: number, username: string): void => {
    setRoleSummary((prev) => prev.map((item) =>
      item.slot === slot ? { ...item, username } : item,
    ));
  }, []);

  const handlePasswordChange = useCallback((slot: number, password: string): void => {
    setRoleSummary((prev) => prev.map((item) =>
      item.slot === slot ? { ...item, password } : item,
    ));
  }, []);

  // 记录各槽位密码是否显示明文
  const [visibleSlots, setVisibleSlots] = useState<Set<number>>(new Set());
  const togglePasswordVisible = useCallback((slot: number): void => {
    setVisibleSlots((prev) => {
      const next = new Set(prev);
      if (next.has(slot)) {
        next.delete(slot);
      } else {
        next.add(slot);
      }
      return next;
    });
  }, []);

  // 提交前过滤空值字段
  const buildSubmitRoleSummary = useCallback((): SubAccountRoleSummary[] => (
    roleSummary.map((item) => ({
      ...item,
      username: item.username?.trim() || undefined,
      password: item.password?.trim() || undefined,
    }))
  ), [roleSummary]);

  const handleConfirm = useCallback(async (): Promise<void> => {
    if (isSubmitting) {
      return;
    }
    await Promise.resolve(onConfirm(selectedQuota, buildSubmitRoleSummary()));
  }, [buildSubmitRoleSummary, isSubmitting, onConfirm, selectedQuota]);

  const levelBadgeClass = useMemo(() => {
    if (currentLevel === 'annual') {
      return styles.levelBadgeAnnual;
    }
    if (currentLevel === 'lifetime') {
      return styles.levelBadgeLifetime;
    }
    return styles.levelBadgeOther;
  }, [currentLevel]);

  const quotaChanged = selectedQuota !== initialQuota;
  const isZeroSelected = selectedQuota === 0;

  return (
    <div
      className={styles.overlay}
      role="dialog"
      aria-modal="true"
      aria-label="配置子账号"
      onClick={(event) => {
        if (!isSubmitting && event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div className={styles.sheet}>
        <div className={styles.dragHandle} aria-hidden="true" />

        {/* 标题行 */}
        <div className={styles.sheetHeader}>
          <div className={styles.sheetTitleWrap}>
            <div className={styles.sheetTitleIcon} aria-hidden="true">
              <IconSubAccount width={16} height={16} strokeWidth={2.2} />
            </div>
            <span className={styles.sheetTitle}>子账号配置</span>
          </div>
          <button
            type="button"
            className={styles.closeBtn}
            onClick={onClose}
            aria-label="关闭"
            disabled={isSubmitting}
          >
            <IconClose />
          </button>
        </div>

        {/* 可滚动内容区 */}
        <div className={styles.sheetBody}>
          {/* 会员信息摘要卡 */}
          <div className={styles.memberCard}>
            <div
              className={cx(styles.memberAvatar, getAvatarColorClass(member.avatarColorIdx, styles))}
              aria-hidden="true"
            >
              {safeStr(member.avatarChar, '会')}
            </div>
            <div className={styles.memberInfo}>
              <div className={styles.memberNameRow}>
                <span className={styles.memberName}>{safeStr(member.name, '未命名会员')}</span>
                <span className={cx(styles.memberLevelBadge, levelBadgeClass)}>
                  {LEVEL_LABEL[currentLevel]}
                </span>
              </div>
              <div className={styles.memberPhone}>{safeStr(member.phone, '--')}</div>
            </div>
            <div className={cx(
              styles.memberQuotaTag,
              initialQuota > 0 ? styles.memberQuotaTagActive : styles.memberQuotaTagNone,
            )}>
              <IconSlotGrid width={11} height={11} />
              {initialQuota > 0 ? `${initialQuota} 个子账号` : '未开通'}
            </div>
          </div>

          {/* 无资格提示 */}
          {!isEligible ? (
            <div className={styles.ineligibleBanner} role="alert">
              <div className={styles.ineligibleBannerIcon}>
                <IconLock width={17} height={17} strokeWidth={2.2} />
              </div>
              <div className={styles.ineligibleBannerText}>
                <div className={styles.ineligibleBannerTitle}>当前等级不支持子账号能力</div>
                <div className={styles.ineligibleBannerDesc}>
                  只有<strong>年会员</strong>或<strong>永久会员</strong>才能开通子账号功能。
                  如需使用，请先将该商家升级至对应等级。
                </div>
              </div>
            </div>
          ) : null}

          {/* 额度选择 */}
          <div className={styles.quotaSelector}>
            <div className={styles.sectionLabel}>
              <IconSlotGrid width={14} height={14} />
              子账号数量
              <span className={styles.sectionLabelSub}>
                {isEligible ? '可选 0~7 个' : '需年/永久会员'}
              </span>
            </div>
            <div className={styles.quotaGrid} role="group" aria-label="选择子账号数量">
              {QUOTA_OPTIONS.map((quota) => {
                const isDisabled = !isEligible && quota > 0;
                const isSelected = selectedQuota === quota;
                const isZero = quota === 0;

                return (
                  <button
                    key={quota}
                    type="button"
                    className={cx(
                      styles.quotaItem,
                      isZero && styles.quotaItemZero,
                      isSelected && styles.quotaItemSelected,
                      isDisabled && styles.quotaItemDisabled,
                    )}
                    onClick={() => handleQuotaSelect(quota)}
                    disabled={isDisabled}
                    aria-pressed={isSelected}
                    aria-label={quota === 0 ? '关闭子账号' : `${quota} 个子账号`}
                  >
                    {isZero ? (
                      <span className={cx(styles.quotaItemLabel, styles.quotaItemLabelClose)}>关闭</span>
                    ) : (
                      <>
                        <span className={styles.quotaItemNumber}>{safeNum(quota)}</span>
                        <span className={styles.quotaItemLabel}>个</span>
                      </>
                    )}
                    {isSelected ? (
                      <span className={cx(styles.quotaItemCheck, isZero && styles.quotaItemCheckZero)} aria-hidden="true">
                        <IconCheck width={9} height={9} strokeWidth={3} />
                      </span>
                    ) : null}
                  </button>
                );
              })}
            </div>

            {/* 额度提示 */}
            <p className={cx(
              styles.quotaHint,
              !isZeroSelected && isEligible && styles.quotaHintActive,
              isZeroSelected && styles.quotaHintWarning,
            )}>
              {isZeroSelected
                ? '当前设置为关闭子账号，员工将只能使用主账号完成交班'
                : isEligible
                  ? `已选 ${selectedQuota} 个子账号槽位，可为不同员工分配不同角色`
                  : '请先升级至年会员或永久会员以开通子账号'
              }
            </p>
          </div>

          {/* 角色分配区（quota > 0 时展示）*/}
          {selectedQuota > 0 ? (
            <div className={styles.roleConfigSection}>
              <div className={styles.sectionLabel}>
                <IconSubAccount width={14} height={14} />
                角色分配
                <span className={styles.sectionLabelSub}>为每个子账号槽位选择角色</span>
              </div>
              <div className={styles.slotList}>
                {roleSummary.map((slot) => (
                  <div
                    key={slot.slot}
                    className={cx(styles.slotRow, styles.slotRowActive)}
                  >
                    {/* 上行：序号 + 角色选择 */}
                    <div className={styles.slotTopRow}>
                      <div className={styles.slotBadge} aria-hidden="true">
                        {slot.slot}
                      </div>
                      <span className={styles.slotLabel}>子账号 #{slot.slot}</span>
                      <div className={styles.rolePicker} role="group" aria-label={`子账号 ${slot.slot} 角色`}>
                        {ROLE_OPTIONS.map((roleOption) => (
                          <button
                            key={roleOption.value}
                            type="button"
                            className={cx(
                              styles.roleBtn,
                              roleOption.value === 'cashier' ? styles.roleBtnCashier : styles.roleBtnFinance,
                              slot.role === roleOption.value && styles.roleBtnActive,
                            )}
                            onClick={() => handleRoleChange(slot.slot, roleOption.value)}
                            aria-pressed={slot.role === roleOption.value}
                          >
                            {roleOption.value === 'cashier'
                              ? <IconCashierRole width={11} height={11} strokeWidth={2.2} />
                              : <IconFinanceRole width={11} height={11} strokeWidth={2.2} />
                            }
                            {roleOption.shortLabel}
                          </button>
                        ))}
                      </div>
                    </div>
                    {/* 账号 + 密码设置行 */}
                    <div className={styles.credentialsRow}>
                      {/* 账号 */}
                      <div className={styles.credentialWrap}>
                        <span className={styles.passwordLabel}>
                          <IconSubAccount width={10} height={10} strokeWidth={2.2} />
                          登录账号
                        </span>
                        <div className={styles.passwordInputRow}>
                          <input
                            className={styles.passwordInput}
                            type="text"
                            value={slot.username ?? ''}
                            placeholder={slot.isAssigned ? '留空则保持原账号不变' : '设置登录账号（可选）'}
                            autoComplete="username"
                            maxLength={32}
                            onChange={(event) => handleUsernameChange(slot.slot, event.target.value)}
                            aria-label={`子账号 ${slot.slot} 登录账号`}
                          />
                        </div>
                      </div>
                      {/* 密码 */}
                      <div className={styles.credentialWrap}>
                        <span className={styles.passwordLabel}>
                          <IconLock width={10} height={10} strokeWidth={2.2} />
                          登录密码
                        </span>
                        <div className={styles.passwordInputRow}>
                          <input
                            className={styles.passwordInput}
                            type={visibleSlots.has(slot.slot) ? 'text' : 'password'}
                            value={slot.password ?? ''}
                            placeholder={slot.isAssigned ? '留空则保持原密码不变' : '设置登录密码（可选）'}
                            autoComplete="new-password"
                            maxLength={32}
                            onChange={(event) => handlePasswordChange(slot.slot, event.target.value)}
                            aria-label={`子账号 ${slot.slot} 登录密码`}
                          />
                          <button
                            type="button"
                            className={styles.passwordToggleBtn}
                            onClick={() => togglePasswordVisible(slot.slot)}
                            aria-label={visibleSlots.has(slot.slot) ? '隐藏密码' : '显示密码'}
                            tabIndex={-1}
                          >
                            {visibleSlots.has(slot.slot)
                              ? <IconEyeOff width={14} height={14} strokeWidth={2} />
                              : <IconEye width={14} height={14} strokeWidth={2} />}
                          </button>
                        </div>
                        {(slot.password?.length ?? 0) > 0 ? (
                          <span className={cx(
                            styles.passwordStrengthHint,
                            getPasswordStrength(slot.password ?? '') === 'weak' && styles.passwordStrengthWeak,
                            getPasswordStrength(slot.password ?? '') === 'medium' && styles.passwordStrengthMedium,
                            getPasswordStrength(slot.password ?? '') === 'strong' && styles.passwordStrengthStrong,
                          )}>
                            {getPasswordStrength(slot.password ?? '') === 'weak' && '密码强度：弱（建议至少 6 位）'}
                            {getPasswordStrength(slot.password ?? '') === 'medium' && '密码强度：中'}
                            {getPasswordStrength(slot.password ?? '') === 'strong' && '密码强度：强 ✓'}
                          </span>
                        ) : null}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* 角色权限说明 */}
              <div className={styles.roleDescRow}>
                  <div className={cx(styles.roleDescCard, styles.roleDescCardCashier)}>
                  <div className={styles.roleDescHeader}>
                    <IconCashierRole width={12} height={12} strokeWidth={2.2} className={styles.roleDescIconCashier} />
                    <span className={cx(styles.roleDescTitle, styles.roleDescTitleCashier)}>收银员</span>
                  </div>
                  <div className={styles.roleDescBody}>
                    <p>首页仅显示：</p>
                    {isNonEmptyArray(CASHIER_VISIBLE_MODULES) ? (
                      <ul className={styles.roleDescList}>
                        {CASHIER_VISIBLE_MODULES.map((mod) => (
                          <li key={mod}>{mod}</li>
                        ))}
                      </ul>
                    ) : null}
                  </div>
                </div>
                <div className={cx(styles.roleDescCard, styles.roleDescCardFinance)}>
                  <div className={styles.roleDescHeader}>
                    <IconFinanceRole width={12} height={12} strokeWidth={2.2} className={styles.roleDescIconFinance} />
                    <span className={cx(styles.roleDescTitle, styles.roleDescTitleFinance)}>财务</span>
                  </div>
                  <div className={styles.roleDescBody}>
                    <p>首页隐藏：</p>
                    {isNonEmptyArray(FINANCE_HIDDEN_MODULES) ? (
                      <ul className={styles.roleDescList}>
                        {FINANCE_HIDDEN_MODULES.map((mod) => (
                          <li key={mod}>{mod}</li>
                        ))}
                      </ul>
                    ) : null}
                  </div>
                </div>
              </div>
            </div>
          ) : null}

          {/* 权益说明卡 */}
          <div className={styles.capabilityCard}>
            <div className={styles.capabilityTitle}>
              <IconInfoCircle width={14} height={14} />
              子账号能力说明
            </div>
            <ul className={styles.capabilityList}>
              {[
                { text: <>子账号额度由平台设置，<strong>1~7</strong> 个，仅限年/永久会员使用</>, warn: false },
                { text: <>任何子账号均<strong>不能访问门店设置</strong>，后端接口同步拦截</>, warn: true },
                { text: <><strong>收银员</strong>视角只可访问附加收入、空间管理、交班管理</>, warn: false },
                { text: <><strong>财务</strong>视角可访问大部分模块，但不含会员中心、营销中心、交班管理、门店设置</>, warn: false },
                { text: <>设置为 0 时关闭子账号能力，员工将使用主账号自交班（兼容模式）</>, warn: false },
              ].map((item, idx) => (
                // eslint-disable-next-line react/no-array-index-key -- 静态列表
                <li key={idx} className={styles.capabilityItem}>
                  <span className={cx(styles.capabilityItemDot, item.warn && styles.capabilityItemDotWarning)} aria-hidden="true" />
                  <span className={styles.capabilityItemText}>{item.text}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* 变更提醒 */}
          {quotaChanged ? (
            <div
              className={cx(styles.ineligibleBanner, styles.ineligibleBannerInfo)}
              role="status"
            >
              <div className={cx(styles.ineligibleBannerIcon, styles.ineligibleBannerIconInfo)}>
                <IconWarningTriangle width={17} height={17} strokeWidth={2} />
              </div>
              <div className={styles.ineligibleBannerText}>
                <div className={cx(styles.ineligibleBannerTitle, styles.ineligibleBannerTitleInfo)}>配额将从 {safeNum(initialQuota)} 变更为 {safeNum(selectedQuota)}</div>
                <div className={styles.ineligibleBannerDesc}>
                  {selectedQuota < initialQuota && initialQuota > 0
                    ? '缩减额度后，超出部分的子账号槽位将被禁用，已分配的员工将无法继续使用子账号登录。'
                    : selectedQuota === 0
                      ? '关闭后所有子账号将立即失效，员工将只能使用主账号登录。'
                      : '新增额度后可立即为新槽位分配员工。'
                  }
                </div>
              </div>
            </div>
          ) : null}
        </div>

        {/* 底部操作栏 */}
        <div className={styles.sheetActions}>
          <button
            type="button"
            className={styles.cancelBtn}
            onClick={onClose}
            disabled={isSubmitting}
          >
            取消
          </button>
          <button
            type="button"
            className={styles.confirmBtn}
            onClick={handleConfirm}
            disabled={isSubmitting || !isEligible && selectedQuota > 0}
          >
            {isSubmitting ? '保存中...' : '保存配置'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SetSubAccountModal;
