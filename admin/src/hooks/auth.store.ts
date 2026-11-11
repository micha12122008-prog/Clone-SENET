import { create } from "zustand";
import type { ApiError } from "../services/api/http-client";
import { AuthService } from "../services/auth/auth.service";
import { tokenStorage, type UserRole } from "../services/auth/token-storage";

interface AuthState {
    token: string | null;
    role: UserRole | null;
    /** Вхід в адмінку. Токен зберігається лише для ролі admin. */
    signIn: (login: string, password: string) => Promise<void>;
    logout: () => void;
}

export const useAuthStore = create<AuthState>()((set) => ({
    token: tokenStorage.getAccess(),
    role: tokenStorage.getRole(),

    signIn: async (login, password) => {
        const session = await AuthService.login(login, password);

        if (session.role !== "admin") {
            const error: ApiError = {
                status: 403,
                message: "Цей обліковий запис не має доступу до адмінки",
            };
            throw error;
        }

        tokenStorage.setAccess(session.accessToken);
        tokenStorage.setRole(session.role);
        set({ token: session.accessToken, role: session.role });
    },

    logout: () => {
        tokenStorage.clear();
        set({ token: null, role: null });
    },
}));

export const selectIsAdminSession = (state: AuthState) =>
    state.token !== null && state.role === "admin";
