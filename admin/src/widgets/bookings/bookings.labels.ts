import type { BadgeTone } from "../../ui";
import type { BookingStatus } from "../../services/bookings/bookings.types";
import type { Client } from "../../services/clients/clients.types";
import type { Tariff } from "../../services/tariffs/tariffs.types";
export { errorText, formatDateTime, formatUah } from "../zones/zones.labels";//Formatters and errorText are already in the zones — no need to duplicate

export const BOOKING_STATUS_LABEL: Record<BookingStatus, string> = {
    HOLD: "Утримання",
    CONFIRMED: "Підтверджено",
    CANCELLED: "Скасовано",
    COMPLETED: "Завершено",
};

export const BOOKING_STATUS_TONE: Record<BookingStatus, BadgeTone> = {
    HOLD: "warning",
    CONFIRMED: "success",
    CANCELLED: "neutral",
    COMPLETED: "info",
};

export const BOOKING_STATUSES = Object.keys(BOOKING_STATUS_LABEL) as BookingStatus[];

//Session of the week 4: duration of 1, 2, or 3 hours; "3+1" package — a separate rate (4 hours, pay for 3)
export const DURATION_OPTIONS = [1, 2, 3] as const;
export const PACKAGE_SLOT_HOURS = 4;
export const PACKAGE_PAID_HOURS = 3;

export const isPackageTariff = (tariff: Tariff) => tariff.type === "PACKAGE_3_PLUS_1";

//Parser: value of <input type="datetime-local"> ("2026-11-25T18:00", local time) -> ISO 8601 for API
export const localInputToIso = (value: string): string => new Date(value).toISOString();

//Start of the next full hour for the default value, in datetime-local format
export function nextHourLocalInput(): string {
    const date = new Date();
    date.setMinutes(0, 0, 0);
    date.setHours(date.getHours() + 1);
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:00`;
}

//Forecast for the hourly rate: price per hour × hours. There is no forecast for the 3+1 package — the amount is calculated by the backend.
export function hourlyEstimate(tariff: Tariff, hours: number): number {
    return (tariff.price / (tariff.durationMinutes / 60)) * hours;
}

export const clientLabel = (client: Client): string => {
    const fullName = [client.firstName, client.lastName].filter(Boolean).join(" ");
    return [fullName || client.username, client.phone].join(" · ");
};

//The backend searches for an exact match with the user's phone number (in the seed data — "+380993334455"), so its requered to format the input accordingly.
export function normalizePhone(raw: string): string {
    const digits = raw.replace(/[^\d+]/g, "");
    if (digits.startsWith("+")) return digits;
    if (digits.startsWith("380")) return `+${digits}`;
    if (digits.startsWith("0")) return `+38${digits}`;
    return digits;
}
