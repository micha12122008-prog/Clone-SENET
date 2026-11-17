import type { ReactNode } from "react";
import { Button } from "./Button.tsx";

//це QueryState бере з результату useQuery (підходить будь-який useQuery)
interface QueryLike<T> {
    data: T | undefined;
    isError: boolean;
    error: unknown;
    isFetching: boolean;
    refetch: () => unknown;
}

interface QueryStateProps<T> {
    query: QueryLike<T>;
    skeleton?: ReactNode;//показується, поки data === undefined
    children: (data: T) => ReactNode;
}

//коментар інтеграції від ШІ
/**
 * Єдине місце, що вирішує «скелет / помилка / дані» для запиту.
 * Якщо дані вже є (кеш або keepPreviousData), вони лишаються на екрані
 * навіть під час повторного запиту чи його помилки.
 */
export function QueryState<T>({ query, skeleton, children }: QueryStateProps<T>) {
    const { data, isError, error, isFetching, refetch } = query;

    if (data !== undefined) return <>{children(data)}</>;

    if (isError) {
        const message = (error as { message?: string } | null)?.message;
        return (
            <div
                role="alert"
                className="flex items-center justify-between gap-4 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800"
            >
                <span>{message ?? "Не вдалося завантажити дані."}</span>
                <Button variant="secondary" size="sm" loading={isFetching} onClick={() => void refetch()}>
                    Спробувати знову
                </Button>
            </div>
        );
    }

    return <>{skeleton ?? <p className="text-sm text-gray-400">Завантаження…</p>}</>;
}
