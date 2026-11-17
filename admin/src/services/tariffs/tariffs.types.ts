// DTO згідно CreateTariffDto(backend)
export type TariffType = "HOURLY" | "PACKAGE" | "NIGHT" | "DAY" | "VIP";

export interface Tariff {
    id: string;
    name: string;
    type: TariffType;
    price: number;
    durationMinutes?: number;
    zoneId?: string;
    zoneName?: string;
    isActive?: boolean;
}

export interface CreateTariffInput {
    name: string;
    type: TariffType;
    price: number;
    durationMinutes?: number;
    zoneId?: string;
}

export type UpdateTariffInput = Partial<CreateTariffInput>;
