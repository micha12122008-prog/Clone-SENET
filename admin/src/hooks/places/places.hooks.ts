import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { PlacesService } from "../../services/places/places.service";
import type { CreatePlaceInput, PlaceStatus, PlacesFilter } from "../../services/places/places.types";
import { queryKeys } from "../queryKeys";


export function usePlaces(filter: PlacesFilter = {}) {
    return useQuery({
        queryKey: queryKeys.places.list(filter),
        queryFn: () => PlacesService.list(filter),
        placeholderData: keepPreviousData,// keepPreviousDataretains the previous list when the filter is changed: isFetching = true, the data are not undefined and the skeleton for !data doesn't blink
    });
}

function useInvalidatePlaces() {//Counters for available spaces in zones depend on the spaces themselves, so the zones also become outdated
    const queryClient = useQueryClient();
    return () =>
        Promise.all([
            queryClient.invalidateQueries({ queryKey: queryKeys.places.all }),
            queryClient.invalidateQueries({ queryKey: queryKeys.zones.all }),
        ]);
}

export function useCreatePlace() {
    const invalidate = useInvalidatePlaces();
    return useMutation({
        mutationFn: (input: CreatePlaceInput) => PlacesService.create(input),
        onSuccess: invalidate,
    });
}

export function useDeletePlace() {
    const invalidate = useInvalidatePlaces();
    return useMutation({
        mutationFn: (id: string) => PlacesService.remove(id),
        onSuccess: invalidate,
    });
}

interface SetStatusVariables {
    id: string;
    status: PlaceStatus;
    repairNote?: string;
}

export function useSetPlaceStatus() {
    const queryClient = useQueryClient();
    const invalidatePlaces = useInvalidatePlaces();

    return useMutation({
        mutationFn: ({ id, status, repairNote }: SetStatusVariables) =>
            PlacesService.setStatus(id, {
                status,
                description: status === "ремонт" ? repairNote : undefined,
            }),
        onSettled: async (_data, _error, { id }) => {// on error
            await Promise.all([
                invalidatePlaces(),
                queryClient.invalidateQueries({ queryKey: queryKeys.repairs.byPlace(id) }),
            ]);
        },
    });
}
