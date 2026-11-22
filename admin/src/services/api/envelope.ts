import type { AxiosResponse } from "axios";
import type { ApiError } from "./http-client";

/** Обгортка, у яку TransformInterceptor бекенду загортає кожну відповідь. */
export interface Envelope<T> {
    success: boolean;
    statusCode: number;
    data: T;
    timestamp: string;
}

// функція надає поля для контролю данних(наприклад скелетів)-{ success, statusCode, data, timestamp }. */
export function unwrap<T>(response: AxiosResponse<Envelope<T> | undefined>): T {
    const body = response.data;

    if (!body || body.data === undefined || body.data === null) {
        const error: ApiError = {
            status: response.status,
            message: "Сервер повернув відповідь у невідомому форматі",
        };
        throw error;
    }

    return body.data;
}
