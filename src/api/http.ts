import axios, { AxiosError } from 'axios';

export const TOKEN_KEY = 'library_access_token';
export const USER_KEY = 'library_user';
export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';

// Do not force Content-Type globally: the browser/Axios must add the multipart
// boundary for FormData uploads. JSON payloads are serialized by Axios itself.
export const http = axios.create({
  baseURL: API_URL,
  timeout: 15000,
  headers: { Accept: 'application/json' },
});

http.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

http.interceptors.response.use(
  (response) => response,
  (error: AxiosError<{ message?: string; error?: string }>) => {
    const hadSessionToken = Boolean(localStorage.getItem(TOKEN_KEY));
    const isLoginRequest = Boolean(error.config?.url?.includes('/auth/login'));
    if (error.response?.status === 401 && hadSessionToken && !isLoginRequest) {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
      window.dispatchEvent(new CustomEvent('library:session-expired'));
    }
    const message =
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.message ||
      'Не удалось выполнить запрос';
    return Promise.reject(new Error(message));
  },
);
