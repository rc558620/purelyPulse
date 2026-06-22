import areaData from 'china-area-data';
import type { CascaderOption, CascadeValue } from '@components/form/CascaderView/types';

type AreaDataMap = Record<string, Record<string, string>>;

interface RegionPathParts {
  provinceCode: string;
  provinceName: string;
  cityCode: string;
  cityName: string;
  districtCode: string;
  districtName: string;
}

const ROOT_REGION_CODE = '86';
const MUNICIPAL_PLACEHOLDER_LABEL = '市辖区';
const MUNICIPALITY_CODES = new Set(['110000', '120000', '310000', '500000']);
const REGION_CODE_PATTERN = /^\d{6}$/;
const REGION_SEGMENT_SEPARATOR = /\s*(?:,|\/|>|\||·)\s*/;
const parsedAreaData = areaData as AreaDataMap;

const isMunicipalityCode = (code: string): boolean => MUNICIPALITY_CODES.has(code);

const findCodeByLabel = (
  levelMap: Record<string, string> | undefined,
  label: string,
): string | undefined => {
  if (!levelMap) {
    return undefined;
  }

  return Object.entries(levelMap).find(([, currentLabel]) => currentLabel === label)?.[0];
};

const shouldSkipDistrictPlaceholder = (parentCode: string, label: string): boolean => (
  label === MUNICIPAL_PLACEHOLDER_LABEL && !isMunicipalityCode(parentCode)
);

const buildMunicipalityOptions = (provinceCode: string): CascaderOption[] => {
  const cityGroups = parsedAreaData[provinceCode];

  if (!cityGroups) {
    return [];
  }

  return Object.entries(cityGroups).flatMap(([cityCode]) => {
    const districtLevel = parsedAreaData[cityCode];

    if (!districtLevel) {
      return [];
    }

    return Object.entries(districtLevel).map(([districtCode, districtLabel]) => ({
      label: districtLabel,
      value: districtCode,
      valuePath: [provinceCode, cityCode, districtCode],
    } satisfies CascaderOption));
  });
};

const buildRegionOptions = (parentCode: string): CascaderOption[] => {
  if (isMunicipalityCode(parentCode)) {
    return buildMunicipalityOptions(parentCode);
  }

  const currentLevel = parsedAreaData[parentCode];

  if (!currentLevel) {
    return [];
  }

  return Object.entries(currentLevel).flatMap(([code, label]) => {
    if (shouldSkipDistrictPlaceholder(parentCode, label)) {
      return [];
    }

    const children = buildRegionOptions(code);

    return [{
      label,
      value: code,
      children: children.length > 0 ? children : undefined,
    } satisfies CascaderOption];
  });
};

const toRegionSegments = (value: unknown): string[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .slice(0, 3)
    .map((item) => {
      if (typeof item === 'string') {
        return item.trim();
      }

      if (typeof item === 'number') {
        return String(item);
      }

      return '';
    })
    .filter(Boolean);
};

const toLooseRegionSegments = (value: unknown): string[] => {
  if (Array.isArray(value)) {
    return toRegionSegments(value);
  }

  if (typeof value === 'number' && Number.isFinite(value)) {
    return [String(Math.trunc(value))];
  }

  if (typeof value !== 'string') {
    return [];
  }

  const trimmedValue = value.trim();
  if (!trimmedValue) {
    return [];
  }

  if (trimmedValue.startsWith('[') && trimmedValue.endsWith(']')) {
    try {
      const parsedValue = JSON.parse(trimmedValue) as unknown;
      return toRegionSegments(parsedValue);
    } catch {
      return [];
    }
  }

  return trimmedValue
    .split(REGION_SEGMENT_SEPARATOR)
    .map((segment) => segment.trim())
    .filter(Boolean)
    .slice(0, 3);
};

const createNormalizedRegionValue = ({
  provinceCode,
  provinceName,
  cityCode,
  cityName,
  districtCode,
  districtName,
}: RegionPathParts): NormalizedRegionValue => {
  const isMunicipality = isMunicipalityCode(provinceCode);
  const normalizedCityName = isMunicipality ? provinceName : cityName;

  return {
    region: [provinceCode, cityCode, districtCode],
    regionLabels: isMunicipality
      ? [provinceName, districtName]
      : [provinceName, normalizedCityName, districtName],
    provinceCode,
    provinceName,
    cityCode,
    cityName: normalizedCityName,
    districtCode,
    districtName,
  };
};

const findMunicipalityDistrictByCode = (
  provinceCode: string,
  districtCode: string,
  expectedCityCode?: string,
): RegionPathParts | null => {
  const provinceName = parsedAreaData[ROOT_REGION_CODE]?.[provinceCode];
  const cityGroups = parsedAreaData[provinceCode];

  if (!provinceName || !cityGroups) {
    return null;
  }

  for (const [cityCode, cityName] of Object.entries(cityGroups)) {
    if (expectedCityCode && cityCode !== expectedCityCode) {
      continue;
    }

    const districtName = parsedAreaData[cityCode]?.[districtCode];

    if (districtName) {
      return {
        provinceCode,
        provinceName,
        cityCode,
        cityName,
        districtCode,
        districtName,
      };
    }
  }

  return null;
};

const findMunicipalityDistrictByLabel = (
  provinceCode: string,
  districtLabel: string,
  cityLabel?: string,
): RegionPathParts | null => {
  const provinceName = parsedAreaData[ROOT_REGION_CODE]?.[provinceCode];
  const cityGroups = parsedAreaData[provinceCode];

  if (!provinceName || !cityGroups) {
    return null;
  }

  for (const [cityCode, currentCityLabel] of Object.entries(cityGroups)) {
    const cityLabelMatches = !cityLabel
      || cityLabel === provinceName
      || cityLabel === currentCityLabel;

    if (!cityLabelMatches) {
      continue;
    }

    const districtCode = findCodeByLabel(parsedAreaData[cityCode], districtLabel);

    if (districtCode) {
      return {
        provinceCode,
        provinceName,
        cityCode,
        cityName: currentCityLabel,
        districtCode,
        districtName: districtLabel,
      };
    }
  }

  return null;
};

const findRegionPathByCodes = (segments: string[]): RegionPathParts | null => {
  const [provinceCode, cityOrDistrictCode, districtCode] = segments;

  if (!provinceCode || !cityOrDistrictCode) {
    return null;
  }

  const provinceName = parsedAreaData[ROOT_REGION_CODE]?.[provinceCode];

  if (!provinceName) {
    return null;
  }

  if (isMunicipalityCode(provinceCode)) {
    return districtCode
      ? findMunicipalityDistrictByCode(provinceCode, districtCode, cityOrDistrictCode)
      : findMunicipalityDistrictByCode(provinceCode, cityOrDistrictCode);
  }

  if (!districtCode) {
    return null;
  }

  const cityName = parsedAreaData[provinceCode]?.[cityOrDistrictCode];
  const districtName = parsedAreaData[cityOrDistrictCode]?.[districtCode];

  if (!cityName || !districtName || shouldSkipDistrictPlaceholder(cityOrDistrictCode, districtName)) {
    return null;
  }

  return {
    provinceCode,
    provinceName,
    cityCode: cityOrDistrictCode,
    cityName,
    districtCode,
    districtName,
  };
};

const findRegionPathByLabels = (segments: string[]): RegionPathParts | null => {
  const [provinceLabel, cityOrDistrictLabel, districtLabel] = segments;

  if (!provinceLabel || !cityOrDistrictLabel) {
    return null;
  }

  const provinceCode = findCodeByLabel(parsedAreaData[ROOT_REGION_CODE], provinceLabel);

  if (!provinceCode) {
    return null;
  }

  if (isMunicipalityCode(provinceCode)) {
    return districtLabel
      ? findMunicipalityDistrictByLabel(provinceCode, districtLabel, cityOrDistrictLabel)
      : findMunicipalityDistrictByLabel(provinceCode, cityOrDistrictLabel);
  }

  if (!districtLabel) {
    return null;
  }

  const cityCode = findCodeByLabel(parsedAreaData[provinceCode], cityOrDistrictLabel);
  const districtCode = cityCode
    ? findCodeByLabel(parsedAreaData[cityCode], districtLabel)
    : undefined;

  if (!cityCode || !districtCode || shouldSkipDistrictPlaceholder(cityCode, districtLabel)) {
    return null;
  }

  return {
    provinceCode,
    provinceName: provinceLabel,
    cityCode,
    cityName: cityOrDistrictLabel,
    districtCode,
    districtName: districtLabel,
  };
};

const findRegionPath = (value: unknown): RegionPathParts | null => {
  const segments = toRegionSegments(value);

  if (segments.length < 2) {
    return null;
  }

  return findRegionPathByCodes(segments) ?? findRegionPathByLabels(segments);
};

const resolveRegionLabelsBySingleCode = (code: string): string[] => {
  const provinceName = parsedAreaData[ROOT_REGION_CODE]?.[code];
  if (provinceName) {
    return [provinceName];
  }

  for (const [provinceCode, currentProvinceName] of Object.entries(parsedAreaData[ROOT_REGION_CODE] ?? {})) {
    const cityGroups = parsedAreaData[provinceCode];
    if (!cityGroups) {
      continue;
    }

    if (isMunicipalityCode(provinceCode)) {
      if (cityGroups[code]) {
        return [currentProvinceName];
      }

      const municipalityRegionPath = findMunicipalityDistrictByCode(provinceCode, code);
      if (municipalityRegionPath) {
        return createNormalizedRegionValue(municipalityRegionPath).regionLabels;
      }

      continue;
    }

    const cityName = cityGroups[code];
    if (cityName) {
      return [currentProvinceName, cityName];
    }

    for (const [cityCode, currentCityName] of Object.entries(cityGroups)) {
      const districtName = parsedAreaData[cityCode]?.[code];
      if (districtName && !shouldSkipDistrictPlaceholder(cityCode, districtName)) {
        return [currentProvinceName, currentCityName, districtName];
      }
    }
  }

  return [];
};

export interface NormalizedRegionValue {
  region: string[];
  regionLabels: string[];
  provinceCode: string;
  provinceName: string;
  cityCode: string;
  cityName: string;
  districtCode: string;
  districtName: string;
}

export const REGION_DATA: CascaderOption[] = buildRegionOptions(ROOT_REGION_CODE);

export const normalizeRegionValue = (value: unknown): NormalizedRegionValue | null => {
  const regionPath = findRegionPath(value);

  if (!regionPath) {
    return null;
  }

  return createNormalizedRegionValue(regionPath);
};

export const normalizeRegionCodes = (value: unknown): CascadeValue[] => (
  normalizeRegionValue(value)?.region ?? []
);

export const formatRegionValue = (value: unknown): string => {
  const segments = toLooseRegionSegments(value);
  if (segments.length === 0) {
    return '';
  }

  const normalizedRegion = normalizeRegionValue(segments);
  if (normalizedRegion) {
    return normalizedRegion.regionLabels.join(' · ');
  }

  if (segments.length === 1 && REGION_CODE_PATTERN.test(segments[0] ?? '')) {
    return resolveRegionLabelsBySingleCode(segments[0] ?? '').join(' · ');
  }

  return segments.join(' · ');
};
