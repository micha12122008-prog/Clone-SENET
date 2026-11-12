const ACCESS_KEY = "super-secret";
const ROLE_KEY = "super-secret-role";

export type UserRole = "admin" | "client";

//localStorage => zustand-persist,
export const tokenStorage = {
  getAccess: () => localStorage.getItem(ACCESS_KEY),
  setAccess: (token: string) => localStorage.setItem(ACCESS_KEY, token),
  getRole: (): UserRole | null => {
    const value = localStorage.getItem(ROLE_KEY);
    return value === "admin" || value === "client" ? value : null;
  },
  setRole: (role: UserRole) => localStorage.setItem(ROLE_KEY, role),
  clear: () => {
    localStorage.removeItem(ACCESS_KEY);
    localStorage.removeItem(ROLE_KEY);
  },
};
