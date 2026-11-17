export const postLoginUrl = () => "/auth/login";

// Тиждень 3: зони, місця(/computers), тарифи
export const zonesUrl = () => "/zones";
export const zoneUrl = (id: string) => `/zones/${id}`;

export const placesUrl = () => "/computers";
export const placeUrl = (id: string) => `/computers/${id}`;
export const placeStatusUrl = (id: string) => `/computers/${id}/status`;

//ендпоінтів не існує на backend(лише модель Repair у Prisma), але наявні у ТЗ admin
export const placeRepairsUrl = (id: string) => `/computers/${id}/repairs`;

export const tariffsUrl = () => "/tariffs";
export const tariffUrl = (id: string) => `/tariffs/${id}`;
