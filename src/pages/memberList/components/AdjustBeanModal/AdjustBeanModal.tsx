/**
 * AdjustBeanModal —— 会员纯利豆增减弹窗（详情页专用）
 *
 * 功能：
 *  - 选择调整方向（增加 / 减少）
 *  - 快捷预设数量 + 自定义输入
 *  - 快捷原因预设 + 自定义填写（原因必填）
 *  - 实时预览操作后余额
 */
import React, { useCallback, useEffect, useState } from 'react';
import type { AdjustDir } from '../../../memberPoints/memberPoints.types';
import type { MemberDetail } from '../../memberList.types';
import { AVATAR_COLORS } from '../../memberList.mock';
import styles from './AdjustBeanModal.module.less';

// ─── Props ───────────────────────────────────────────────────────
export interface AdjustBeanModalProps {
  member: MemberDetail;
  currentBeans: number;
  onClose: () => void;
  onConfirm: (delta: number, reason: string) => void;
}

// ─── 常量 ────────────────────────────────────────────────────────
const DIR_OPTIONS: { value: AdjustDir; label: string; sign: string; color: string }[] = [
  { value: 'add',      label: '增加纯利豆', sign: '+', color: '#f59e0b' },
  { value: 'subtract', label: '减少纯利豆', sign: '-', color: '#ef4444' },
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

// ─── 组件 ────────────────────────────────────────────────────────
const AdjustBeanModal: React.FC<AdjustBeanModalProps> = ({
  member,
  currentBeans,
  onClose,
  onConfirm,
}) => {
  const [dir,    setDir]    = useState<AdjustDir>('add');
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');

  const parsedAmount   = Math.max(0, parseInt(amount, 10) || 0);
  const delta          = dir === 'add' ? parsedAmount : -parsedAmount;
  const previewBalance = Math.max(0, currentBeans + delta);
  const isValid        = parsedAmount > 0 && reason.trim().length > 0;

  // ESC 关闭
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const handleConfirm = useCallback(() => {
    if (!isValid) return;
    onConfirm(delta, reason.trim());
    onClose();
  }, [isValid, delta, reason, onConfirm, onClose]);

  const handleAmountChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setAmount(e.target.value.replace(/\D/g, ''));
  }, []);

  const avatarBg   = AVATAR_COLORS[member.avatarColorIdx % AVATAR_COLORS.length];
  const currentDir = DIR_OPTIONS.find(d => d.value === dir)!;

  return (
    <div
      className={styles.overlay}
      role="dialog"
      aria-modal="true"
      aria-label="调整会员纯利豆"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className={styles.sheet}>

        {/* ── 拖拽指示条 */}
        <div className={styles.dragHandle} aria-hidden="true" />

        {/* ── 标题行 */}
        <div className={styles.sheetHeader}>
          <div className={styles.sheetTitleWrap}>
            <div className={styles.sheetTitleIcon} aria-hidden="true">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <path d="M12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z" />
                <path d="M8 12c0-2.21 1.79-4 4-4" />
                <path d="M16 12c0 2.21-1.79 4-4 4" />
              </svg>
            </div>
            <span className={styles.sheetTitle}>调整纯利豆</span>
          </div>
          <button type="button" className={styles.closeBtn} onClick={onClose} aria-label="关闭">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* ── 可滚动内容区 */}
        <div className={styles.sheetBody}>

          {/* 会员信息卡 */}
          <div className={styles.userCard}>
            <div
              className={styles.userAvatar}
              style={{ background: avatarBg }}
              aria-hidden="true"
            >
              {member.avatarChar}
            </div>
            <div className={styles.userInfo}>
              <div className={styles.userNameRow}>
                <span className={styles.userName}>{member.name}</span>
                {member.isPartner && (
                  <span className={styles.partnerBadge}>{member.partnerLevel || '合伙人'}</span>
                )}
              </div>
              <span className={styles.userPhone}>{member.phone}</span>
            </div>
            <div className={styles.balanceBox}>
              <span className={styles.balanceVal}>{currentBeans.toLocaleString('zh-CN')}</span>
              <span className={styles.balanceLbl}>纯利豆余额</span>
            </div>
          </div>

          {/* 方向选择 */}
          <div className={styles.field}>
            <label className={styles.fieldLabel}>调整方向</label>
            <div className={styles.dirRow}>
              {DIR_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  className={`${styles.dirBtn} ${dir === opt.value ? styles.dirBtnActive : ''}`}
                  style={dir === opt.value ? ({
                    '--dir-color':    opt.color,
                    '--dir-color-bg': `${opt.color}18`,
                  } as React.CSSProperties) : undefined}
                  onClick={() => setDir(opt.value)}
                  aria-pressed={dir === opt.value}
                >
                  <span
                    className={styles.dirSign}
                    style={{ color: dir === opt.value ? opt.color : undefined }}
                  >
                    {opt.sign}
                  </span>
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* 数量输入 + 快捷预设 */}
          <div className={styles.field}>
            <label className={styles.fieldLabel} htmlFor="detail-adjust-bean-amount">
              调整数量
            </label>
            <input
              id="detail-adjust-bean-amount"
              className={styles.amountInput}
              type="text"
              inputMode="numeric"
              placeholder="输入纯利豆数量"
              value={amount}
              onChange={handleAmountChange}
              maxLength={6}
              aria-label="纯利豆调整数量"
            />
            <div className={styles.presetRow}>
              {PRESET_AMOUNTS.map(v => (
                <button
                  key={v}
                  type="button"
                  className={`${styles.presetBtn} ${amount === String(v) ? styles.presetBtnActive : ''}`}
                  onClick={() => setAmount(String(v))}
                >
                  {v}
                </button>
              ))}
            </div>
          </div>

          {/* 调整原因 + 快捷预设 */}
          <div className={styles.field}>
            <label className={styles.fieldLabel} htmlFor="detail-adjust-bean-reason">
              调整原因
              <span className={styles.requiredMark} aria-hidden="true">*</span>
            </label>
            <textarea
              id="detail-adjust-bean-reason"
              className={styles.reasonInput}
              placeholder="请输入调整原因..."
              value={reason}
              onChange={e => setReason(e.target.value)}
              maxLength={100}
              rows={2}
              aria-label="纯利豆调整原因"
            />
            <div className={styles.reasonPresets}>
              {REASON_PRESETS.map(r => (
                <button
                  key={r}
                  type="button"
                  className={`${styles.reasonPresetBtn} ${reason === r ? styles.reasonPresetBtnActive : ''}`}
                  onClick={() => setReason(r)}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          {/* 操作后余额预览 */}
          {parsedAmount > 0 && (
            <div className={styles.previewCard}>
              <span className={styles.previewLabel}>操作后余额预览</span>
              <div className={styles.previewRow}>
                <span className={styles.previewOld}>
                  {currentBeans.toLocaleString('zh-CN')}
                </span>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" aria-hidden="true">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
                <span className={styles.previewNew} style={{ color: currentDir.color }}>
                  {previewBalance.toLocaleString('zh-CN')}
                </span>
                <span className={styles.previewUnit}>纯利豆</span>
              </div>
              <div className={styles.previewDelta} style={{ color: currentDir.color, borderColor: `${currentDir.color}30` }}>
                {dir === 'add' ? '+' : '-'}{parsedAmount}
              </div>
            </div>
          )}

          {/* 未填原因时的提示 */}
          {parsedAmount > 0 && reason.trim().length === 0 && (
            <p className={styles.validationHint}>请填写调整原因后再确认</p>
          )}

        </div>

        {/* ── 底部操作按钮 */}
        <div className={styles.sheetActions}>
          <button type="button" className={styles.cancelBtn} onClick={onClose}>
            取消
          </button>
          <button
            type="button"
            className={`${styles.confirmBtn} ${dir === 'subtract' ? styles.confirmBtnDanger : ''}`}
            onClick={handleConfirm}
            disabled={!isValid}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
              <polyline points="20 6 9 17 4 12" />
            </svg>
            确认{dir === 'add' ? '增加' : '减少'}{parsedAmount > 0 ? ` ${parsedAmount} ` : ' '}纯利豆
          </button>
        </div>

      </div>
    </div>
  );
};

export default AdjustBeanModal;
