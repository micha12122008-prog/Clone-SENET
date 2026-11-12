import type { DashboardSnapshot } from "./dashboard.types";

const NO_DATA = { status: "no-data" } as const;

const dayFormatter = new Intl.DateTimeFormat("uk-UA", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
});

export const DashboardService = {
    async getSnapshot(): Promise<DashboardSnapshot> {
        return {
            dayLabel: dayFormatter.format(new Date()),
            occupancy: NO_DATA,
            activeSessions: NO_DATA,
            shiftRevenue: NO_DATA,
            notifications: NO_DATA,
        };
    },
};
