// 推广详情筛选面板：负责查询条件填写、提交与地区总览前置提示。
import React from 'react';
import { Form, FormItem } from '@components/form';
import { Input } from '@components/form/Input/Input';
import { CascaderView } from '@components/form/CascaderView';
import { EmptyState } from '@components/ui/feedback';
import {
  IconPromotionDetailEmpty,
  IconPromotionDetailLocation,
  IconPromotionDetailSearch,
  IconPromotionDetailUser,
} from '../_shared/icons/PromotionDetailIcons';
import PromotionDetailDateModeField from './PromotionDetailDateModeField';
import styles from '../../promotionDetail.module.less';
import type {
  PromotionDetailFilterPanelProps,
  PromotionDetailQueryFormDTO,
} from './PromotionDetailFilterPanel.types';

const QUERY_FORM_RULES = {
  name: [],
} as const satisfies Record<keyof PromotionDetailQueryFormDTO, []>;

const PromotionDetailFilterPanel: React.FC<PromotionDetailFilterPanelProps> = ({
  form,
  isLoading,
  isDateRangeValid,
  queryMode,
  regionValues,
  regionOptions,
  dayYear,
  dayMonth,
  dayDay,
  rangeStartYear,
  rangeStartMonth,
  rangeStartDay,
  rangeEndYear,
  rangeEndMonth,
  rangeEndDay,
  hasSearched,
  showEmptyState,
  onSubmit,
  onSubmitFailed,
  onReset,
  onRegionChange,
  onQueryModeChange,
  onDayChange,
  onDayReset,
  onRangeStartChange,
  onRangeEndChange,
  onRangeReset,
  onRetry,
}) => (
  <>
    <div className={styles.formCard}>
      <div className={styles.formCardHeader}>
        <div className={styles.formCardIcon} aria-hidden="true">
          <IconPromotionDetailSearch width={18} height={18} />
        </div>
        <span className={styles.formCardTitle}>筛选查询</span>
      </div>

      <Form form={form} onFinish={onSubmit} onFinishFailed={onSubmitFailed}>
        <div className={styles.fieldGroup}>
          <div className={styles.fieldLabel}>
            <IconPromotionDetailUser />
            姓名查询
          </div>
          <FormItem name="name" rules={QUERY_FORM_RULES.name}>
            <Input placeholder="请输入合伙人姓名（可选）" maxLength={20} />
          </FormItem>
        </div>

        <div className={styles.fieldGroup}>
          <div className={styles.fieldLabel}>
            <IconPromotionDetailLocation />
            选择省市区
          </div>
          <CascaderView
            options={regionOptions}
            value={regionValues}
            onChange={onRegionChange}
            placeholder="请选择省 / 市 / 区（可选）"
            allowClear
          />
        </div>

        <PromotionDetailDateModeField
          queryMode={queryMode}
          isDateRangeValid={isDateRangeValid}
          dayYear={dayYear}
          dayMonth={dayMonth}
          dayDay={dayDay}
          rangeStartYear={rangeStartYear}
          rangeStartMonth={rangeStartMonth}
          rangeStartDay={rangeStartDay}
          rangeEndYear={rangeEndYear}
          rangeEndMonth={rangeEndMonth}
          rangeEndDay={rangeEndDay}
          onQueryModeChange={onQueryModeChange}
          onDayChange={onDayChange}
          onDayReset={onDayReset}
          onRangeStartChange={onRangeStartChange}
          onRangeEndChange={onRangeEndChange}
          onRangeReset={onRangeReset}
        />

        <div className={styles.formActions}>
          <button
            type="button"
            className={styles.resetBtn}
            onClick={onReset}
            aria-label="重置查询条件"
            disabled={isLoading}
          >
            重置
          </button>
          <button
            type="submit"
            className={styles.searchBtn}
            aria-label="开始查询"
            disabled={isLoading}
          >
            <IconPromotionDetailSearch width={16} height={16} strokeWidth={2.5} />
            {isLoading ? '查询中...' : '查询'}
          </button>
        </div>
      </Form>
    </div>

    {!hasSearched ? (
      <div className={styles.hintCard}>
        <div className={styles.hintIcon} aria-hidden="true">
          <IconPromotionDetailLocation width={28} height={28} strokeWidth={1.5} />
        </div>
        <p className={styles.hintText}>设置筛选条件后点击查询，即可查看各地区合伙人分布</p>
        <ul className={styles.hintList}>
          <li>可按姓名精确查找合伙人</li>
          <li>可选择省市区缩小查询范围</li>
          <li>点击地区卡片查看该地区合伙人列表</li>
          <li>点击合伙人查看每日 / 月 / 年推广数据</li>
        </ul>
      </div>
    ) : null}

    {showEmptyState ? (
      <div className={styles.detailListCard}>
        <EmptyState
          icon={<IconPromotionDetailEmpty />}
          title="暂无推广数据"
          desc="当前筛选条件下未查询到地区分布结果，试试放宽姓名、地区或日期范围。"
          actionText="重新加载"
          onAction={onRetry}
        />
      </div>
    ) : null}
  </>
);

export default PromotionDetailFilterPanel;
