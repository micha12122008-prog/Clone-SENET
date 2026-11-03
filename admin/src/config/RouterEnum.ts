export const RouterEnum = {
    MAIN: "/",
    DASHBOARD: '/dashboard/',
    BOOKINGS: '/booking',
    ZONES: '/zones',
    BAR: '/bar',
    TOURNAMENTS: '/tournaments',
    CLIENTS: '/clients',
    ANALYTICS: '/analytics',
}

export type RouterEnum = typeof RouterEnum[keyof typeof RouterEnum];