import { postLoginUrl } from "../../config/api.config";
import { http, type ApiError } from "../api/http-client";
import type { UserRole } from "./token-storage";

/** Обгортка відповідей бекенду: { success, statusCode, data, timestamp }. */
interface Envelope<T> {
    success: boolean;
    data: T;
}

interface LoginPayload {
    accessToken?: string;
    user?: { role?: string };
}

export interface LoginSession {
    accessToken: string;
    role: UserRole;
}

/** Бекенд повертає ADMIN / CLIENT, у ТЗ ролі пишуться малими літерами. Усе, що не admin, не має доступу. */
const toRole = (raw: string | undefined): UserRole =>
    raw?.toLowerCase() === "admin" ? "admin" : "client";

export const AuthService = {
    async login(login: string, password: string): Promise<LoginSession> {
        const response = await http.post<Envelope<LoginPayload> | undefined>(postLoginUrl(), {
            login,
            password,
        });
        const payload = response.data?.data;

        if (!payload?.accessToken) {
            const error: ApiError = {
                status: response.status,
                message: "Сервер повернув відповідь у невідомому форматі",
            };
            throw error;
        }

        return { accessToken: payload.accessToken, role: toRole(payload.user?.role) };
    },
};
