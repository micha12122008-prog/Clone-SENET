//Week 4
//Corresponds to BookingsController / mapBookingResponse on the backend (module bookings)

export type BookingStatus = "HOLD" | "CONFIRMED" | "CANCELLED" | "COMPLETED";

export interface BookingExtra {
    id?: string;
    name: string;
    price: number;
    quantity: number;
}

export interface Booking {
    id: string;
    userId: string;
    username: string;
    clientName: string;
    phone: string;
    placeId: string;
    computerName: string;
    computerNumber: number;
    zoneName: string;
    zoneColor: string;
    tariffId: string;
    tariffName: string;
    startTime: string;
    endTime: string;
    isPackage3Plus1: boolean;
    prepaidAmount: number;
    isPaidOnline: boolean;
    qrCode: string | null;
    holdExpiresAt: string | null;
    status: BookingStatus;
    extras: BookingExtra[];
    notes: string | null;
}

export interface BookingsFilter {
    date?: string;//YYYY-MM-DD
    zoneId?: string;
    status?: BookingStatus;
}

//POST /bookings body. Booking from the floor: without `isHold` (immediately `CONFIRMED`), `userId` — the client selected by the admin
export interface CreateBookingInput {
    placeId: string;
    tariffId: string;
    startTime: string;//ISO 8601
    durationHours?: number;//1, 2, or 3; for the 3+1 package, the backend automatically sets it to 4
    isPackage3Plus1?: boolean;
    isPaidOnline?: boolean;
    userId: string;
    notes?: string;
}

//Check-in: either a token/QR code or a phone number (exactly one of these must be in the request)
export type CheckInLookup = { token: string; phone?: undefined } | { phone: string; token?: undefined };

//Check-in card. The backend returns it for both `token` and `phone`. This request does not start a session
export interface CheckInCard {
    bookingId: string;
    clientName: string;
    phone: string;
    username: string;
    zoneName: string;
    zoneColor: string;
    placeNumber: number;
    placeName: string;
    startTime: string;
    endTime: string;
    durationHours: number;
    isPackage3Plus1: boolean;
    prepaidAmount: number;
    isPaidOnline: boolean;
    paymentStatus: string;//ready-to-use text: "Paid online" / "Pay on-site (cash / card)"
    extras: BookingExtra[];
    qrCode: string | null;
    sessionStarted: boolean;
    canCheckIn: boolean;
    message: string;
}
