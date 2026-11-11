import type { ActiveSessionsValue, WidgetData } from "../../services/dashboard/dashboard.types";
import { WidgetBody, WidgetCard } from "./WidgetCard";

export function ActiveSessionsWidget({ data }: { data: WidgetData<ActiveSessionsValue> | undefined }) {
    return (
        <WidgetCard title="Активні сесії">
            <WidgetBody data={data}>
                {(value) => (
                    <p className="text-3xl font-semibold tabular-nums text-gray-900">{value.count}</p>
                )}
            </WidgetBody>
        </WidgetCard>
    );
}
