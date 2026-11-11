import type { DashboardSnapshot } from "./dashboard.types";

const NO_DATA = { status: "no-data" } as const;

const dayFormatter = new Intl.DateTimeFormat("uk-UA", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
});

export const DashboardService = {
    /**
     * Тиждень 2: живих цифр немає, тому мережевих запитів немає і вигаданих чисел теж.
     * Не підключати GET /analytics/dashboard-summary: зараз він віддає статичні тестові дані.
     *
     * Тиждень 8: замінити тіло на запит через `http` + getDashboardSummaryUrl()
     * і зібрати з відповіді { status: "ready", value } для кожного віджета.
     * Типи у dashboard.types.ts і самі віджети змінювати не потрібно.
     */
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
