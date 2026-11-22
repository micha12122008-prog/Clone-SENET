import { repairsUrl } from "../../config/api.config";
import { http } from "../api/http-client";
import { unwrap, type Envelope } from "../api/envelope";
import type { RepairEntry } from "./repairs.types";

export const RepairsService = {
    async listByPlace(placeId: string): Promise<RepairEntry[]> {
        return unwrap(
            await http.get<Envelope<RepairEntry[]>>(repairsUrl(), { params: { placeId } }),
        );
    },
};

//Repair records are created by the backend itself: PATCH /computers/:id/status with the status "repair" and a description
//adds an entry to the log, while the transition from "repair" to "available" closes the active entry
