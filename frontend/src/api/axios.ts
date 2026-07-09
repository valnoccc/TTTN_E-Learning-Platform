import axios, {
  AxiosError,
  AxiosInstance,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from 'axios';

import {
  clearAuthSession,
  dispatchBlockedAccountEvent,
  getErrorMessage,
  isBlockedAccountMessage,
} from '../utils/authBlock';

type ApiClient = Omit<AxiosInstance, 'get' | 'post' | 'put' | 'patch' | 'delete'> & {
  get<T = unknown>(...args: Parameters<AxiosInstance['get']>): Promise<T>;
  post<T = unknown>(...args: Parameters<AxiosInstance['post']>): Promise<T>;
  put<T = unknown>(...args: Parameters<AxiosInstance['put']>): Promise<T>;
  patch<T = unknown>(...args: Parameters<AxiosInstance['patch']>): Promise<T>;
  delete<T = unknown>(...args: Parameters<AxiosInstance['delete']>): Promise<T>;
};

const axiosClient = axios.create({
  // baseURL: 'http://localhost:3000',
  baseURL: import.meta.env.VITE_API_URL || 'https://tttn-e--platform.onrender.com',
}) as ApiClient;

axiosClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('access_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    if (config.data instanceof FormData && config.headers) {
      delete config.headers['Content-Type'];
    }

    return config;
  },
  (error) => Promise.reject(error),
);

axiosClient.interceptors.response.use(
  (response: AxiosResponse) => response.data,
  (error: AxiosError<any>) => {
    const status = error.response?.status;
    const message = getErrorMessage(error);

    if (status === 401) {
      if (isBlockedAccountMessage(message)) {
        clearAuthSession();
        dispatchBlockedAccountEvent(message);
      } else if (!error.config?.url?.includes('/auth/login')) {
        // Token expired or invalid
        clearAuthSession();
      }
    }

    return Promise.reject(error);
  },
);

export default axiosClient;
