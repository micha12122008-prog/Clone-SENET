import { usersUrl } from "../../config/api.config";
import { http } from "../api/http-client";
import { unwrap, type Envelope } from "../api/envelope";
import type { ClientsPage } from "./clients.types";

export const ClientsService = {
    //Search by username, email, or phone number (GET /users?search=..., ADMIN only). Players only — role=CLIENT
    async search(search: string, limit = 10): Promise<ClientsPage> {
        return unwrap(
            await http.get<Envelope<ClientsPage>>(usersUrl(), {
                params: { search: search || undefined, role: "CLIENT", limit },
            }),
        );
    },
};
