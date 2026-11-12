/** Стан одного віджета: або даних немає, або є значення від API. */
export type WidgetData<T> = { status: "no-data" } | { status: "ready"; value: T };

export interface OccupancyValue {
    percent: number;
    busyPlaces: number;
    totalPlaces: number;
}

export interface ActiveSessionsValue {
    count: number;
}

export interface ShiftRevenueValue {
    amount: number;
}

export interface NotificationItem {
    id: string;
    title: string;
}

export interface NotificationsValue {
    unread: number;
    items: NotificationItem[];
}

export interface DashboardSnapshot {
    dayLabel: string;
    occupancy: WidgetData<OccupancyValue>;
    activeSessions: WidgetData<ActiveSessionsValue>;
    shiftRevenue: WidgetData<ShiftRevenueValue>;
    notifications: WidgetData<NotificationsValue>;
}
