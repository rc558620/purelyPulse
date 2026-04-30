/**
 * AdjustPointsModal —— 积分增减弹窗
 *
 * 功能：
 *  - 选择调整方向（增加 / 减少）
 *  - 输入调整数量
 *  - 填写调整原因
 *  - 显示当前余额与操作后预览余额
 */
import React, { useCallback, useState } from 'react';
import OperationModalShell from '@components/overlay/OperationModalShell/OperationModalShell';
import type { AdjustDir, UserSnapshot } from '../../memberPoints.types';
import styles from './AdjustPointsModal.module.less';

// ─── 图标 ─────────────────────────────────────────────────────────────

const IconPoints: React.FC = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
    <circle cx="12" cy="12" r="10" />
    <path d="M8 12h8M12 8v8" />
  </svg>
);

const IconCheck: React.FC = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

// ─── Props ────────────────────────────────────────────────────────────

export interface AdjustPointsModalProps {
  user: UserSnapshot;
  onClose: () => void;
  onConfirm: (userId: string, delta: number, reason: string) => void;
}

// ─── 常量 ─────────────────────────────────────────────────────────────

const DIR_OPTIONS: { value: AdjustDir; label: string; sign: string; color: string }[] = [
  { value: 'add',      label: '增加积分', sign: '+', color: '#84cc16' },
  { value: 'subtract', label: '减少积分', sign: '-', color: '#f97316' },
];

const PRESET_AMOUNTS = [50, 100, 200, 500];

const REASON_PRESETS = [
  '活动奖励积分',
  '老会员回馈积分',
  '补偿用户积分',
  '管理员手动扣减',
  '系统错误修正',
];

// ─── 组件 ─────────────────────────────────────────────────────────────

const AdjustPointsModal: React.FC<AdjustPointsModalProps> = ({ user, onClose, onConfirm }) => {
  const [dir, setDir]       = useState<AdjustDir>('add');
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');

  const parsedAmount = Math.max(0, parseInt(amount, 10) || 0);
  const delta        = dir === 'add' ? parsedAmount : -parsedAmount;
  const previewBalance = user.availablePoints + delta;
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
      ariaLabel="调整用户积分"
      icon={<IconPoints />}
      title="调整积分"
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
            <span className={styles.userName}>{user.name}</span>
            <span className={styles.userPhone}>{user.phone}</span>
          </div>
          <div className={styles.balanceBox}>
            <span className={styles.balanceVal}>{user.availablePoints.toLocaleString('zh-CN')}</span>
            <span className={styles.balanceLbl}>当前积分</span>
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
                  '--dir-color-bg': `${opt.color}15`,
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
          <label className={styles.fieldLabel} htmlFor="adjust-points-amount">
            调整数量
          </label>
          <div className={styles.amountRow}>
            <input
              id="adjust-points-amount"
              className={styles.amountInput}
              type="text"
              inputMode="numeric"
              placeholder="输入积分数量"
              value={amount}
              onChange={handleAmountChange}
              maxLength={6}
              aria-label="积分调整数量"
            />
          </div>
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
          <label className={styles.fieldLabel} htmlFor="adjust-points-reason">
            调整原因
          </label>
          <textarea
            id="adjust-points-reason"
            className={styles.reasonInput}
            placeholder="请输入调整原因..."
            value={reason}
            onChange={e => setReason(e.target.value)}
            maxLength={100}
            rows={2}
            aria-label="积分调整原因"
          />
          {/* 快捷原因 */}
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
              <span className={styles.previewOld}>{user.availablePoints.toLocaleString('zh-CN')}</span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" aria-hidden="true">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
              <span
                className={styles.previewNew}
                style={{ color: dir === 'add' ? '#84cc16' : '#f97316' }}
              >
                {Math.max(0, previewBalance).toLocaleString('zh-CN')}
              </span>
              <span className={styles.previewUnit}>积分</span>
            </div>
          </div>
        )}

      </div>
    </OperationModalShell>
  );
};

export default AdjustPointsModal;
