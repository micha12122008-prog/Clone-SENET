import type { OccupancyValue, WidgetData } from "../../services/dashboard/dashboard.types";
import { WidgetBody, WidgetCard } from "./WidgetCard";

export function OccupancyWidget({ data }: { data: WidgetData<OccupancyValue> | undefined }) {
    return (
        <WidgetCard title="Завантаженість">
            <WidgetBody data={data}>
                {(value) => (
                    <>
                        <p className="text-3xl font-semibold tabular-nums text-gray-900">{value.percent}%</p>
                        <p className="mt-1 text-xs text-gray-500">
                            {value.busyPlaces} із {value.totalPlaces} місць
                        </p>
                    </>
                )}
            </WidgetBody>
        </WidgetCard>
    );
}
