// SetSubAccountCapabilityCard：展示子账号能力规则与约束说明。
import React from 'react';
import { cx, isNonEmptyArray } from '@utils/utils';
import { IconInfoCircle } from '@pages/memberDetail/components/MemberDetailIcons/MemberDetailIcons';
import styles from '../../SetSubAccountModal.module.less';

interface CapabilityItem {
  key: string;
  content: React.ReactNode;
  isWarning?: boolean;
}

const CAPABILITY_ITEMS: CapabilityItem[] = [
  {
    key: 'quota-range',
    content: <>子账号额度由平台设置，<strong>1~10</strong> 个，仅限年/永久会员使用</>,
  },
  {
    key: 'settings-guard',
    content: <>任何子账号均<strong>不能访问门店设置</strong>，后端接口同步拦截</>,
    isWarning: true,
  },
  {
    key: 'role-assignment',
    content: <>角色分配（收银员 / 财务 / 店长）由<strong>商家在 purelyProfit 端</strong>自行操作</>,
  },
  {
    key: 'compat-mode',
    content: <>设置为 0 时关闭子账号能力，员工将使用主账号自交班（兼容模式）</>,
  },
];

const SetSubAccountCapabilityCard: React.FC = () => (
  <div className={styles.capabilityCard}>
    <div className={styles.capabilityTitle}>
      <IconInfoCircle width={14} height={14} />
      子账号能力说明
    </div>
    <ul className={styles.capabilityList}>
      {isNonEmptyArray(CAPABILITY_ITEMS)
        ? CAPABILITY_ITEMS.map((item) => (
          <li key={item.key} className={styles.capabilityItem}>
            <span
              className={cx(
                styles.capabilityItemDot,
                item.isWarning && styles.capabilityItemDotWarning,
              )}
              aria-hidden="true"
            />
            <span className={styles.capabilityItemText}>{item.content}</span>
          </li>
        ))
        : null}
    </ul>
  </div>
);

export default SetSubAccountCapabilityCard;
