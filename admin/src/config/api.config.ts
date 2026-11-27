export const postLoginUrl = () => "/auth/login";

//week 3: zones, place(/computers), tariffs
export const zonesUrl = () => "/zones";
export const zoneUrl = (id: string) => `/zones/${id}`;

export const placesUrl = () => "/computers";
export const placeUrl = (id: string) => `/computers/${id}`;
export const placeStatusUrl = (id: string) => `/computers/${id}/status`;

export const repairsUrl = () => "/computers/repairs";

export const tariffsUrl = () => "/tariffs";
export const tariffUrl = (id: string) => `/tariffs/${id}`;

//week 4: on-site booking і check-in
export const bookingsUrl = () => "/bookings";
export const bookingCheckInUrl = () => "/bookings/check-in";

//Searching for a client for a booking from the floor (ADMIN role is required)
export const usersUrl = () => "/users";
