/**
 * 全局 Storage Key 常量集中管理。
 * 避免 key 字符串散落在业务代码中，修改时一处生效、全局一致。
 */
export const STORAGE_KEYS = {
  /** 登录态标记，仅标记用户是否已认证（token 本身由 HttpOnly Cookie 管理）。 */
  ACCESS_TOKEN: 'pp_access_token',
  /** JWT 过期时间戳（秒），用于前端提前感知 token 过期并刷新/重定向。 */
  TOKEN_EXPIRES_AT: 'pp_token_expires_at',
  /** 当前登录用户信息缓存，存于 sessionStorage。 */
  USER_INFO: 'purely_profit_user_info',
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
  /** 会员等级手动设置产生的收入记录，存于 sessionStorage。 */
  MEMBERSHIP_REVENUE_EVENTS: 'purely_profit_membership_revenue_events',
  /** 积分变动记录页面缓存，存于 localStorage。 */
  MEMBER_POINTS_PAGE_DATA: 'purely_profit_member_points_page_data',
  /** CSRF Token，从后端获取后存于 sessionStorage，用于 X-CSRF-Token 请求头。 */
  CSRF_TOKEN: 'pp_csrf_token',
} as const;
