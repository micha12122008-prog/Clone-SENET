import { zonesUrl, zoneUrl } from "../../config/api.config";
import { http } from "../api/http-client";
import { unwrap, type Envelope } from "../api/envelope";
import type { CreateZoneInput, UpdateZoneInput, Zone } from "./zones.types";

export const ZonesService = {
    async list(): Promise<Zone[]> {
        return unwrap(await http.get<Envelope<Zone[]>>(zonesUrl()));
    },

    async getById(id: string): Promise<Zone> {
        return unwrap(await http.get<Envelope<Zone>>(zoneUrl(id)));
    },

    async create(input: CreateZoneInput): Promise<Zone> {
        return unwrap(await http.post<Envelope<Zone>>(zonesUrl(), input));
    },

    async update(id: string, input: UpdateZoneInput): Promise<Zone> {
        return unwrap(await http.patch<Envelope<Zone>>(zoneUrl(id), input));
    },

    async remove(id: string): Promise<void> {
        await http.delete(zoneUrl(id));
    },
};
