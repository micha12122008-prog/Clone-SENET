import type { ReactNode } from "react";
import { Button } from "../../ui";

interface SectionHeaderProps {
    title: string;
    isLoading: boolean;
    isFetching: boolean;
    onRefresh: () => void;
    children?: ReactNode;
}

//Заголовок розділу: стан запиту (isFetching), кнопка refetch s дії розділу.
export function SectionHeader({ title, isLoading, isFetching, onRefresh, children }: SectionHeaderProps) {
    return (
        <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
                <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
                {/* фонове оновлення, коли дані вже на екрані */}
                {isFetching && !isLoading && <span className="text-xs text-gray-400">Оновлення…</span>}
            </div>
            <div className="flex items-center gap-2">
                <Button variant="secondary" size="sm" loading={isFetching} onClick={onRefresh}>
                    Оновити
                </Button>
                {children}
            </div>
        </div>
    );
}

export function ActionError({ message }: { message: string | null }) {
    if (!message) return null;
    return (
        <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
            {message}
        </p>
    );
}
