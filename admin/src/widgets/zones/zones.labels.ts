import type { BadgeTone } from "../../ui";
import type { ApiError } from "../../services/api/http-client";
import type { PlaceStatus } from "../../services/places/places.types";
import type { TariffType } from "../../services/tariffs/tariffs.types";
import type { DeviceType } from "../../services/zones/zones.types";

export const PLACE_STATUS_LABEL: Record<PlaceStatus, string> = {
    FREE: "Вільно",
    BUSY: "Зайнято",
    BOOKED: "Бронь",
    MAINTENANCE: "Ремонт",
};

export const PLACE_STATUS_TONE: Record<PlaceStatus, BadgeTone> = {
    FREE: "success",
    BUSY: "danger",
    BOOKED: "warning",
    MAINTENANCE: "neutral",
};

export const PLACE_STATUSES = Object.keys(PLACE_STATUS_LABEL) as PlaceStatus[];

export const DEVICE_TYPES: DeviceType[] = ["PC", "PS", "VR"];

export const TARIFF_TYPE_LABEL: Record<TariffType, string> = {
    HOURLY: "Погодинний",
    PACKAGE: "Пакет",
    NIGHT: "Ніч",
    DAY: "День",
    VIP: "VIP",
};

export const TARIFF_TYPES = Object.keys(TARIFF_TYPE_LABEL) as TariffType[];

const uah = new Intl.NumberFormat("uk-UA", { style: "currency", currency: "UAH" });
export const formatUah = (value: number) => uah.format(value);

const dateTime = new Intl.DateTimeFormat("uk-UA", { dateStyle: "short", timeStyle: "short" });
export const formatDateTime = (iso: string) => dateTime.format(new Date(iso));

export const errorText = (error: unknown): string =>
    (error as Partial<ApiError> | null)?.message ?? "Сталася невідома помилка";
