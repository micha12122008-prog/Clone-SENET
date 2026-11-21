import type { DeviceType } from "../zones/zones.types";

//The backend sends and receives the location status using Ukrainian values ​​(an enum from Week 1)
export type PlaceStatus = "вільно" | "зайнято" | "бронь" | "ремонт";

export interface PlaceSpecs {
    cpu?: string;
    gpu?: string;
    ram?: string;
    monitor?: string;
}

export interface Place {
    id: string;
    number: number;
    name: string;
    zoneId: string;
    zoneName?: string;
    zoneColor?: string;
    deviceType?: DeviceType;
    status: PlaceStatus;
    specs?: PlaceSpecs | null;
}

export interface PlacesFilter {
    zoneId?: string;
    status?: PlaceStatus;
}

export interface CreatePlaceInput {
    number: number;
    name: string;
    zoneId: string;
    specs?: PlaceSpecs;
}

export interface SetPlaceStatusInput {
    status: PlaceStatus;
    description?: string;//For the "repair" status, the backend automatically creates an entry in the repair log with this description
}
