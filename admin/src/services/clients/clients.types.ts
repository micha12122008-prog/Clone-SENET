//A subset of user fields from GET /users (the backend also returns balance, role, etc. — but the admin panel doesn't need these here)
export interface Client {
    id: string;
    username: string;
    phone: string;
    email: string;
    firstName?: string | null;
    lastName?: string | null;
}

export interface ClientsPage {
    items: Client[];
    total: number;
    page: number;
    limit: number;
}
