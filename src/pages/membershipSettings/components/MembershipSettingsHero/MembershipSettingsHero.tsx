// 会员设置说明区：展示页面标题、图标与操作说明。
import type { JSX } from 'react';
import { IconMembershipSettings } from '../MembershipSettingsIcons/MembershipSettingsIcons';
import styles from './MembershipSettingsHero.module.less';

const HERO_COPY = {
  title: '会员套餐定价',
  description: '设置各会员层级的订阅价格，修改后点击对应卡片的「保存此项」即时生效。',
} as const;

const MembershipSettingsHero = (): JSX.Element => (
  <section className={styles.pageHero}>
    <div className={styles.heroIconWrap} aria-hidden="true">
      <IconMembershipSettings />
    </div>

    <div className={styles.heroText}>
      <h2 className={styles.heroTitle}>{HERO_COPY.title}</h2>
      <p className={styles.heroDesc}>{HERO_COPY.description}</p>
    </div>
  </section>
);

export default MembershipSettingsHero;
