import axios, { type AxiosError } from "axios";
import { tokenStorage } from "../auth/token-storage.ts";

export interface ApiError {
  status: number | null;
  message: string;
  data?: unknown;
}

let unauthorizedHandler: (() => void) | null = null;

export const setUnauthorizedHandler = (handler: (() => void) | null) => {
  unauthorizedHandler = handler;
};

export const http = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: { "Content-Type": "application/json" },
  timeout: 15_000,
});

http.interceptors.request.use((config) => {
  const token = tokenStorage.getAccess();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

http.interceptors.response.use(
  (response) => response,
  (error: AxiosError<{ message?: string }>) => {
    const status = error.response?.status ?? null;

    if (status === 401) {
      tokenStorage.clear();
      unauthorizedHandler?.();
    }

    const apiError: ApiError = {
      status,
      message: error.response?.data?.message ?? error.message,
      data: error.response?.data,
    };
    return Promise.reject(apiError);
  },
);
