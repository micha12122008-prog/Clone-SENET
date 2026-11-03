import {Route, type RouteObject, Routes} from "react-router"
import {RouterEnum} from "./config/RouterEnum.ts";
import Providers from "./providers/Providers.tsx";
import {NotFoundPage} from "./screens/NotFoundPage.tsx";
import {DashboardPage} from "./screens/DashboardPage.tsx";
import {BookingsPage} from "./screens/BookingsPage.tsx";
import {ZonesPage} from "./screens/ZonesPage.tsx";
import {TournamentsPage} from "./screens/TournamentsPage.tsx";
import {ClientsPage} from "./screens/ClientsPage.tsx";
import {AnalyticsPage} from "./screens/AnalyticsPage.tsx";
import {MainPage} from "./screens/Main.tsx";

export default function App() {

  const routes: Array<RouteObject> = [
    {path: RouterEnum.MAIN, element: <MainPage/>},
    {path: RouterEnum.DASHBOARD, element: <DashboardPage/>},
    {path: RouterEnum.BOOKINGS, element: <BookingsPage/>},
    {path: RouterEnum.ZONES, element: <ZonesPage/>},
    {path: RouterEnum.TOURNAMENTS, element: <TournamentsPage/>},
    {path: RouterEnum.CLIENTS, element: <ClientsPage/>},
    {path: RouterEnum.ANALYTICS, element: <AnalyticsPage/>},
    {path: RouterEnum.BAR, element: <AnalyticsPage/>},
    {path: "*", element: <NotFoundPage/>},
  ]

  return (
      <Providers>
        <Routes>
          {routes.map((route, index) => (
              <Route key={index} path={route.path} element={route.element}/>
          ))}
        </Routes>
      </Providers>
  )
}