import type { BadgeTone } from "../../ui";
import type { ApiError } from "../../services/api/http-client";
import type { PlaceStatus } from "../../services/places/places.types";
import type { TariffType } from "../../services/tariffs/tariffs.types";
import type { DeviceType } from "../../services/zones/zones.types";

export const PLACE_STATUS_LABEL: Record<PlaceStatus, string> = {
    вільно: "Вільно",
    зайнято: "Зайнято",
    бронь: "Бронь",
    ремонт: "Ремонт",
};

export const PLACE_STATUS_TONE: Record<PlaceStatus, BadgeTone> = {
    вільно: "success",
    зайнято: "danger",
    бронь: "warning",
    ремонт: "neutral",
};

export const PLACE_STATUSES = Object.keys(PLACE_STATUS_LABEL) as PlaceStatus[];

//Mirrors `validateStatusTransition` on the backend: from "repair," one can only transition to "available"; from "occupied," one cannot transition to "reserved."
export const allowedPlaceStatuses = (current: PlaceStatus): PlaceStatus[] =>
    PLACE_STATUSES.filter((next) => {
        if (next === current) return true;
        if (current === "ремонт") return next === "вільно";
        if (current === "зайнято") return next !== "бронь";
        return true;
    });

export const DEVICE_TYPES: DeviceType[] = ["PC", "PS", "VR"];

export const TARIFF_TYPE_LABEL: Record<TariffType, string> = {
    HOURLY: "Погодинний",
    PACKAGE_3_PLUS_1: "Пакет 3+1",
    CUSTOM: "Індивідуальний",
};

export const TARIFF_TYPES = Object.keys(TARIFF_TYPE_LABEL) as TariffType[];

const uah = new Intl.NumberFormat("uk-UA", { style: "currency", currency: "UAH" });
export const formatUah = (value: number) => uah.format(value);

const dateTime = new Intl.DateTimeFormat("uk-UA", { dateStyle: "short", timeStyle: "short" });
export const formatDateTime = (iso: string) => dateTime.format(new Date(iso));

export const errorText = (error: unknown): string =>
    (error as Partial<ApiError> | null)?.message ?? "Сталася невідома помилка";
