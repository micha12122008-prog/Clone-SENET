export type DeviceType = "PC" | "PS" | "VR";

export interface Zone {
    id: string;
    name: string;
    description?: string;
    baseHourlyRate: number;
    colorHex: string;
    isActive: boolean;
    //GET /zones
    totalComputers?: number;
    availableComputers?: number;
    //
    deviceType?: DeviceType;// Схема БД його має, але відповідь API- ні
}

export interface CreateZoneInput {
    name: string;
    description?: string;
    baseHourlyRate: number;
    colorHex: string;
    deviceType?: DeviceType;
}

// UpdateZoneDto(backend) не приймає description і deviceType
export interface UpdateZoneInput {
    name?: string;
    baseHourlyRate?: number;
    colorHex?: string;
    isActive?: boolean;
}
