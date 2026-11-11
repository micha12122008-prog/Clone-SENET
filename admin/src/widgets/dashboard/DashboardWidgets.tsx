import { Button } from "../../ui";
import { ActiveSessionsWidget } from "./ActiveSessionsWidget";
import { NotificationsWidget } from "./NotificationsWidget";
import { OccupancyWidget } from "./OccupancyWidget";
import { ShiftRevenueWidget } from "./ShiftRevenueWidget";
import { useDashboardSnapshot } from "./useDashboardSnapshot";

export function DashboardWidgets() {
    const { data, isError, refetch } = useDashboardSnapshot();

    if (isError) {
        return (
            <div role="alert" className="flex items-center justify-between gap-4 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
                Не вдалося завантажити показники.
                <Button variant="secondary" size="sm" onClick={() => void refetch()}>
                    Спробувати знову
                </Button>
            </div>
        );
    }

    return (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <OccupancyWidget data={data?.occupancy} />
            <ActiveSessionsWidget data={data?.activeSessions} />
            <ShiftRevenueWidget data={data?.shiftRevenue} dayLabel={data?.dayLabel} />
            <NotificationsWidget data={data?.notifications} />
        </div>
    );
}
