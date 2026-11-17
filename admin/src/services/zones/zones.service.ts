import { zonesUrl, zoneUrl } from "../../config/api.config";
import { http } from "../api/http-client";
import { unwrap, type Envelope } from "../api/envelope";
import type { CreateZoneInput, UpdateZoneInput, Zone } from "./zones.types";

//fix від ШІ
/**
 * Бекенд має forbidNonWhitelisted: невідоме поле в тілі дає 400.
 * Поки CreateZoneDto не знає deviceType, його не відправляємо.
 * Коли у backend буде додано поле — змінити на true.
 */
export const BACKEND_ACCEPTS_DEVICE_TYPE: boolean = false;
//

export const ZonesService = {
    async list(): Promise<Zone[]> {
        return unwrap(await http.get<Envelope<Zone[]>>(zonesUrl()));
    },

    async getById(id: string): Promise<Zone> {
        return unwrap(await http.get<Envelope<Zone>>(zoneUrl(id)));
    },

    async create(input: CreateZoneInput): Promise<Zone> {
        const { deviceType, ...body } = input;
        const payload = BACKEND_ACCEPTS_DEVICE_TYPE ? { ...body, deviceType } : body;
        return unwrap(await http.post<Envelope<Zone>>(zonesUrl(), payload));
    },

    async update(id: string, input: UpdateZoneInput): Promise<Zone> {
        return unwrap(await http.patch<Envelope<Zone>>(zoneUrl(id), input));
    },

    async remove(id: string): Promise<void> {
        await http.delete(zoneUrl(id));
    },
};
