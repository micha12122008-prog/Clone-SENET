import { tariffUrl, tariffsUrl } from "../../config/api.config";
import { http } from "../api/http-client";
import { unwrap, type Envelope } from "../api/envelope";
import type { CreateTariffInput, Tariff, UpdateTariffInput } from "./tariffs.types";

export const TariffsService = {
    async list(): Promise<Tariff[]> {
        return unwrap(await http.get<Envelope<Tariff[]>>(tariffsUrl()));
    },

    async create(input: CreateTariffInput): Promise<Tariff> {
        return unwrap(await http.post<Envelope<Tariff>>(tariffsUrl(), input));
    },

    async update(id: string, input: UpdateTariffInput): Promise<Tariff> {
        return unwrap(await http.patch<Envelope<Tariff>>(tariffUrl(id), input));
    },

    async remove(id: string): Promise<void> {
        await http.delete(tariffUrl(id));
    },
};
