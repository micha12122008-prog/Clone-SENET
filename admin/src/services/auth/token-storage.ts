const ACCESS_KEY = "super-secret";

//localStorage => zustand-persist,
export const tokenStorage = {
  getAccess: () => localStorage.getItem(ACCESS_KEY),
  setAccess: (token: string) => localStorage.setItem(ACCESS_KEY, token),
  clear: () => localStorage.removeItem(ACCESS_KEY),
};
