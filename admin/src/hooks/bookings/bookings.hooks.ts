import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { BookingsService } from "../../services/bookings/bookings.service";
import type {
    BookingsFilter,
    CheckInLookup,
    CreateBookingInput,
} from "../../services/bookings/bookings.types";
import { queryKeys } from "../queryKeys";

export function useBookings(filter: BookingsFilter = {}) {
    return useQuery({
        queryKey: queryKeys.bookings.list(filter),
        queryFn: () => BookingsService.list(filter),
        placeholderData: keepPreviousData,//When the filter is changed, the previous list remains, and the skeleton for !data does not blink
    });
}

export function useCreateBooking() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (input: CreateBookingInput) => BookingsService.create(input),
        //A new booking updates both the registry and the check-in result (card retrieved via token/phone number).
        onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.bookings.all }),
    });
}

//Check-in: card lookup. lookup === null — the request hasn't been initiated yet (the form is empty), so enabled: false.
//GET only: does not start a session (Week 4 TT)
export function useCheckIn(lookup: CheckInLookup | null) {
    return useQuery({
        queryKey: queryKeys.bookings.checkIn(lookup),
        queryFn: () => BookingsService.checkIn(lookup as CheckInLookup),
        enabled: lookup !== null,
        staleTime: 0,
    });
}
