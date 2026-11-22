import type { PlacesFilter } from "../services/places/places.types";

/** Єдине місце, де складаються ключі кешу: так інвалідація не розходиться з запитами. */
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
};
