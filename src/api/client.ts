import axios from 'axios';
import type { AxiosInstance, AxiosRequestConfig } from 'axios';

const BASE_URL = import.meta.env.DEV ? '/dev' : 'https://ads.trio.am/dev';

/** Returns the base URL for a creative's banner files: {base}/banners/{id}/{lang}/
 *  Uses a relative path in dev so the Vite proxy handles the request.
 */
export function getBannersUrl(id: string, lang: string): string {
  const base = import.meta.env.DEV ? '/dev' : 'https://ads.trio.am/dev';
  return `${base}/banners/${id}/${lang.toLowerCase()}/`;
}

const apiClient: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
});

apiClient.interceptors.request.use((config) => {
  config.headers['X-Origin'] = 'ads.trio.am';
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;
    const isLoginEndpoint = error?.config?.url === '/login';
    const isLoginPage = window.location.pathname === '/login';
    if ((status === 401 || status === 502) && !isLoginEndpoint && !isLoginPage) {
      window.location.href = '/login';
    }
    return Promise.reject(error);
  },
);

// Normalize errors
export interface ApiError {
  status?: number;
  title: string;
  message: string;
  details?: unknown;
}

export function normalizeError(err: unknown): ApiError {
  if (axios.isAxiosError(err)) {
    const status = err.response?.status;
    const data = err.response?.data;
    const message =
      (typeof data === 'object' && data !== null && 'message' in data
        ? String((data as Record<string, unknown>).message)
        : null) ??
      err.message ??
      'Unknown error';
    return {
      status,
      title: status ? `Error ${status}` : 'Network Error',
      message,
      details: data,
    };
  }
  if (err instanceof Error) {
    return { title: 'Error', message: err.message };
  }
  return { title: 'Error', message: String(err) };
}

export async function get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
  const res = await apiClient.get<T>(url, config);
  return res.data;
}

export async function post<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
  const res = await apiClient.post<T>(url, data, config);
  return res.data;
}

export async function put<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
  const res = await apiClient.put<T>(url, data, config);
  return res.data;
}

export async function patch<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
  const res = await apiClient.patch<T>(url, data, config);
  return res.data;
}

export default apiClient;
