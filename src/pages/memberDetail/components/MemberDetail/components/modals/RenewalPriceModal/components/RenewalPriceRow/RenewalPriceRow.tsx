// 调整续费价格弹窗的单档位行：展示现状、提供覆盖价输入与即时预览。
import React from 'react';
import { cx } from '@utils/utils';
import { IconLock } from '@pages/memberDetail/components/MemberDetailIcons/MemberDetailIcons';
import {
  isClearedInput,
  isPositiveDisplayAmount,
  isSubAccountPlan,
  resolveRenewalBadgeState,
  resolveRenewalHint,
} from '../../renewalPriceModal.utils';
import type {
  RenewalPriceBadgeState,
  RenewalPriceHint,
} from '../../renewalPriceModal.utils';
import type { MemberRenewalPrice } from '@pages/memberList/memberList.pricing.types';
import type { RenewalPriceRowProps } from '../../RenewalPriceModal.types';
import styles from '../../RenewalPriceModal.module.less';

/** 徽标文案：有记录但被配置价压过时必须说清「未生效」，否则运营会以为还在压价。 */
const BADGE_LABEL: Record<RenewalPriceBadgeState, string> = {
  default: '按配置价',
  effective: '已议价（生效中）',
  inactive: '已议价（低于配置价，未生效）',
};

const BADGE_STYLE: Record<RenewalPriceBadgeState, string> = {
  default: styles.stateBadgeDefault,
  effective: styles.stateBadgeOverridden,
  inactive: styles.stateBadgeInactive,
};

/**
 * 非「调整后」分支的说明文案。
 *
 * 金额一律取后端下发的展示值或工具函数算好的预览值，组件不做任何换算。
 * 「低于配置价」的两支必须说清**当下实际收多少**，否则运营会误以为议价还在压价。
 */
const resolveHintText = (hint: RenewalPriceHint, item: MemberRenewalPrice): string => {
  switch (hint.kind) {
    case 'ineffective':
      return `¥${hint.amountDisplay} 低于配置价 ¥${item.configPriceDisplay}，保存后仍按 ¥${hint.previewDisplay} 续费`;
    case 'stale':
      return `议定价 ¥${hint.amountDisplay} 低于配置价 ¥${item.configPriceDisplay}，当前按 ¥${hint.previewDisplay} 续费`;
    case 'effective':
      return `已议定 ¥${hint.amountDisplay}，配置价变动时自动取高者`;
    default:
      return `留空即按配置价 ¥${hint.amountDisplay} 续费`;
  }
};

const RenewalPriceRow: React.FC<RenewalPriceRowProps> = React.memo(({
  item,
  value,
  isCurrentPlan,
  isInvalid,
  isDisabled,
  onValueChange,
  onClear,
}) => {
  const hasOverride = !isClearedInput(value);
  const badgeState = resolveRenewalBadgeState(item, value);
  const hasSurcharge =
    isSubAccountPlan(item.planId) && isPositiveDisplayAmount(item.subAccountAmountDisplay);
  // 提示判定与「会不会提交」同源（isRowChanged），不看预览价有没有变：
  // 输入低于配置价时预览不会变，但这一行确实要写库，必须提示「不生效」
  const hint = resolveRenewalHint(item, value);

  return (
    <div className={cx(
      styles.row,
      isCurrentPlan && styles.rowCurrent,
      !item.editable && styles.rowLocked,
    )}>
      <div className={styles.rowHeader}>
        <span className={styles.rowTitle}>{item.planName}</span>
        {isCurrentPlan ? <span className={styles.currentBadge}>当前档位</span> : null}
        {item.editable ? (
          <span className={cx(styles.stateBadge, BADGE_STYLE[badgeState])}>
            {BADGE_LABEL[badgeState]}
          </span>
        ) : null}
      </div>

      {/* 现状：配置价 [± 子账号加价] = 现续费价，全部来自后端，前端只做拼装展示 */}
      <div className={styles.factRow}>
        <span className={styles.fact}>
          配置价 <strong>¥{item.configPriceDisplay}</strong>
        </span>
        {hasSurcharge ? (
          <>
            <span className={styles.factOperator}>+</span>
            <span className={cx(styles.fact, styles.factSurcharge)}>
              子账号加价 <strong>¥{item.subAccountAmountDisplay}</strong>
            </span>
          </>
        ) : null}
        <span className={styles.factOperator}>=</span>
        <span className={cx(styles.fact, styles.factRenewal)}>
          现续费价 <strong>¥{item.renewalPriceDisplay}</strong>
        </span>
      </div>

      {item.editable ? (
        <>
          <div className={styles.editRow}>
            <label className={cx(styles.inputWrapper, isInvalid && styles.inputWrapperInvalid)}>
              <span className={styles.inputPrefix}>¥</span>
              <input
                className={styles.input}
                type="text"
                inputMode="decimal"
                value={value}
                placeholder={item.configPriceDisplay}
                aria-label={`${item.planName}续费价格`}
                aria-invalid={isInvalid}
                disabled={isDisabled}
                onChange={(event) => onValueChange(item.planId, event.target.value)}
              />
            </label>
            {hasOverride ? (
              <button
                type="button"
                className={styles.clearBtn}
                onClick={() => onClear(item.planId)}
                disabled={isDisabled}
              >
                恢复配置价
              </button>
            ) : null}
          </div>

          {isInvalid ? (
            <p className={styles.errorText}>请输入非负金额，最多保留两位小数</p>
          ) : (
            <p className={styles.previewText}>
              {hint.kind === 'adjusted' ? (
                <>
                  调整后续费价 <strong>¥{hint.previewDisplay}</strong>
                  <span className={styles.previewHint}>（保存后立即生效）</span>
                </>
              ) : (
                <span className={styles.previewHint}>{resolveHintText(hint, item)}</span>
              )}
            </p>
          )}
        </>
      ) : (
        <p className={styles.lockedHint}>
          <IconLock width={12} height={12} strokeWidth={2.2} />
          {item.editableReason ?? '该档位暂不支持改价'}
        </p>
      )}
    </div>
  );
});

RenewalPriceRow.displayName = 'RenewalPriceRow';

export default RenewalPriceRow;
