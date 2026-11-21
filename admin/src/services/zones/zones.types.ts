export type DeviceType = "PC" | "PS" | "VR";

export interface Zone {
    id: string;
    name: string;
    description?: string | null;
    deviceType: DeviceType;
    baseHourlyRate: number;
    colorHex: string;
    totalComputers?: number;
    availableComputers?: number;
}

export interface CreateZoneInput {
    name: string;
    description?: string;
    baseHourlyRate: number;
    colorHex: string;
    deviceType?: DeviceType;
}

//UpdateZoneDto(backend) = PartialType(CreateZoneDto)
export type UpdateZoneInput = Partial<CreateZoneInput>;
