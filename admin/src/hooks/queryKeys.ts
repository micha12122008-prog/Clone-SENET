import type { BookingsFilter, CheckInLookup } from "../services/bookings/bookings.types";
import type { PlacesFilter } from "../services/places/places.types";

//The only place where cache keys are constructed—this ensures that invalidation stays in sync with requests
export const queryKeys = {
    zones: {
        all: ["zones"] as const,
        list: () => ["zones", "list"] as const,
    },
    places: {
        all: ["places"] as const,
        list: (filter: PlacesFilter) => ["places", "list", filter] as const,
    },
    repairs: {
        all: ["repairs"] as const,
        byPlace: (placeId: string) => ["repairs", placeId] as const,
    },
    tariffs: {
        all: ["tariffs"] as const,
        list: () => ["tariffs", "list"] as const,
    },
    bookings: {
        all: ["bookings"] as const,
        list: (filter: BookingsFilter) => ["bookings", "list", filter] as const,
        checkIn: (lookup: CheckInLookup | null) => ["bookings", "check-in", lookup] as const,
    },
    clients: {
        all: ["clients"] as const,
        search: (search: string) => ["clients", "search", search] as const,
    },
};
