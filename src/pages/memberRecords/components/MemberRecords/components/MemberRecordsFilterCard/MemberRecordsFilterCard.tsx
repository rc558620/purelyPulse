// 筛选查询卡：电话 / 姓名 / 会员等级 / 记录类型 + 三个日期框（开始日期 / 结束日期 / 单独日期），
// 右侧「查询 / 重置」。无字段 label，placeholder 即字段名，全部控件 40px 高、胶囊圆角。
//
// 全部查询控件走全局组件（Input / SelectView / DatePicker），
// 不在这里手写输入与日期交互，避免与其它页面的筛选体验分叉。
//
// 三个日期框互斥：单独日期与起止日期不会同时有值（互斥由 Hook 的 setter 保证），
// 所以后端收到的永远是一组确定的日期口径。
import React, { useMemo } from 'react';
import DatePicker from '@components/form/DatePicker';
import { Input } from '@components/form/Input/Input';
import { SelectView } from '@components/form/SelectView';
import {
  MEMBER_RECORD_LEVEL_OPTIONS,
  MEMBER_RECORD_PHONE_MAX_LENGTH,
  MEMBER_RECORD_TYPE_OPTIONS,
} from '../../../../memberRecords.constants';
import {
  IconRecordPhone,
  IconRecordSearch,
  IconRecordUser,
} from '../../../../memberRecordsIcons';
import styles from '../../../../memberRecords.module.less';
import type {
  MemberRecordDateValue,
  MemberRecordsFilterState,
  MemberRecordLevelFilter,
  MemberRecordTypeFilter,
} from '../../../../memberRecords.types';

interface MemberRecordsFilterCardProps {
  filters: MemberRecordsFilterState;
  /** 查询中（首屏 / 换条件）：按钮置灰并改文案，避免连点。 */
  isSearching: boolean;
  /** 日期范围是否填反。 */
  isRangeReversed: boolean;
  onChangePhone: (value: string) => void;
  onChangeName: (value: string) => void;
  onChangeLevel: (value: MemberRecordLevelFilter) => void;
  onChangeType: (value: MemberRecordTypeFilter) => void;
  onChangeSingleDate: (value: MemberRecordDateValue) => void;
  onChangeRangeStart: (value: MemberRecordDateValue) => void;
  onChangeRangeEnd: (value: MemberRecordDateValue) => void;
  onSubmit: () => void;
  onReset: () => void;
}

const MemberRecordsFilterCard: React.FC<MemberRecordsFilterCardProps> = ({
  filters,
  isSearching,
  isRangeReversed,
  onChangePhone,
  onChangeName,
  onChangeLevel,
  onChangeType,
  onChangeSingleDate,
  onChangeRangeStart,
  onChangeRangeEnd,
  onSubmit,
  onReset,
}) => {
  const levelOptions = useMemo(() => MEMBER_RECORD_LEVEL_OPTIONS, []);
  const typeOptions = useMemo(() => MEMBER_RECORD_TYPE_OPTIONS, []);

  const handleLevelChange = (value: string | number | null | undefined): void => {
    onChangeLevel(value == null ? 'all' : (value as MemberRecordLevelFilter));
  };

  const handleTypeChange = (value: string | number | null | undefined): void => {
    onChangeType(value == null ? 'all' : (value as MemberRecordTypeFilter));
  };

  return (
    <section className={styles.filterCard}>
      <div className={styles.filterHeader}>
        <div className={styles.filterHeaderIcon} aria-hidden="true">
          <IconRecordSearch width={14} height={14} />
        </div>
        <span className={styles.filterHeaderTitle}>筛选查询</span>
        {/* 「默认查询今天」把默认口径写在卡片标题行：避免运营以为默认查的是全部历史 */}
        <span className={styles.filterHeaderHint}>默认查询今天</span>
      </div>

      <div className={styles.filterGrid}>
        <Input
          value={filters.phone}
          onChange={(event) => onChangePhone(event.target.value)}
          placeholder="电话"
          // numeric：移动端弹纯数字键盘（tel 会带 + * # 等电话符号键）
          inputMode="numeric"
          maxLength={MEMBER_RECORD_PHONE_MAX_LENGTH}
          wrapperClassName={styles.compactInput}
          prefix={<IconRecordPhone width={15} height={15} />}
          aria-label="电话"
        />

        <Input
          value={filters.name}
          onChange={(event) => onChangeName(event.target.value)}
          placeholder="姓名"
          maxLength={20}
          wrapperClassName={styles.compactInput}
          prefix={<IconRecordUser width={15} height={15} />}
          aria-label="姓名"
        />

        <SelectView
          options={levelOptions}
          value={filters.level}
          onChange={handleLevelChange}
          placeholder="会员等级"
          searchable={false}
          displayMode="pc"
          allowClear={filters.level !== 'all'}
          triggerClassName={styles.compactSelect}
        />

        <SelectView
          options={typeOptions}
          value={filters.type}
          onChange={handleTypeChange}
          placeholder="记录类型"
          searchable={false}
          displayMode="pc"
          allowClear={filters.type !== 'all'}
          triggerClassName={styles.compactSelect}
        />

        <DatePicker
          value={filters.rangeStart}
          onChange={onChangeRangeStart}
          placeholder="开始日期"
          className={styles.compactDate}
        />

        <DatePicker
          value={filters.rangeEnd}
          onChange={onChangeRangeEnd}
          placeholder="结束日期"
          className={styles.compactDate}
        />

        <DatePicker
          value={filters.singleDate}
          onChange={onChangeSingleDate}
          placeholder="单独日期"
          className={styles.compactDate}
        />

        <div className={styles.actionsCell}>
          <button
            type="button"
            className={styles.searchBtn}
            onClick={onSubmit}
            disabled={isSearching || isRangeReversed}
            aria-label="查询会员记录"
          >
            {isSearching ? '查询中...' : '查询'}
          </button>
          <button
            type="button"
            className={styles.resetBtn}
            onClick={onReset}
            disabled={isSearching}
            aria-label="重置查询条件"
          >
            重置
          </button>
        </div>

        {isRangeReversed ? (
          <div className={styles.dateRangeWarning} role="alert">开始日期不能晚于结束日期</div>
        ) : null}
      </div>
    </section>
  );
};

export default React.memo(MemberRecordsFilterCard);
