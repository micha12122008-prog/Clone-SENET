import { useState } from "react";
import { Button, Input, QueryState, Select, StatusBadge, Table, type Column } from "../../ui";
import { useBookings } from "../../hooks/bookings/bookings.hooks";
import { useZones } from "../../hooks/zones/zones.hooks";
import type { Booking } from "../../services/bookings/bookings.types";
import { SectionHeader } from "../zones/SectionHeader";
import { BOOKING_STATUS_LABEL, BOOKING_STATUS_TONE, formatDateTime, formatUah } from "./bookings.labels";

const todayLocal = () => {
    const d = new Date();
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

//Reservation registry for a specific date: to view newly created reservations and obtain a token for check-in
export function BookingsRegistrySection({ onFindCheckIn }: { onFindCheckIn: (token: string) => void }) {
    const [date, setDate] = useState(todayLocal);
    const [zoneId, setZoneId] = useState("");

    const zonesQuery = useZones();
    const query = useBookings({ date: date || undefined, zoneId: zoneId || undefined });

    const columns: Column<Booking>[] = [
        { key: "time", header: "Час", render: (b) => `${formatDateTime(b.startTime)} – ${formatDateTime(b.endTime)}` },
        { key: "client", header: "Клієнт", render: (b) => `${b.clientName} · ${b.phone}` },
        { key: "place", header: "Місце", render: (b) => `${b.zoneName}, ${b.computerName}` },
        { key: "tariff", header: "Тариф", render: (b) => b.tariffName },
        { key: "sum", header: "Сума", render: (b) => formatUah(b.prepaidAmount) },
        {
            key: "status",
            header: "Статус",
            render: (b) => (
                <StatusBadge tone={BOOKING_STATUS_TONE[b.status] ?? "neutral"}>
                    {BOOKING_STATUS_LABEL[b.status] ?? b.status}
                </StatusBadge>
            ),
        },
        {
            key: "actions",
            header: "",
            className: "text-right",
            render: (b) =>
                b.qrCode ? (
                    <Button variant="ghost" size="sm" onClick={() => onFindCheckIn(b.qrCode as string)}>
                        Чек-ін
                    </Button>
                ) : null,
        },
    ];

    return (
        <section className="flex flex-col gap-4">
            <SectionHeader
                title="Бронювання"
                isLoading={query.isLoading}
                isFetching={query.isFetching}
                onRefresh={() => void query.refetch()}
            />

            <div className="grid max-w-md grid-cols-2 gap-3">
                <Input type="date" aria-label="Дата" value={date} onChange={(e) => setDate(e.target.value)} />
                <Select aria-label="Фільтр за зоною" value={zoneId} onChange={(e) => setZoneId(e.target.value)}>
                    <option value="">Усі зони</option>
                    {(zonesQuery.data ?? []).map((zone) => (
                        <option key={zone.id} value={zone.id}>
                            {zone.name}
                        </option>
                    ))}
                </Select>
            </div>

            <QueryState query={query}>
                {(bookings) => (
                    <Table
                        columns={columns}
                        data={bookings}
                        getRowId={(b) => b.id}
                        emptyText="Броней на цю дату немає"
                    />
                )}
            </QueryState>
        </section>
    );
}
