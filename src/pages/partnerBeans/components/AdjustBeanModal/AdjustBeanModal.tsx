/**
 * AdjustBeanModal —— 纯利豆增减弹窗
 *
 * 功能：
 *  - 选择调整方向（增加 / 减少）
 *  - 输入调整数量
 *  - 填写调整原因（快捷预设 + 自定义）
 *  - 显示当前余额与操作后预览余额
 */
import React, { useCallback, useState } from 'react';
import OperationModalShell from '@components/overlay/OperationModalShell/OperationModalShell';
import type { AdjustDir, UserSnapshot } from '../../../memberPoints/memberPoints.types';
import styles from './AdjustBeanModal.module.less';

// ─── 图标 ─────────────────────────────────────────────────────────────

const IconBean: React.FC = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
    <path d="M12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z" />
    <path d="M8 12c0-2.21 1.79-4 4-4" />
    <path d="M16 12c0 2.21-1.79 4-4 4" />
  </svg>
);

const IconCheck: React.FC = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

// ─── Props ────────────────────────────────────────────────────────────

export interface AdjustBeanModalProps {
  user: UserSnapshot;
  onClose: () => void;
  onConfirm: (userId: string, delta: number, reason: string) => void;
}

// ─── 常量 ─────────────────────────────────────────────────────────────

const DIR_OPTIONS: { value: AdjustDir; label: string; sign: string; color: string }[] = [
  { value: 'add',      label: '增加纯利豆', sign: '+', color: '#f59e0b' },
  { value: 'subtract', label: '减少纯利豆', sign: '-', color: '#ef4444' },
];

const PRESET_AMOUNTS = [50, 100, 200, 500];

const REASON_PRESETS = [
  '管理员手动补发纯利豆',
  '活动奖励纯利豆',
  '合伙人回馈纯利豆',
  '管理员手动扣减纯利豆',
  '系统错误修正',
];

// ─── 组件 ─────────────────────────────────────────────────────────────

const AdjustBeanModal: React.FC<AdjustBeanModalProps> = ({ user, onClose, onConfirm }) => {
  const [dir, setDir]       = useState<AdjustDir>('add');
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');

  const parsedAmount = Math.max(0, parseInt(amount, 10) || 0);
  const delta        = dir === 'add' ? parsedAmount : -parsedAmount;
  const previewBalance = user.beanBalance + delta;
  const isValid = parsedAmount > 0 && reason.trim().length > 0;

  const handleConfirm = useCallback(() => {
    if (!isValid) return;
    onConfirm(user.id, delta, reason.trim());
  }, [isValid, user.id, delta, reason, onConfirm]);

  const handleAmountChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value.replace(/\D/g, '');
    setAmount(v);
  }, []);

  return (
    <OperationModalShell
      ariaLabel="调整用户纯利豆"
      icon={<IconBean />}
      title="调整纯利豆"
      confirmText="确认调整"
      confirmIcon={<IconCheck />}
      onClose={onClose}
      onConfirm={handleConfirm}
      variant="center"
      maxWidth="44rem"
    >
      <div className={styles.body}>

        {/* 用户信息 */}
        <div className={styles.userCard}>
          <div className={styles.userAvatar} aria-hidden="true">
            {user.name[0]}
          </div>
          <div className={styles.userInfo}>
            <div className={styles.userNameRow}>
              <span className={styles.userName}>{user.name}</span>
              <span className={styles.partnerBadge}>合伙人</span>
            </div>
            <span className={styles.userPhone}>{user.phone}</span>
          </div>
          <div className={styles.balanceBox}>
            <span className={styles.balanceVal}>{user.beanBalance.toLocaleString('zh-CN')}</span>
            <span className={styles.balanceLbl}>纯利豆</span>
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
                  '--dir-color': opt.color,
                  '--dir-color-bg': `${opt.color}18`,
                } as React.CSSProperties) : undefined}
                onClick={() => setDir(opt.value)}
                aria-pressed={dir === opt.value}
              >
                <span className={styles.dirSign} style={{ color: dir === opt.value ? opt.color : undefined }}>
                  {opt.sign}
                </span>
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* 数量输入 */}
        <div className={styles.field}>
          <label className={styles.fieldLabel} htmlFor="adjust-bean-amount">
            调整数量
          </label>
          <input
            id="adjust-bean-amount"
            className={styles.amountInput}
            type="text"
            inputMode="numeric"
            placeholder="输入纯利豆数量"
            value={amount}
            onChange={handleAmountChange}
            maxLength={6}
            aria-label="纯利豆调整数量"
          />
          {/* 快捷预设 */}
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

        {/* 调整原因 */}
        <div className={styles.field}>
          <label className={styles.fieldLabel} htmlFor="adjust-bean-reason">
            调整原因
          </label>
          <textarea
            id="adjust-bean-reason"
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

        {/* 操作后预览 */}
        {parsedAmount > 0 && (
          <div className={styles.previewCard}>
            <span className={styles.previewLabel}>操作后余额预览</span>
            <div className={styles.previewRow}>
              <span className={styles.previewOld}>{user.beanBalance.toLocaleString('zh-CN')}</span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" aria-hidden="true">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
              <span
                className={styles.previewNew}
                style={{ color: dir === 'add' ? '#f59e0b' : '#ef4444' }}
              >
                {Math.max(0, previewBalance).toLocaleString('zh-CN')}
              </span>
              <span className={styles.previewUnit}>纯利豆</span>
            </div>
          </div>
        )}

      </div>
    </OperationModalShell>
  );
};

export default AdjustBeanModal;
