import type { NotificationsValue, WidgetData } from "../../services/dashboard/dashboard.types";
import { WidgetBody, WidgetCard } from "./WidgetCard";

const MAX_ITEMS = 3;

export function NotificationsWidget({ data }: { data: WidgetData<NotificationsValue> | undefined }) {
    return (
        <WidgetCard title="Сповіщення">
            <WidgetBody data={data}>
                {(value) => (
                    <div className="flex flex-col gap-2">
                        <p className="text-3xl font-semibold tabular-nums text-gray-900">{value.unread}</p>
                        {value.items.length > 0 && (
                            <ul className="flex flex-col gap-1 text-sm text-gray-700">
                                {value.items.slice(0, MAX_ITEMS).map((item) => (
                                    <li key={item.id} className="truncate">
                                        {item.title}
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                )}
            </WidgetBody>
        </WidgetCard>
    );
}
