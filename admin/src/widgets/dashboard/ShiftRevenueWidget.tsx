import type { ShiftRevenueValue, WidgetData } from "../../services/dashboard/dashboard.types";
import { WidgetBody, WidgetCard } from "./WidgetCard";

const money = new Intl.NumberFormat("uk-UA", { style: "currency", currency: "UAH" });

interface ShiftRevenueWidgetProps {
    data: WidgetData<ShiftRevenueValue> | undefined;
    dayLabel: string | undefined;
}

export function ShiftRevenueWidget({ data, dayLabel }: ShiftRevenueWidgetProps) {

    const caption = dayLabel
        ? `Поточна календарна доба, ${dayLabel}`
        : "Поточна календарна доба";

    return (
        <WidgetCard title="Виручка за зміну" caption={caption}>
            <WidgetBody data={data}>
                {(value) => (
                    <p className="text-3xl font-semibold tabular-nums text-gray-900">
                        {money.format(value.amount)}
                    </p>
                )}
            </WidgetBody>
        </WidgetCard>
    );
}
