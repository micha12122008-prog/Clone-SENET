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

export function useCreateZone() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (input: CreateZoneInput) => ZonesService.create(input),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.zones.all }),
    });
}

export function useUpdateZone() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, input }: { id: string; input: UpdateZoneInput }) =>
            ZonesService.update(id, input),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.zones.all }),
    });
}

export function useDeleteZone() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => ZonesService.remove(id),
        onSuccess: () =>
            // разом із зоною зникають її місця й тарифи
            Promise.all([
                queryClient.invalidateQueries({ queryKey: queryKeys.zones.all }),
                queryClient.invalidateQueries({ queryKey: queryKeys.places.all }),
                queryClient.invalidateQueries({ queryKey: queryKeys.tariffs.all }),
            ]),
    });
}
