import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { RepairsService } from "../../services/repairs/repairs.service";
import { queryKeys } from "../queryKeys";


export function useRepairLog(placeId: string | null) {
    return useQuery({
        queryKey: queryKeys.repairs.byPlace(placeId ?? ""),
        queryFn: () => RepairsService.listByPlace(placeId as string),
        enabled: placeId !== null,//при  placeId === null вимикає запит(журнал вантажиться лише коли відкрито місце)
    });
}

export function useAddRepair(placeId: string) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (description: string) => RepairsService.add(placeId, description),
        onSuccess: () =>
            queryClient.invalidateQueries({ queryKey: queryKeys.repairs.byPlace(placeId) }),
    });
}
