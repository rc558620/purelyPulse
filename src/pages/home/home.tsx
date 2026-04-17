import React from 'react';
import PageHeader from '@components/ui/layout/PageHeader';
import styles from './home.module.less';

const Home: React.FC = () => {
  return (
    <div className={styles.pageContainer}>
      <div className={styles.blurOrb} aria-hidden="true" />

      <PageHeader title="首页" />

      <main className={styles.contentWrapper}>
        {/* 页面内容 */}
      </main>
    </div>
  );
};

export default Home;
