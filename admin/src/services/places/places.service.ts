import { placeStatusUrl, placeUrl, placesUrl } from "../../config/api.config";
import { http } from "../api/http-client";
import { unwrap, type Envelope } from "../api/envelope";
import type {
    CreatePlaceInput,
    Place,
    PlacesFilter,
    SetPlaceStatusInput,
} from "./places.types";

export const PlacesService = {
    async list(filter: PlacesFilter = {}): Promise<Place[]> {
        return unwrap(await http.get<Envelope<Place[]>>(placesUrl(), { params: filter }));
    },

    async getById(id: string): Promise<Place> {
        return unwrap(await http.get<Envelope<Place>>(placeUrl(id)));
    },

    async create(input: CreatePlaceInput): Promise<Place> {
        return unwrap(await http.post<Envelope<Place>>(placesUrl(), input));
    },

    async setStatus(id: string, input: SetPlaceStatusInput): Promise<Place> {
        return unwrap(await http.patch<Envelope<Place>>(placeStatusUrl(id), input));
    },

    async remove(id: string): Promise<void> {
        await http.delete(placeUrl(id));
    },
};
