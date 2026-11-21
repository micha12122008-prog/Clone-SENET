import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { TariffsService } from "../../services/tariffs/tariffs.service";
import type { CreateTariffInput, UpdateTariffInput } from "../../services/tariffs/tariffs.types";
import { queryKeys } from "../queryKeys";

export function useTariffs() {
    return useQuery({
        queryKey: queryKeys.tariffs.list(),
        queryFn: () => TariffsService.list(),
        staleTime: 30_000,
    });
}

export function useCreateTariff() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (input: CreateTariffInput) => TariffsService.create(input),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.tariffs.all }),
    });
}

export function useUpdateTariff() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, input }: { id: string; input: UpdateTariffInput }) =>
            TariffsService.update(id, input),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.tariffs.all }),
    });
}

export function useDeleteTariff() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => TariffsService.remove(id),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.tariffs.all }),
    });
}
