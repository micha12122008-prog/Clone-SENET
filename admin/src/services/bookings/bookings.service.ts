import { bookingCheckInUrl, bookingsUrl } from "../../config/api.config";
import { http } from "../api/http-client";
import { unwrap, type Envelope } from "../api/envelope";
import type { Booking, BookingsFilter, CheckInCard, CheckInLookup, CreateBookingInput } from "./bookings.types";

export const BookingsService = {
    async list(filter: BookingsFilter = {}): Promise<Booking[]> {
        return unwrap(await http.get<Envelope<Booking[]>>(bookingsUrl(), { params: filter }));
    },

    async create(input: CreateBookingInput): Promise<Booking> {
        return unwrap(await http.post<Envelope<Booking>>(bookingsUrl(), input));
    },

    //Card lookup only: does not start a session (Week 4 TT; receipt printing — Week 5)
    async checkIn(lookup: CheckInLookup): Promise<CheckInCard> {
        return unwrap(await http.get<Envelope<CheckInCard>>(bookingCheckInUrl(), { params: lookup }));
    },
};
