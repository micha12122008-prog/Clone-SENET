import { postLoginUrl } from "../../config/api.config";
import { http, type ApiError } from "../api/http-client";
import type { UserRole } from "./token-storage";

interface Envelope<T> {
    success: boolean;
    data: T;//{ success, statusCode, data, timestamp }
}

interface LoginPayload {
    accessToken?: string;
    user?: { role?: string };
}

export interface LoginSession {
    accessToken: string;
    role: UserRole;
}

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
