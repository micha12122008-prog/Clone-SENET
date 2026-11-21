import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ZonesService } from "../../services/zones/zones.service";
import type { CreateZoneInput, UpdateZoneInput } from "../../services/zones/zones.types";
import { queryKeys } from "../queryKeys";

export function useZones() {
    return useQuery({
        queryKey: queryKeys.zones.list(),
        queryFn: () => ZonesService.list(),
        staleTime: 30_000,
    });
}


//Locations and rates carry the name/color of their respective zone (`zoneName`, `zoneColor`), and the list of zones
//on the server can change entirely. Therefore, any change to the zones triggers a reload of all three lists;
//otherwise, the "Locations" and "Rates" tabs would display a cache containing an outdated state of the zones
function useInvalidateZoneDependants() {
    const queryClient = useQueryClient();
    return () =>
        Promise.all([
            queryClient.invalidateQueries({ queryKey: queryKeys.zones.all }),
            queryClient.invalidateQueries({ queryKey: queryKeys.places.all }),
            queryClient.invalidateQueries({ queryKey: queryKeys.tariffs.all }),
        ]);
}

export function useCreateZone() {
    const invalidate = useInvalidateZoneDependants();
    return useMutation({
        mutationFn: (input: CreateZoneInput) => ZonesService.create(input),
        onSuccess: invalidate,
    });
}

export function useUpdateZone() {
    const invalidate = useInvalidateZoneDependants();
    return useMutation({
        mutationFn: ({ id, input }: { id: string; input: UpdateZoneInput }) =>
            ZonesService.update(id, input),
        onSuccess: invalidate,
    });
}

export function useDeleteZone() {
    const invalidate = useInvalidateZoneDependants();
    return useMutation({
        mutationFn: (id: string) => ZonesService.remove(id),
        // along with the zone, its locations disappear, and the tariffs lose their connection
        onSuccess: invalidate,
    });
}
