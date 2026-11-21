import { useQuery } from "@tanstack/react-query";
import { RepairsService } from "../../services/repairs/repairs.service";
import { queryKeys } from "../queryKeys";

export function useRepairLog(placeId: string | null) {
    return useQuery({
        queryKey: queryKeys.repairs.byPlace(placeId ?? ""),
        queryFn: () => RepairsService.listByPlace(placeId as string),
        enabled: placeId !== null,//for placeId === null (The magazine loads only when there is an open slot)
    });
}
