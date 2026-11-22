export const postLoginUrl = () => "/auth/login";

// Тиждень 3: зони, місця(/computers), тарифи
export const zonesUrl = () => "/zones";
export const zoneUrl = (id: string) => `/zones/${id}`;

export const placesUrl = () => "/computers";
export const placeUrl = (id: string) => `/computers/${id}`;
export const placeStatusUrl = (id: string) => `/computers/${id}/status`;

export const repairsUrl = () => "/computers/repairs";

export const tariffsUrl = () => "/tariffs";
export const tariffUrl = (id: string) => `/tariffs/${id}`;