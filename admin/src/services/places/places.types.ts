//week 1: enum
export type PlaceStatus = "FREE" | "BUSY" | "BOOKED" | "MAINTENANCE";

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
    status: PlaceStatus;
    specs?: PlaceSpecs;
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
