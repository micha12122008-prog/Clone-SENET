import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { ClientsService } from "../../services/clients/clients.service";
import { queryKeys } from "../queryKeys";

const MIN_SEARCH_LENGTH = 2;

//Searching for a client for a booking from the floor. Fewer than 2 characters — request not sent (enabled: false)
export function useClientSearch(search: string) {
    const term = search.trim();
    return useQuery({
        queryKey: queryKeys.clients.search(term),
        queryFn: () => ClientsService.search(term),
        enabled: term.length >= MIN_SEARCH_LENGTH,
        staleTime: 30_000,
        placeholderData: keepPreviousData,
    });
}
