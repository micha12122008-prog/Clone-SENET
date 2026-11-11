import { Navigate, Outlet, useLocation } from "react-router";
import { selectIsAdminSession, useAuthStore } from "../hooks/auth.store";

export function RequireAuth() {
    const isAdmin = useAuthStore(selectIsAdminSession);
    const location = useLocation();

    if (!isAdmin) {
        return <Navigate to="/login" replace state={{ from: location.pathname }} />;
    }

    return <Outlet />;
}
