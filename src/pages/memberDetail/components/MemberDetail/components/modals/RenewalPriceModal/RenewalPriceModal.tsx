/**
 * RenewalPriceModal —— 调整续费价格弹窗
 *
 * 与「设置会员等级」的分工：
 *  - 设置会员等级：改变「现在卖什么价」（本次成交价 + 锁定子账号加价）
 *  - 调整续费价格：只改变「以后续什么价」（该账号续费时的价格覆盖）
 *
 * 续费价口径 = max(当前配置价, 议定价) + 子账号加价，全部由后端计算下发；
 * 前端只负责录入议定价与展示，不做任何定价运算（预览仅作输入反馈）。
 */
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { cx, safeStr } from '@utils/utils';
import {
  IconClose,
  IconInfoCircle,
  IconPriceTag,
  IconWarningTriangle,
} from '@pages/memberDetail/components/MemberDetailIcons/MemberDetailIcons';
import { LEVEL_LABEL } from '@pages/memberList/memberList.constants';
import { useRenewalPriceDraft } from './hooks/useRenewalPriceDraft';
import { toRenewalPlanId } from './renewalPriceModal.utils';
import RenewalPriceRow from './components/RenewalPriceRow/RenewalPriceRow';
import type { RenewalPriceModalProps } from './RenewalPriceModal.types';
import styles from './RenewalPriceModal.module.less';

/** 弹窗主色：与「设置会员等级」的草绿区分，价格语义用琥珀色。 */
const ACCENT_COLOR = '#f59e0b';

const RenewalPriceModal: React.FC<RenewalPriceModalProps> = ({
  memberId,
  memberName,
  currentLevel,
  isSubmitting,
  onClose,
  onSubmit,
}) => {
  const {
    items,
    isLoading,
    errorMessage,
    reload,
    draftValues,
    handleInputChange,
    handleClearRow,
    changedItems,
    invalidPlanIds,
    canSubmit,
    applyUpdatedItems,
  } = useRenewalPriceDraft({ memberId });

  // 保存成功后就地标记一次，让运营确认「刚才那次确实存进去了」
  const [savedCount, setSavedCount] = useState<number | null>(null);

  const currentPlanId = useMemo(() => toRenewalPlanId(currentLevel), [currentLevel]);
  const isBusy = isSubmitting || isLoading;
  const closeModal = useCallback((): void => {
    if (!isSubmitting) {
      onClose();
    }
  }, [isSubmitting, onClose]);

  useEffect(() => {
    const handler = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') {
        closeModal();
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [closeModal]);

  const handleSubmit = useCallback(async (): Promise<void> => {
    if (isSubmitting || !canSubmit) {
      return;
    }

    const nextItems = await onSubmit(changedItems);
    if (nextItems) {
      applyUpdatedItems(nextItems);
      setSavedCount(changedItems.length);
    }
  }, [applyUpdatedItems, canSubmit, changedItems, isSubmitting, onSubmit]);

  const footerHint = useMemo(() => {
    if (invalidPlanIds.length > 0) {
      return `有 ${invalidPlanIds.length} 项金额格式不正确`;
    }
    if (changedItems.length > 0) {
      return `待保存 ${changedItems.length} 项改动`;
    }
    return savedCount === null ? '仅调整该账号的续费价，不影响其他会员' : `已保存 ${savedCount} 项改动`;
  }, [changedItems.length, invalidPlanIds.length, savedCount]);

  return (
    <div
      className={styles.overlay}
      role="dialog"
      aria-modal="true"
      aria-label="调整续费价格"
    >
      <div className={styles.sheet}>
        <div className={styles.dragHandle} aria-hidden="true" />

        <div className={styles.sheetHeader}>
          <div className={styles.sheetTitleWrap}>
            <div
              className={styles.sheetTitleIcon}
              style={{
                background: 'linear-gradient(135deg, rgba(245,158,11,0.16), rgba(251,191,36,0.08))',
                borderColor: `${ACCENT_COLOR}40`,
                color: ACCENT_COLOR,
              }}
              aria-hidden="true"
            >
              <IconPriceTag width={16} height={16} strokeWidth={2.2} />
            </div>
            <div className={styles.sheetTitleText}>
              <span className={styles.sheetTitle}>调整续费价格</span>
              <span className={styles.sheetSubtitle}>
                {safeStr(memberName, '未命名会员')} · 当前{LEVEL_LABEL[currentLevel] ?? '会员'}
              </span>
            </div>
          </div>
          <button
            type="button"
            className={styles.closeBtn}
            onClick={closeModal}
            aria-label="关闭"
            disabled={isSubmitting}
          >
            <IconClose />
          </button>
        </div>

        <div className={styles.sheetBody}>
          <div className={styles.ruleCard}>
            <IconInfoCircle width={13} height={13} strokeWidth={2.2} />
            <span>
              改价只影响该账号<strong>后续续费</strong>，不改写本次成交金额；
              留空即按当前配置价续费（配置价之后调整，这里会跟着变）。
            </span>
          </div>

          {isLoading ? (
            <p className={styles.stateText}>续费价格加载中...</p>
          ) : errorMessage ? (
            <div className={styles.errorState}>
              <span className={styles.errorStateText}>
                <IconWarningTriangle width={13} height={13} strokeWidth={2.2} />
                {errorMessage}
              </span>
              <button type="button" className={styles.retryBtn} onClick={reload} disabled={isSubmitting}>
                重新加载
              </button>
            </div>
          ) : items.length === 0 ? (
            <p className={styles.stateText}>暂无可调整的续费档位</p>
          ) : (
            <div className={styles.rowList}>
              {items.map((item) => (
                <RenewalPriceRow
                  key={item.planId}
                  item={item}
                  value={draftValues[item.planId] ?? ''}
                  isCurrentPlan={item.planId === currentPlanId}
                  isInvalid={invalidPlanIds.includes(item.planId)}
                  isDisabled={isSubmitting}
                  onValueChange={handleInputChange}
                  onClear={handleClearRow}
                />
              ))}
            </div>
          )}
        </div>

        <div className={styles.sheetActions}>
          <div className={cx(styles.footerHint, changedItems.length > 0 && styles.footerHintActive)}>
            {footerHint}
          </div>
          <div className={styles.actionRow}>
            <button type="button" className={styles.cancelBtn} onClick={closeModal} disabled={isSubmitting}>
              关闭
            </button>
            <button
              type="button"
              className={styles.confirmBtn}
              style={{
                background: `linear-gradient(135deg, ${ACCENT_COLOR}, ${ACCENT_COLOR}cc)`,
                boxShadow: `0 4px 16px ${ACCENT_COLOR}55`,
              }}
              onClick={handleSubmit}
              disabled={isBusy || !canSubmit}
            >
              {isSubmitting ? '保存中...' : '保存改价'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RenewalPriceModal;
