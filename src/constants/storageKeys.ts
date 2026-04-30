/**
 * 全局 Storage Key 常量集中管理。
 * 避免 key 字符串散落在业务代码中，修改时一处生效、全局一致。
 */
export const STORAGE_KEYS = {
  /** 注册流程第一步（账号信息）完成标记，存于 sessionStorage。 */
  REGISTER_STEP1_DONE: 'registerStep1Done',
  /** 商品分类列表，存于 localStorage。 */
  CATEGORIES: 'purely_profit_categories',
  /** 商品列表（含库存信息），存于 localStorage。 */
  PRODUCTS: 'purely_profit_products',
  /** 盘点记录列表，存于 localStorage。 */
  STOCKTAKING_RECORDS: 'purely_profit_stocktaking_records',
  /** 成本支出记录列表，存于 localStorage。 */
  COST_RECORDS: 'purely_profit_cost_records',
  /** 利润详情销售记录列表，存于 localStorage。 */
  PROFIT_SALES: 'purely_profit_sales_records',
  /** 进货单列表，存于 localStorage。 */
  PURCHASE_ORDERS: 'purely_profit_purchase_orders',
  /** 供应商列表，存于 localStorage。 */
  SUPPLIERS: 'purely_profit_suppliers',
  /** 门店信息，存于 localStorage。 */
  STORE_INFO: 'purely_profit_store_info',
  /** 员工档案列表，存于 localStorage。 */
  EMPLOYEES: 'purely_profit_employees',
  /** 排班记录列表，存于 localStorage。 */
  SHIFTS: 'purely_profit_shifts',
  /** 请假记录列表，存于 localStorage。 */
  LEAVE_RECORDS: 'purely_profit_leave_records',
  /** 工资结算单列表，存于 localStorage。 */
  PAYROLL_RECORDS: 'purely_profit_payroll_records',
  /** 员工职位列表，存于 localStorage。 */
  POSITIONS: 'purely_profit_positions',
  /** 部门列表，存于 localStorage。 */
  DEPARTMENTS: 'purely_profit_departments',
  /** 销售订单列表，存于 localStorage。 */
  SALES_ORDERS: 'purely_profit_sales_orders',
} as const;
