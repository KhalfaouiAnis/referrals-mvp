import axios, {
  type AxiosError,
  type InternalAxiosRequestConfig,
  type AxiosResponse,
} from "axios";
import qs from "qs";

export const apiClient = axios.create({
  baseURL: "",
  timeout: 15_000,
  headers: { "Content-Type": "application/json" },
  paramsSerializer: (params) => qs.stringify(params, { arrayFormat: "repeat" }),
});

apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem("access_token");
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: AxiosError) => Promise.reject(error),
);

apiClient.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error: AxiosError<{ message: string | string[]; statusCode: number }>) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("access_token");
      // Only redirect if we're not already on /login
      if (!window.location.pathname.startsWith("/login")) {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  },
);

/**
 * Convenience helpers — automatically unwrap the { data: T } envelope
 * added by NestJS Transform Interceptor.
 */
export const api = {
  get: <T>(url: string, params?: object): Promise<T> =>
    apiClient
      .get<{ data: T }>(url, { params })
      .then((r) => r.data?.data ?? (r.data as unknown as T)),

  post: <T>(url: string, data?: unknown): Promise<T> =>
    apiClient
      .post<{ data: T }>(url, data)
      .then((r) => r.data?.data ?? (r.data as unknown as T)),

  patch: <T>(url: string, data?: unknown): Promise<T> =>
    apiClient
      .patch<{ data: T }>(url, data)
      .then((r) => r.data?.data ?? (r.data as unknown as T)),

  delete: <T>(url: string): Promise<T> =>
    apiClient
      .delete<{ data: T }>(url)
      .then((r) => r.data?.data ?? (r.data as unknown as T)),

  upload: <T>(
    url: string,
    formData: FormData,
    onProgress?: (pct: number) => void,
  ): Promise<T> =>
    apiClient
      .post<{ data: T }>(url, formData, {
        headers: { "Content-Type": "multipart/form-data" },
        onUploadProgress: (e) => {
          if (onProgress && e.total) {
            onProgress(Math.round((e.loaded * 100) / e.total));
          }
        },
      })
      .then((r) => r.data?.data ?? (r.data as unknown as T)),
};
