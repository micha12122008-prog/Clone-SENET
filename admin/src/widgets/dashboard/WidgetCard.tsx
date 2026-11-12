import type { ReactNode } from "react";
import type { WidgetData } from "../../services/dashboard/dashboard.types";

interface WidgetCardProps {
    title: string;
    caption?: string;
    children: ReactNode;
}

export function WidgetCard({ title, caption, children }: WidgetCardProps) {
    return (
        <section
            aria-label={title}
            className="flex min-h-36 flex-col gap-3 rounded-lg border border-gray-200 bg-white p-4"
        >
            <h2 className="text-sm font-medium text-gray-600">{title}</h2>
            <div>{children}</div>
            {caption && <p className="mt-auto text-xs text-gray-500">{caption}</p>}
        </section>
    );
}

interface WidgetBodyProps<T> {
    data: WidgetData<T> | undefined;
    children: (value: T) => ReactNode;
}

export function WidgetBody<T>({ data, children }: WidgetBodyProps<T>) {
    if (data === undefined) {
        return <p className="text-sm text-gray-400">Завантаження…</p>;
    }
    if (data.status === "no-data") {
        return <p className="text-lg font-medium text-gray-400">немає даних</p>;
    }
    return <>{children(data.value)}</>;
}
