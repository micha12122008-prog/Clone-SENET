import { NavLink, Outlet } from "react-router";
import { NAV_ITEMS } from "../config/routes";
import { cn } from "../helpers/cn";

export function AdminLayout() {
    return (
        <div className="flex min-h-screen flex-col bg-gray-50 md:flex-row">
            <aside className="border-b border-gray-200 bg-white md:w-60 md:shrink-0 md:border-r md:border-b-0">
                <div className="px-4 py-4 text-lg font-semibold text-gray-900">SENET Admin</div>

                <nav
                    aria-label="Головне меню"
                    className="flex gap-1 overflow-x-auto px-2 pb-2 md:flex-col md:overflow-visible md:pb-4"
                >
                    {NAV_ITEMS.map((item) => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            end={item.path === "/"}
                            className={({ isActive }) =>
                                cn(
                                    "whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                                    "focus-visible:outline-2 focus-visible:outline-blue-600",
                                    isActive
                                        ? "bg-blue-50 text-blue-700"
                                        : "text-gray-700 hover:bg-gray-100 hover:text-gray-900",
                                )
                            }
                        >
                            {item.label}
                        </NavLink>
                    ))}
                </nav>
            </aside>

            <main className="min-w-0 flex-1 p-6">
                <Outlet />
            </main>
        </div>
    );
}
