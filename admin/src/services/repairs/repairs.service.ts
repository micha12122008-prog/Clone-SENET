import { placeRepairsUrl } from "../../config/api.config";
import { http } from "../api/http-client";
import { unwrap, type Envelope } from "../api/envelope";
import type { RepairEntry } from "./repairs.types";

//контракт інсує, але на backend відсутній
export const RepairsService = {
    async listByPlace(placeId: string): Promise<RepairEntry[]> {
        return unwrap(await http.get<Envelope<RepairEntry[]>>(placeRepairsUrl(placeId)));
    },

    async add(placeId: string, description: string): Promise<RepairEntry> {
        return unwrap(
            await http.post<Envelope<RepairEntry>>(placeRepairsUrl(placeId), { description }),
        );
    },
};
