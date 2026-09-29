// 首页总览取值与归一化：把不可信的后端响应收敛成前端可用的基础值（对象 / 数组 / 字符串 / 数字 / 展示值）。
// 前端禁止金额转换和格式化。所有金额展示值由后端直接返回 xxxDisplay 字段，这里只原样搬运。
import { safeNum } from '@utils/utils';

/** 是否为「普通对象」：排除 null 与数组，用于安全读取未知响应的字段。 */
export const isPlainObject = (value: unknown): value is Record<string, unknown> => (
  typeof value === 'object' && value !== null && !Array.isArray(value)
);

/** 按候选 key 取出嵌套对象，命中第一个即返回。 */
export const getNestedRecord = (value: unknown, keys: readonly string[]): Record<string, unknown> | null => {
  if (!isPlainObject(value)) {
    return null;
  }

  for (const key of keys) {
    const candidate = value[key];
    if (isPlainObject(candidate)) {
      return candidate;
    }
  }

  return null;
};

/** 按候选 key 取出嵌套数组，裸数组直接返回，命中第一个候选即返回。 */
export const getNestedArray = (value: unknown, keys: readonly string[]): unknown[] => {
  if (Array.isArray(value)) {
    return value;
  }

  if (!isPlainObject(value)) {
    return [];
  }

  for (const key of keys) {
    const candidate = value[key];
    if (Array.isArray(candidate)) {
      return candidate;
    }
  }

  return [];
};

/** 把不可信值归一成数字：支持千分位字符串，无法解析时返回 0。 */
export const normalizeNumber = (value: unknown): number => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === 'string') {
    const sanitizedValue = value.replace(/,/g, '').trim();
    if (!sanitizedValue) {
      return 0;
    }
    const parsedValue = Number(sanitizedValue);
    if (Number.isFinite(parsedValue)) {
      return parsedValue;
    }
  }

  return 0;
};

/** 按候选 key 取非空字符串。 */
export const pickStringField = (value: unknown, keys: readonly string[]): string => {
  if (!isPlainObject(value)) {
    return '';
  }

  for (const key of keys) {
    const candidate = value[key];
    if (typeof candidate === 'string' && candidate.trim()) {
      return candidate.trim();
    }
  }

  return '';
};

/** 按候选 key 取数字：命中 0 也视为有效值（0 本身有业务语义）。 */
export const pickNumberField = (value: unknown, keys: readonly string[]): number => {
  if (!isPlainObject(value)) {
    return 0;
  }

  for (const key of keys) {
    const candidate = value[key];
    const normalizedValue = normalizeNumber(candidate);
    if (normalizedValue !== 0 || candidate === 0 || candidate === '0') {
      return safeNum(normalizedValue);
    }
  }

  return 0;
};

/** 按候选 key 取数字数组，丢弃无法解析的项。 */
export const pickNumberArray = (value: unknown, keys: readonly string[]): number[] => (
  getNestedArray(value, keys)
    .map((item) => normalizeNumber(item))
    .filter((item) => Number.isFinite(item))
);

/** 按候选 key 取非空字符串数组。 */
export const pickStringArray = (value: unknown, keys: readonly string[]): string[] => (
  getNestedArray(value, keys)
    .filter((item): item is string => typeof item === 'string')
    .map((item) => item.trim())
    .filter(Boolean)
);

/** 直接从后端响应中读取展示字符串字段，前端不做转换。 */
export const pickDisplayField = (value: unknown, keys: readonly string[]): string => {
  if (!isPlainObject(value)) {
    return '';
  }

  for (const key of keys) {
    const candidate = value[key];
    if (typeof candidate === 'string' && candidate.trim()) {
      return candidate.trim();
    }
  }

  return '';
};

/** 从后端响应中直接读取金额展示值数组，前端不做分转元。 */
export const pickDisplayArray = (value: unknown, keys: readonly string[]): string[] => (
  getNestedArray(value, keys)
    .map((item) => {
      if (typeof item === 'string' && item.trim()) {
        return item.trim();
      }
      return '';
    })
    .filter(Boolean)
);

/** 归一成「月/日」标签：优先后端下发字符串，其次按秒级 / 毫秒级时间戳换算。 */
export const formatDateLabel = (value: unknown): string => {
  if (typeof value === 'string' && value.trim()) {
    return value.trim();
  }

  const numericValue = normalizeNumber(value);
  if (numericValue > 0) {
    const timestamp = numericValue < 1_000_000_000_000 ? numericValue * 1000 : numericValue;
    const date = new Date(timestamp);
    if (!Number.isNaN(date.getTime())) {
      return `${date.getMonth() + 1}/${date.getDate()}`;
    }
  }

  return '';
};
