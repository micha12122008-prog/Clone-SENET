
import { NavLink, Outlet } from "react-router";
import { NAV_ITEMS } from "../config/routes";
import { cn } from "../helpers/cn";
import "./AdminLayout.css";

export function AdminLayout() {
    return (
        <div className="admin-layout">
            <aside className="admin-sidebar">
                <div className="admin-logo">
                    SENET Admin
                </div>

                <nav aria-label="Головне меню" className="admin-navigation">
                    {NAV_ITEMS.map((item) => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            end={item.path === "/"}
                            className={({ isActive }) =>
                                cn(
                                    "admin-nav-link",
                                    isActive
                                        ? "admin-nav-link-active"
                                        : "admin-nav-link-inactive"
                                )
                            }
                        >
                            {item.label}
                        </NavLink>
                    ))}
                </nav>
            </aside>

            <main className="admin-content">
                <Outlet />
            </main>
        </div>
    );
}
