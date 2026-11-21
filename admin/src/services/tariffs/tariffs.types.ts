//Corresponds to enum TariffType schema.prisma(backend)
export type TariffType = "HOURLY" | "PACKAGE_3_PLUS_1" | "CUSTOM";

export interface Tariff {
    id: string;
    name: string;
    description?: string | null;
    type: TariffType;
    price: number;
    durationMinutes: number;
    zoneId: string | null;
    //The backend applies the "General Club Tariff" both for a tariff without a zone and when no zone is found
    zoneName?: string;
}

export interface CreateTariffInput {
    name: string;
    type: TariffType;
    price: number;
    durationMinutes?: number;
    zoneId?: string;
    description?: string;
}

//Setting `zoneId` to `null` detaches the tariff from the zone (`UpdateTariffDto` accepts this).
export type UpdateTariffInput = Partial<Omit<CreateTariffInput, "zoneId">> & {
    zoneId?: string | null;
};
