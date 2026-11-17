import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { PlacesService } from "../../services/places/places.service";
import type { CreatePlaceInput,  PlaceStatus,  PlacesFilter} from "../../services/places/places.types";
import { RepairsService } from "../../services/repairs/repairs.service";
import type { ApiError } from "../../services/api/http-client";
import { queryKeys } from "../queryKeys";

/**
 * Статус місця читається з API в момент відкриття сторінки, тому staleTime = 0:
 * кожне монтування робить запит, а кеш лише показується, поки він летить.
 * keepPreviousData лишає попередній список при зміні фільтра. Тоді isFetching = true,
 * а data не стає undefined, і скелет за !data не блимає.
 */
export function usePlaces(filter: PlacesFilter = {}) {
    return useQuery({
        queryKey: queryKeys.places.list(filter),
        queryFn: () => PlacesService.list(filter),
        placeholderData: keepPreviousData,
    });
}

/** Лічильники вільних місць у зонах залежать від місць, тож зони теж застарівають. */
function useInvalidatePlaces() {
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
    /** Обов'язкова для статусу «ремонт»: іде в журнал ремонту. */
    repairNote?: string;
}

export function useSetPlaceStatus() {
    const queryClient = useQueryClient();
    const invalidatePlaces = useInvalidatePlaces();

    return useMutation({
        mutationFn: async ({ id, status, repairNote }: SetStatusVariables) => {
            await PlacesService.setStatus(id, status);

            if (status === "MAINTENANCE" && repairNote) {
                try {
                    await RepairsService.add(id, repairNote);
                } catch (e) {
                    const error: ApiError = {
                        status: (e as ApiError).status ?? null,
                        message: `Статус змінено, але запис у журнал ремонту не збережено: ${(e as ApiError).message}`,
                    };
                    throw error;
                }
            }
        },
        // і після помилки списки перечитуємо: статус міг уже змінитися
        onSettled: async (_data, _error, { id }) => {
            await Promise.all([
                invalidatePlaces(),
                queryClient.invalidateQueries({ queryKey: queryKeys.repairs.byPlace(id) }),
            ]);
        },
    });
}
