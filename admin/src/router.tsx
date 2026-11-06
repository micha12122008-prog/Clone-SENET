import { createBrowserRouter } from "react-router";
import { AdminLayout } from "./layouts/AdminLayout";
import { DashboardPage } from "./screens/DashboardPage";
import { BookingsPage } from "./screens/BookingsPage";
import { ZonesPage } from "./screens/ZonesPage";
import { BarPage } from "./screens/BarPage";
import { TournamentsPage } from "./screens/TournamentsPage";
import { ClientsPage } from "./screens/ClientsPage";
import { AnalyticsPage } from "./screens/AnalyticsPage";
import { NotFoundPage } from "./screens/NotFoundPage";

export const router = createBrowserRouter([
    {
        element: <AdminLayout />,
        children: [
            { path: "/", element: <DashboardPage /> },
            { path: "/bookings", element: <BookingsPage /> },
            { path: "/zones", element: <ZonesPage /> },
            { path: "/bar", element: <BarPage /> },
            { path: "/tournaments", element: <TournamentsPage /> },
            { path: "/clients", element: <ClientsPage /> },
            { path: "/analytics", element: <AnalyticsPage /> },
            { path: "*", element: <NotFoundPage /> },
        ],
    },
]);
