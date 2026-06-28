import axios, { AxiosError, AxiosHeaders, type AxiosResponse, type InternalAxiosRequestConfig } from 'axios';
import { showToast } from '@components/ui/feedback/Toast';
import { DEFAULT_HTTP_ERROR_MESSAGE, DEFAULT_UNAUTHORIZED_MESSAGE, HTTP_CONFIG } from './config';
import type {
  HttpBusinessEnvelope,
  HttpClientContract,
  HttpClientRuntimeConfig,
  HttpErrorContext,
  HttpMethodWithBody,
  HttpRequestConfig,
  HttpRequestOptions,
} from './types';
import { ApiError as HttpApiError } from './types';

const runtimeConfig: HttpClientRuntimeConfig = {};

const createRequestId = (): string => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  return `req_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
};

const shouldAttachJsonContentType = (config: InternalAxiosRequestConfig): boolean => {
  if (!config.data) {
    return false;
  }

  if (typeof FormData !== 'undefined' && config.data instanceof FormData) {
    return false;
  }

  const method = config.method?.toLowerCase();
  return method === 'post' || method === 'put' || method === 'patch';
};

const readEnvelopeMessage = (payload: HttpBusinessEnvelope<unknown>): string | undefined => payload.message ?? payload.msg;

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const pickMessageLikeField = (payload: Record<string, unknown>): string | undefined => {
  const candidates = [payload.message, payload.msg, payload.error];

  for (const candidate of candidates) {
    if (typeof candidate === 'string' && candidate.trim()) {
      return candidate.trim();
    }

    if (Array.isArray(candidate)) {
      const firstMessage = candidate.find(
        (item): item is string => typeof item === 'string' && item.trim().length > 0,
      );
      if (firstMessage) {
        return firstMessage.trim();
      }
    }
  }

  return undefined;
};

const isBusinessEnvelope = <T>(payload: unknown): payload is HttpBusinessEnvelope<T> => {
  if (!isPlainObject(payload)) {
    return false;
  }

  if ('success' in payload) {
    return true;
  }

  if ('data' in payload) {
    return 'code' in payload || 'message' in payload || 'msg' in payload;
  }

  if ('code' in payload) {
    return 'message' in payload || 'msg' in payload;
  }

  return false;
};

const isSuccessEnvelope = (payload: HttpBusinessEnvelope<unknown>): boolean => {
  if (typeof payload.success === 'boolean') {
    return payload.success;
  }

  if (payload.code === undefined) {
    return true;
  }

  return HTTP_CONFIG.successCodes.has(payload.code);
};

const resolveErrorMessage = (error: unknown, fallbackMessage?: string): string => {
  if (error instanceof HttpApiError) {
    return error.message;
  }

  if (axios.isAxiosError(error)) {
    const payload = error.response?.data;
    if (isBusinessEnvelope(payload)) {
      return readEnvelopeMessage(payload) ?? fallbackMessage ?? DEFAULT_HTTP_ERROR_MESSAGE;
    }

    if (isPlainObject(payload)) {
      return pickMessageLikeField(payload) ?? fallbackMessage ?? DEFAULT_HTTP_ERROR_MESSAGE;
    }

    if (typeof payload === 'string' && payload.trim()) {
      return payload;
    }

    if (error.code === AxiosError.ERR_NETWORK) {
      return '网络异常，请检查网络连接';
    }

    if (error.code === AxiosError.ECONNABORTED) {
      return '请求超时，请稍后重试';
    }
  }

  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  return fallbackMessage ?? DEFAULT_HTTP_ERROR_MESSAGE;
};

const emitError = (error: HttpApiError, context: HttpErrorContext): void => {
  const config = context.config;

  if (error.statusCode === 401 && error.message === DEFAULT_HTTP_ERROR_MESSAGE) {
    error.message = DEFAULT_UNAUTHORIZED_MESSAGE;
  }

  if (!config?.skipGlobalErrorHandler) {
    runtimeConfig.onError?.(error);
    if (!runtimeConfig.onError) {
      showToast({ type: 'error', message: error.message });
    }
  }

  if (error.statusCode === 401 && !config?.skipUnauthorizedHandler) {
    runtimeConfig.onUnauthorized?.(error);
  }
};

const unwrapBusinessData = <T>(payload: unknown, response: AxiosResponse, config: HttpRequestConfig): T => {
  if (!isBusinessEnvelope<T>(payload)) {
    return payload as T;
  }

  if (isSuccessEnvelope(payload)) {
    return (payload.data ?? payload) as T;
  }

  const apiError = new HttpApiError(readEnvelopeMessage(payload) ?? config.errorMessage ?? DEFAULT_HTTP_ERROR_MESSAGE, {
    statusCode: response.status,
    businessCode: payload.code,
    response,
  });

  emitError(apiError, { config, response });
  throw apiError;
};

const normalizeHttpError = (error: unknown, config?: HttpRequestConfig): HttpApiError => {
  if (error instanceof HttpApiError) {
    return error;
  }

  if (axios.isAxiosError(error)) {
    const normalized = new HttpApiError(resolveErrorMessage(error, config?.errorMessage), {
      statusCode: error.response?.status,
      response: error.response,
      cause: error,
    });

    emitError(normalized, { config, response: error.response, axiosError: error });
    return normalized;
  }

  const normalized = new HttpApiError(resolveErrorMessage(error, config?.errorMessage), {
    cause: error,
  });

  emitError(normalized, { config });
  return normalized;
};

export const configureHttpClient = (config: HttpClientRuntimeConfig): void => {
  Object.assign(runtimeConfig, config);
};

export const httpClient = axios.create({
  baseURL: HTTP_CONFIG.baseURL,
  timeout: HTTP_CONFIG.timeout,
  // 开启 withCredentials：浏览器自动携带 HttpOnly Cookie（含 accessToken）
  withCredentials: true,
  headers: {
    Accept: 'application/json',
    'X-Requested-With': 'XMLHttpRequest',
  },
});

httpClient.interceptors.request.use((config) => {
  const requestConfig = config as InternalAxiosRequestConfig & HttpRequestConfig;
  const headers = AxiosHeaders.from(requestConfig.headers);
  headers.set('X-Request-Id', headers.get('X-Request-Id') ?? createRequestId());

  if (shouldAttachJsonContentType(requestConfig) && !headers.get('Content-Type')) {
    headers.set('Content-Type', 'application/json;charset=UTF-8');
  }

  // Token 认证：优先使用 HttpOnly Cookie（withCredentials），
  // 仅当 runtimeConfig 显式提供 getAccessToken 时才走 Authorization header（兼容旧模式）
  if (!requestConfig.skipAuth && !headers.get('Authorization')) {
    const token = runtimeConfig.getAccessToken?.();
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
  }

  // CSRF Token：对有请求体的方法自动注入 X-CSRF-Token
  const method = requestConfig.method?.toLowerCase();
  if ((method === 'post' || method === 'put' || method === 'patch' || method === 'delete') && !headers.get('X-CSRF-Token')) {
    const csrfToken = runtimeConfig.getCsrfToken?.();
    if (csrfToken) {
      headers.set('X-CSRF-Token', csrfToken);
    }
  }

  requestConfig.headers = headers;
  return requestConfig;
});

httpClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const config = error.config as HttpRequestConfig | undefined;
    return Promise.reject(normalizeHttpError(error, config));
  },
);

const request = async <T = unknown, D = unknown>(config: HttpRequestConfig<D>): Promise<T> => {
  try {
    const response = await httpClient.request<unknown, AxiosResponse<unknown>, D>(config);
    return unwrapBusinessData<T>(response.data, response, config);
  } catch (error) {
    throw normalizeHttpError(error, config);
  }
};

const requestWithBody = <T = unknown, D = unknown>(
  method: HttpMethodWithBody,
  url: string,
  data?: D,
  config?: HttpRequestOptions<D>,
): Promise<T> => request<T, D>({
  ...config,
  method,
  url,
  data,
});

export const createKeyedInFlightRequest = <Args extends readonly unknown[], Result>(
  resolveKey: (...args: Args) => string,
  requestFactory: (...args: Args) => Promise<Result>,
): ((...args: Args) => Promise<Result>) => {
  const pendingRequests = new Map<string, Promise<Result>>();

  return (...args: Args): Promise<Result> => {
    const requestKey = resolveKey(...args);
    const pendingRequest = pendingRequests.get(requestKey);
    if (pendingRequest) {
      return pendingRequest;
    }

    const request = requestFactory(...args).finally(() => {
      pendingRequests.delete(requestKey);
    });

    pendingRequests.set(requestKey, request);
    return request;
  };
};

export const createSingletonInFlightRequest = <Args extends readonly unknown[], Result>(
  requestFactory: (...args: Args) => Promise<Result>,
): ((...args: Args) => Promise<Result>) => createKeyedInFlightRequest(
  () => '__default__',
  requestFactory,
);

export const http: HttpClientContract = {
  request,
  get: <T = unknown>(url: string, config?: HttpRequestOptions) =>
    request<T>({
      ...config,
      method: 'get',
      url,
    }),
  delete: <T = unknown>(url: string, config?: HttpRequestOptions) =>
    request<T>({
      ...config,
      method: 'delete',
      url,
    }),
  post: <T = unknown, D = unknown>(url: string, data?: D, config?: HttpRequestOptions<D>) =>
    requestWithBody<T, D>('post', url, data, config),
  put: <T = unknown, D = unknown>(url: string, data?: D, config?: HttpRequestOptions<D>) =>
    requestWithBody<T, D>('put', url, data, config),
  patch: <T = unknown, D = unknown>(url: string, data?: D, config?: HttpRequestOptions<D>) =>
    requestWithBody<T, D>('patch', url, data, config),
  upload: <T = unknown>(url: string, data: FormData, config?: HttpRequestOptions<FormData>) =>
    request<T, FormData>({
      ...config,
      headers: {
        ...config?.headers,
        'Content-Type': 'multipart/form-data',
      },
      method: 'post',
      url,
      data,
    }),
};

export { HttpApiError as ApiError };
