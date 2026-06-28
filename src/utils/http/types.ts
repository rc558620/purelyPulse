import type { AxiosError, AxiosRequestConfig, AxiosResponse, Method } from 'axios';

export interface HttpBusinessEnvelope<T> {
  code?: number | string;
  message?: string;
  msg?: string;
  success?: boolean;
  data?: T;
}

export interface HttpClientRuntimeConfig {
  getAccessToken?: () => string | null | undefined;
  /** 获取 CSRF Token，用于写入 X-CSRF-Token 请求头。 */
  getCsrfToken?: () => string | null | undefined;
  onUnauthorized?: (error: ApiError) => void;
  onError?: (error: ApiError) => void;
}

export interface HttpRequestConfig<D = unknown> extends AxiosRequestConfig<D> {
  skipAuth?: boolean;
  skipGlobalErrorHandler?: boolean;
  skipUnauthorizedHandler?: boolean;
  errorMessage?: string;
}

export interface HttpRequestOptions<D = unknown> extends Omit<HttpRequestConfig<D>, 'url' | 'method' | 'data' | 'params'> {
  data?: D;
  params?: HttpRequestConfig<D>['params'];
}

export interface HttpErrorContext {
  config?: HttpRequestConfig;
  response?: AxiosResponse;
  axiosError?: AxiosError;
}

export class ApiError extends Error {
  readonly statusCode?: number;
  readonly businessCode?: number | string;
  readonly response?: AxiosResponse;
  readonly cause?: unknown;

  constructor(message: string, options: {
    statusCode?: number;
    businessCode?: number | string;
    response?: AxiosResponse;
    cause?: unknown;
  } = {}) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = options.statusCode;
    this.businessCode = options.businessCode;
    this.response = options.response;
    this.cause = options.cause;
  }
}

export interface HttpClientContract {
  request<T = unknown, D = unknown>(config: HttpRequestConfig<D>): Promise<T>;
  get<T = unknown>(url: string, config?: HttpRequestOptions): Promise<T>;
  delete<T = unknown>(url: string, config?: HttpRequestOptions): Promise<T>;
  post<T = unknown, D = unknown>(url: string, data?: D, config?: HttpRequestOptions<D>): Promise<T>;
  put<T = unknown, D = unknown>(url: string, data?: D, config?: HttpRequestOptions<D>): Promise<T>;
  patch<T = unknown, D = unknown>(url: string, data?: D, config?: HttpRequestOptions<D>): Promise<T>;
  upload<T = unknown>(url: string, data: FormData, config?: HttpRequestOptions<FormData>): Promise<T>;
}

export type HttpMethodWithBody = Extract<Method, 'post' | 'put' | 'patch'>;
